import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { 
  InitiatePaymentInput, 
  CompletePaymentInput, 
  RefundPaymentInput, 
  PaymentStatusInput, 
  PaymentFilterInput 
} from './dto/payment.dto';
import { PaymentProvider, PaymentTransactionStatus } from './entities/payment.entity';
import { User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // Get all payments with filtering options
  async findAll(filterInput: PaymentFilterInput) {
    const {
      userId,
      orderId,
      transactionId,
      provider,
      status,
      startDate,
      endDate,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      ...(userId && { userId }),
      ...(orderId && { orderId }),
      ...(transactionId && { transactionId }),
      ...(provider && { provider }),
      ...(status && { status }),
    };

    // Add date range filter
    if (startDate || endDate) {
      where.created_at = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    // Get total count for pagination
    const count = await this.prisma.paymentTransaction.count({ where });

    // Get payments with applied filters
    const payments = await this.prisma.paymentTransaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      payments,
      count,
      success: true,
      message: 'Payments fetched successfully',
    };
  }

  // Get payment by ID
  async findOne(id: number) {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return {
      payment,
      success: true,
      message: 'Payment fetched successfully',
    };
  }

  // Get payment by transaction ID
  async findByTransactionId(transactionId: string) {
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: { transactionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with transaction ID ${transactionId} not found`);
    }

    return {
      payment,
      success: true,
      message: 'Payment fetched successfully',
    };
  }

  // Initiate a payment
  async initiatePayment(initiatePaymentInput: InitiatePaymentInput, user: User) {
    const { orderId, provider, returnUrl, cancelUrl, paymentMethod, metadata } = initiatePaymentInput;

    // Check if order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Check if order belongs to the user
    if (order.userId !== user.id) {
      throw new BadRequestException('You can only make payments for your own orders');
    }

    // Check if order is already paid
    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('This order is already paid');
    }

    // Generate a unique transaction ID
    const transactionId = `TXNID-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create a new payment transaction
    const payment = await this.prisma.paymentTransaction.create({
      data: {
        userId: user.id,
        orderId,
        transactionId,
        provider,
        amount: order.total,
        status: PaymentTransactionStatus.PENDING,
        paymentMethod: paymentMethod || null,
        currency: 'USD', // Default currency
        metadata: metadata || {},
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
          },
        },
      },
    });

    // Process payment based on the selected provider
    let redirectUrl = null;
    let clientSecret = null;

    try {
      switch (provider) {
        case PaymentProvider.STRIPE:
          const result = await this.processStripePayment(payment, returnUrl);
          clientSecret = result.clientSecret;
          break;

        case PaymentProvider.PAYPAL:
          redirectUrl = await this.processPayPalPayment(payment, returnUrl, cancelUrl);
          break;

        case PaymentProvider.SSLCOMMERZ:
          redirectUrl = await this.processSSLCommerzPayment(payment, returnUrl, cancelUrl);
          break;

        case PaymentProvider.BANK_TRANSFER:
          // For bank transfer, we just create the payment record
          // and wait for manual verification
          break;

        case PaymentProvider.CASH_ON_DELIVERY:
          // For COD, we mark the payment as pending and update it upon delivery
          break;

        default:
          throw new BadRequestException(`Payment provider ${provider} is not supported`);
      }

      return {
        payment,
        redirectUrl,
        clientSecret,
        success: true,
        message: 'Payment initiated successfully',
      };
    } catch (error) {
      // Update payment status to FAILED if there was an error
      await this.prisma.paymentTransaction.update({
        where: { id: payment.id },
        data: {
          status: PaymentTransactionStatus.FAILED,
          metadata: {
            ...payment.metadata,
            error: error.message,
          },
        },
      });

      throw new InternalServerErrorException(`Failed to initiate payment: ${error.message}`);
    }
  }

  // Complete a payment (callback from payment gateway)
  async completePayment(completePaymentInput: CompletePaymentInput) {
    const { paymentId, transactionId, status, metadata } = completePaymentInput;

    // Find payment transaction
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (payment.transactionId !== transactionId) {
      throw new BadRequestException('Transaction ID mismatch');
    }

    // Update payment status
    const updatedPayment = await this.prisma.paymentTransaction.update({
      where: { id: paymentId },
      data: {
        status,
        metadata: {
          ...payment.metadata,
          ...metadata,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
          },
        },
      },
    });

    // Update order payment status if payment was successful
    if (status === PaymentTransactionStatus.SUCCESS) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
        },
      });
    } else if (status === PaymentTransactionStatus.FAILED) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'FAILED',
        },
      });
    }

    return {
      payment: updatedPayment,
      success: true,
      message: `Payment ${status.toLowerCase()} successfully`,
    };
  }

  // Process refund
  async refundPayment(refundPaymentInput: RefundPaymentInput, user: User) {
    const { paymentId, amount, reason } = refundPaymentInput;

    // Find payment transaction
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    // Check if payment is already refunded
    if (payment.status === PaymentTransactionStatus.REFUNDED) {
      throw new BadRequestException('This payment is already refunded');
    }

    // Check if payment was successful
    if (payment.status !== PaymentTransactionStatus.SUCCESS) {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    // Check if user is admin or the payment belongs to this user
    if (user.role !== 'ADMIN' && payment.userId !== user.id) {
      throw new BadRequestException('You are not authorized to refund this payment');
    }

    const refundAmount = amount || payment.amount;
    const refundId = `REFUND-${uuidv4().substring(0, 8).toUpperCase()}`;

    try {
      // Process refund based on payment provider
      switch (payment.provider) {
        case PaymentProvider.STRIPE:
          await this.processStripeRefund(payment, refundAmount, refundId);
          break;

        case PaymentProvider.PAYPAL:
          await this.processPayPalRefund(payment, refundAmount, refundId);
          break;

        case PaymentProvider.SSLCOMMERZ:
          await this.processSSLCommerzRefund(payment, refundAmount, refundId);
          break;

        case PaymentProvider.BANK_TRANSFER:
        case PaymentProvider.CASH_ON_DELIVERY:
          // For manual payment methods, we just update the records
          break;

        default:
          throw new BadRequestException(`Refund for provider ${payment.provider} is not supported`);
      }

      // Update payment status
      const updatedPayment = await this.prisma.paymentTransaction.update({
        where: { id: paymentId },
        data: {
          status: PaymentTransactionStatus.REFUNDED,
          refundId,
          metadata: {
            ...payment.metadata,
            refundAmount,
            refundReason: reason || 'Customer requested refund',
            refundDate: new Date(),
          },
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              status: true,
            },
          },
        },
      });

      // Update order status
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'REFUNDED',
          paymentStatus: 'REFUNDED',
        },
      });

      return {
        payment: updatedPayment,
        success: true,
        message: 'Payment refunded successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to process refund: ${error.message}`);
    }
  }

  // Check payment status
  async checkPaymentStatus(paymentStatusInput: PaymentStatusInput) {
    const { transactionId } = paymentStatusInput;

    try {
      const payment = await this.findByTransactionId(transactionId);
      return {
        payment: payment.payment,
        success: true,
        message: `Payment status: ${payment.payment.status}`,
      };
    } catch (error) {
      throw new NotFoundException(`Payment with transaction ID ${transactionId} not found`);
    }
  }

  // Process Stripe payment
  private async processStripePayment(payment, returnUrl) {
    // In a real implementation, this would use the Stripe API
    // For now, we'll simulate the process
    
    // The client secret would be created using Stripe's API in a real implementation
    const clientSecret = `stripe_test_${payment.id}_${Date.now()}`;
    
    return { clientSecret };
  }

  // Process PayPal payment
  private async processPayPalPayment(payment, returnUrl, cancelUrl) {
    // In a real implementation, this would use the PayPal API
    // For now, we'll simulate the process
    
    // The redirect URL would be obtained from PayPal's API in a real implementation
    const redirectUrl = `https://paypal.com/checkout?orderId=${payment.orderId}&amount=${payment.amount}&returnUrl=${returnUrl}&cancelUrl=${cancelUrl}`;
    
    return redirectUrl;
  }

  // Process SSLCommerz payment
  private async processSSLCommerzPayment(payment, returnUrl, cancelUrl) {
    // In a real implementation, this would use the SSLCommerz API
    // For now, we'll simulate the process
    
    // The redirect URL would be obtained from SSLCommerz's API in a real implementation
    const redirectUrl = `https://sslcommerz.com/pay?tran_id=${payment.transactionId}&amount=${payment.amount}&success_url=${returnUrl}&fail_url=${cancelUrl}`;
    
    return redirectUrl;
  }

  // Process Stripe refund
  private async processStripeRefund(payment, amount, refundId) {
    // In a real implementation, this would use the Stripe API
    // For now, we'll simulate the process
    
    // This would be handled by Stripe's API in a real implementation
    return true;
  }

  // Process PayPal refund
  private async processPayPalRefund(payment, amount, refundId) {
    // In a real implementation, this would use the PayPal API
    // For now, we'll simulate the process
    
    // This would be handled by PayPal's API in a real implementation
    return true;
  }

  // Process SSLCommerz refund
  private async processSSLCommerzRefund(payment, amount, refundId) {
    // In a real implementation, this would use the SSLCommerz API
    // For now, we'll simulate the process
    
    // This would be handled by SSLCommerz's API in a real implementation
    return true;
  }
}