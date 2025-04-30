import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PaymentStatus } from '@prisma/client';
import { 
  PaymentProvider, 
  PaymentTransactionStatus 
} from './models/payment-transaction.model';
import type { PaymentTransaction, PaymentRefund } from './models/payment-transaction.model';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProviderFactory } from './payment-provider.factory';
import { PaymentFilterInput } from './dto/payment-filter.input';
import { InitiatePaymentInput } from './dto/initiate-payment.input';
import { CompletePaymentInput } from './dto/complete-payment.input';
import { RefundPaymentInput } from './dto/refund-payment.input';
import { PaymentStatusInput } from './dto/payment-status.input';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/entities/user.entity';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private paymentProviderFactory: PaymentProviderFactory,
  ) {}

  async findAll(filterInput: PaymentFilterInput) {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      provider,
      orderId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortField = 'created_at',
      sortOrder = 'desc'
    } = filterInput;

    const skip = (page - 1) * limit;
    
    // Build the where conditions
    const where: Prisma.PaymentTransactionWhereInput = {};
    
    if (status) {
      where.status = status;
    }
    
    if (provider) {
      where.provider = provider;
    }
    
    if (orderId) {
      where.orderId = orderId;
    }
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.created_at.lte = new Date(endDate);
      }
    }
    
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = minAmount;
      }
      if (maxAmount) {
        where.amount.lte = maxAmount;
      }
    }
    
    if (search) {
      where.OR = [
        { transactionId: { contains: search, mode: 'insensitive' } },
        { paymentIntent: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build sort order
    const orderBy: Prisma.PaymentTransactionOrderByWithRelationInput = {};
    orderBy[sortField as keyof Prisma.PaymentTransactionOrderByWithRelationInput] = sortOrder;

    // Get total count for pagination
    const total = await this.prisma.paymentTransaction.count({ where });
    
    // Get payments with pagination
    const payments = await this.prisma.paymentTransaction.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        order: true,
        refunds: true,
      },
    });

    return {
      data: payments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { id },
      include: {
        order: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw new Error(`Payment transaction with ID ${id} not found`);
    }

    return payment;
  }

  async findByTransactionId(transactionId: string) {
    const payment = await this.prisma.paymentTransaction.findUnique({
      where: { transactionId },
      include: {
        order: true,
        refunds: true,
      },
    });

    if (!payment) {
      throw new Error(`Payment transaction with ID ${transactionId} not found`);
    }

    return payment;
  }

  async initiatePayment(initiatePaymentInput: InitiatePaymentInput, user: User) {
    const { 
      orderId, 
      amount, 
      currency = 'USD', 
      provider, 
      description,
      metadata = {},
      returnUrl,
      cancelUrl,
    } = initiatePaymentInput;

    this.logger.log(`Initiating payment for order ${orderId} with provider ${provider}`);

    // Create a payment transaction in the database
    const transactionId = uuidv4();
    
    const paymentTransaction = await this.prisma.paymentTransaction.create({
      data: {
        transactionId,
        orderId,
        amount,
        currency,
        provider,
        status: PaymentTransactionStatus.PENDING,
        description,
        metadata,
        userId: user.id,
      },
    });

    // Use the appropriate payment provider to create a payment intent
    try {
      const paymentProvider = this.paymentProviderFactory.getProvider(provider);
      
      // Add user information to metadata
      const extendedMetadata = {
        ...metadata,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
      };

      let paymentResult;
      
      switch (provider) {
        case PaymentProvider.STRIPE:
          paymentResult = await this.processStripePayment(
            paymentTransaction, 
            returnUrl
          );
          break;
          
        case PaymentProvider.PAYPAL:
          paymentResult = await this.processPayPalPayment(
            paymentTransaction, 
            returnUrl, 
            cancelUrl
          );
          break;
          
        case PaymentProvider.SSLCOMMERZ:
          paymentResult = await this.processSSLCommerzPayment(
            paymentTransaction, 
            returnUrl, 
            cancelUrl
          );
          break;
          
        default:
          paymentResult = await paymentProvider.createPaymentIntent(
            amount,
            currency,
            paymentTransaction,
            extendedMetadata,
            returnUrl,
            cancelUrl,
          );
      }

      // Update the payment transaction with the payment intent ID
      if (paymentResult.success) {
        await this.prisma.paymentTransaction.update({
          where: { id: paymentTransaction.id },
          data: {
            paymentIntent: paymentResult.paymentIntent,
            clientSecret: paymentResult.clientSecret,
            redirectUrl: paymentResult.redirectUrl,
          },
        });
      } else {
        // Mark the payment as failed
        await this.prisma.paymentTransaction.update({
          where: { id: paymentTransaction.id },
          data: {
            status: PaymentTransactionStatus.FAILED,
            errorMessage: paymentResult.message,
          },
        });
      }

      return {
        ...paymentTransaction,
        paymentIntent: paymentResult.paymentIntent,
        clientSecret: paymentResult.clientSecret,
        redirectUrl: paymentResult.redirectUrl,
        success: paymentResult.success,
        message: paymentResult.message,
      };
    } catch (error) {
      this.logger.error(`Error initiating payment: ${error.message}`, error.stack);
      
      // Update the payment record with error information
      await this.prisma.paymentTransaction.update({
        where: { id: paymentTransaction.id },
        data: {
          status: PaymentTransactionStatus.FAILED,
          errorMessage: error.message,
        },
      });

      throw new Error(`Failed to initiate payment: ${error.message}`);
    }
  }

  async completePayment(completePaymentInput: CompletePaymentInput) {
    const { transactionId, paymentIntent, paymentMethod, paymentStatus, metadata = {} } = completePaymentInput;

    this.logger.log(`Completing payment for transaction ${transactionId}`);

    try {
      // Get the payment transaction
      const paymentTransaction = await this.prisma.paymentTransaction.findUnique({
        where: { transactionId },
      });

      if (!paymentTransaction) {
        throw new Error(`Payment transaction ${transactionId} not found`);
      }

      // Determine the new status
      let newStatus = paymentTransaction.status;
      if (paymentStatus === 'success') {
        newStatus = PaymentTransactionStatus.SUCCESS;
      } else if (paymentStatus === 'failed') {
        newStatus = PaymentTransactionStatus.FAILED;
      } else if (paymentStatus === 'cancelled') {
        newStatus = PaymentTransactionStatus.CANCELLED;
      }

      // Update the payment transaction
      const updatedPayment = await this.prisma.paymentTransaction.update({
        where: { id: paymentTransaction.id },
        data: {
          status: newStatus,
          paymentMethod: paymentMethod || paymentTransaction.paymentMethod,
          completedAt: newStatus === PaymentTransactionStatus.SUCCESS ? new Date() : null,
          metadata: {
            ...paymentTransaction.metadata,
            ...metadata,
          },
        },
        include: {
          order: true,
        }
      });

      // Update the order status if payment is successful
      if (newStatus === PaymentTransactionStatus.SUCCESS && updatedPayment.order) {
        await this.prisma.order.update({
          where: { id: updatedPayment.orderId },
          data: {
            payment_status: PaymentStatus.PAID,
            // You might also want to update the order status based on your business logic
            // status: OrderStatus.PROCESSING,
          },
        });
      }

      return updatedPayment;
    } catch (error) {
      this.logger.error(`Error completing payment: ${error.message}`, error.stack);
      throw new Error(`Failed to complete payment: ${error.message}`);
    }
  }

  async refundPayment(refundPaymentInput: RefundPaymentInput, user: User) {
    const { transactionId, amount, reason } = refundPaymentInput;

    this.logger.log(`Processing refund for transaction ${transactionId}`);

    try {
      // Get the payment transaction
      const paymentTransaction = await this.prisma.paymentTransaction.findUnique({
        where: { transactionId },
      });

      if (!paymentTransaction) {
        throw new Error(`Payment transaction ${transactionId} not found`);
      }

      // Check if payment is eligible for refund
      if (paymentTransaction.status !== PaymentTransactionStatus.SUCCESS) {
        throw new Error(`Payment transaction ${transactionId} is not eligible for refund`);
      }

      // Calculate the total refunded amount so far
      const refundedSoFar = await this.prisma.paymentRefund.aggregate({
        where: { paymentTransactionId: paymentTransaction.id },
        _sum: {
          amount: true,
        },
      });

      const totalRefunded = refundedSoFar._sum.amount || 0;
      const refundableAmount = paymentTransaction.amount - totalRefunded;

      // Check if the refund amount is valid
      if (amount > refundableAmount) {
        throw new Error(`Refund amount exceeds the refundable amount: ${refundableAmount}`);
      }

      // Generate a unique refund ID
      const refundId = `ref_${uuidv4()}`;

      // Create the refund record in the database
      const refund = await this.prisma.paymentRefund.create({
        data: {
          refundId,
          amount,
          reason,
          status: PaymentTransactionStatus.PENDING,
          paymentTransactionId: paymentTransaction.id,
          createdBy: user.id,
        },
      });

      // Process the refund through the payment provider
      let refundResult;
      
      switch (paymentTransaction.provider) {
        case PaymentProvider.STRIPE:
          refundResult = await this.processStripeRefund(
            paymentTransaction, 
            amount, 
            refundId
          );
          break;
          
        case PaymentProvider.PAYPAL:
          refundResult = await this.processPayPalRefund(
            paymentTransaction, 
            amount, 
            refundId
          );
          break;
          
        case PaymentProvider.SSLCOMMERZ:
          refundResult = await this.processSSLCommerzRefund(
            paymentTransaction, 
            amount, 
            refundId
          );
          break;
          
        default:
          const paymentProvider = this.paymentProviderFactory.getProvider(paymentTransaction.provider);
          refundResult = await paymentProvider.refundPayment(
            paymentTransaction,
            amount,
            reason,
          );
      }

      // Update the refund record with the result
      const updatedRefund = await this.prisma.paymentRefund.update({
        where: { id: refund.id },
        data: {
          status: refundResult.success 
            ? PaymentTransactionStatus.SUCCESS 
            : PaymentTransactionStatus.FAILED,
          providerRefundId: refundResult.refundId,
          errorMessage: refundResult.success ? null : refundResult.message,
          completedAt: refundResult.success ? new Date() : null,
        },
        include: {
          paymentTransaction: true,
        },
      });

      // Update the payment transaction status if it's fully refunded
      if (refundResult.success) {
        const updatedTotalRefunded = totalRefunded + amount;
        
        if (updatedTotalRefunded >= paymentTransaction.amount) {
          await this.prisma.paymentTransaction.update({
            where: { id: paymentTransaction.id },
            data: {
              status: PaymentTransactionStatus.REFUNDED,
            },
          });
        } else if (updatedTotalRefunded > 0) {
          await this.prisma.paymentTransaction.update({
            where: { id: paymentTransaction.id },
            data: {
              status: PaymentTransactionStatus.PARTIALLY_REFUNDED,
            },
          });
        }
      }

      return updatedRefund;
    } catch (error) {
      this.logger.error(`Error processing refund: ${error.message}`, error.stack);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  async checkPaymentStatus(paymentStatusInput: PaymentStatusInput) {
    const { transactionId } = paymentStatusInput;

    this.logger.log(`Checking payment status for transaction ${transactionId}`);

    try {
      // Get the payment transaction
      const paymentTransaction = await this.prisma.paymentTransaction.findUnique({
        where: { transactionId },
      });

      if (!paymentTransaction) {
        throw new Error(`Payment transaction ${transactionId} not found`);
      }

      // Get the payment provider
      const paymentProvider = this.paymentProviderFactory.getProvider(paymentTransaction.provider);
      
      // Check the payment status with the provider
      const statusResult = await paymentProvider.retrievePaymentStatus(paymentTransaction);

      // If the status has changed, update the transaction
      if (statusResult.success && statusResult.status !== paymentTransaction.status) {
        await this.prisma.paymentTransaction.update({
          where: { id: paymentTransaction.id },
          data: {
            status: statusResult.status,
            metadata: {
              ...paymentTransaction.metadata,
              lastStatusCheck: new Date().toISOString(),
              providerResponseDetails: statusResult.paymentDetails,
            },
          },
        });

        // If payment is now successful, update the order
        if (statusResult.status === PaymentTransactionStatus.SUCCESS) {
          await this.prisma.order.update({
            where: { id: paymentTransaction.orderId },
            data: {
              payment_status: PaymentStatus.PAID,
              // You might also want to update the order status based on your business logic
              // status: OrderStatus.PROCESSING,
            },
          });
        }
      }

      return {
        ...paymentTransaction,
        currentStatus: statusResult.status,
        success: statusResult.success,
        message: statusResult.message,
        details: statusResult.paymentDetails,
      };
    } catch (error) {
      this.logger.error(`Error checking payment status: ${error.message}`, error.stack);
      throw new Error(`Failed to check payment status: ${error.message}`);
    }
  }

  // Provider-specific payment processing methods
  private async processStripePayment(payment, returnUrl) {
    const paymentProvider = this.paymentProviderFactory.getProvider(PaymentProvider.STRIPE);
    return await paymentProvider.createPaymentIntent(
      payment.amount,
      payment.currency,
      payment,
      payment.metadata,
      returnUrl,
    );
  }

  private async processPayPalPayment(payment, returnUrl, cancelUrl) {
    const paymentProvider = this.paymentProviderFactory.getProvider(PaymentProvider.PAYPAL);
    return await paymentProvider.createPaymentIntent(
      payment.amount,
      payment.currency,
      payment,
      payment.metadata,
      returnUrl,
      cancelUrl,
    );
  }

  private async processSSLCommerzPayment(payment, returnUrl, cancelUrl) {
    const paymentProvider = this.paymentProviderFactory.getProvider(PaymentProvider.SSLCOMMERZ);
    return await paymentProvider.createPaymentIntent(
      payment.amount,
      payment.currency,
      payment,
      payment.metadata,
      returnUrl,
      cancelUrl,
    );
  }

  // Provider-specific refund processing methods
  private async processStripeRefund(payment, amount, refundId) {
    const paymentProvider = this.paymentProviderFactory.getProvider(PaymentProvider.STRIPE);
    return await paymentProvider.refundPayment(
      payment,
      amount,
      `Refund for ${refundId}`,
    );
  }

  private async processPayPalRefund(payment, amount, refundId) {
    const paymentProvider = this.paymentProviderFactory.getProvider(PaymentProvider.PAYPAL);
    return await paymentProvider.refundPayment(
      payment,
      amount,
      `Refund for ${refundId}`,
    );
  }

  private async processSSLCommerzRefund(payment, amount, refundId) {
    const paymentProvider = this.paymentProviderFactory.getProvider(PaymentProvider.SSLCOMMERZ);
    return await paymentProvider.refundPayment(
      payment,
      amount,
      `Refund for ${refundId}`,
    );
  }
}