import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PaymentService } from './payment.service';
import { PaymentTransaction } from './models/payment-transaction.model';
import { 
  PaymentResponse, 
  PaymentsResponse, 
  InitiatePaymentResponse, 
  RefundResponse,
  PaymentStatusResponse
} from './models/payment-response.model';
import { PaymentFilterInput } from './dto/payment-filter.input';
import { InitiatePaymentInput } from './dto/initiate-payment.input';
import { CompletePaymentInput } from './dto/complete-payment.input';
import { RefundPaymentInput } from './dto/refund-payment.input';
import { PaymentStatusInput } from './dto/payment-status.input';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '@prisma/client';

@Resolver(() => PaymentTransaction)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Query(() => PaymentsResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  async payments(
    @Args('filterInput', { nullable: true }) filterInput?: PaymentFilterInput,
  ): Promise<PaymentsResponse> {
    try {
      const paymentsData = await this.paymentService.findAll(filterInput || {});
      return {
        ...paymentsData,
        success: true,
        message: 'Payments retrieved successfully',
      };
    } catch (error) {
      return {
        data: [],
        pagination: {
          total: 0,
          page: filterInput?.page || 1,
          limit: filterInput?.limit || 10,
          pages: 0,
        },
        success: false,
        message: error.message,
      };
    }
  }

  @Query(() => PaymentResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER', 'USER')
  async payment(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: User,
  ): Promise<PaymentResponse> {
    try {
      const payment = await this.paymentService.findOne(id);
      
      // Check if user is authorized to view this payment
      if (user.role === 'USER' && payment.userId !== user.id) {
        throw new Error('You are not authorized to view this payment');
      }
      
      return {
        payment,
        success: true,
        message: 'Payment retrieved successfully',
      };
    } catch (error) {
      return {
        payment: null,
        success: false,
        message: error.message,
      };
    }
  }

  @Query(() => PaymentResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER', 'USER')
  async paymentByTransactionId(
    @Args('transactionId', { type: () => String }) transactionId: string,
    @CurrentUser() user: User,
  ): Promise<PaymentResponse> {
    try {
      const payment = await this.paymentService.findByTransactionId(transactionId);
      
      // Check if user is authorized to view this payment
      if (user.role === 'USER' && payment.userId !== user.id) {
        throw new Error('You are not authorized to view this payment');
      }
      
      return {
        payment,
        success: true,
        message: 'Payment retrieved successfully',
      };
    } catch (error) {
      return {
        payment: null,
        success: false,
        message: error.message,
      };
    }
  }

  @Mutation(() => InitiatePaymentResponse)
  @UseGuards(AuthGuard)
  async initiatePayment(
    @Args('initiatePaymentInput') initiatePaymentInput: InitiatePaymentInput,
    @CurrentUser() user: User,
  ): Promise<InitiatePaymentResponse> {
    try {
      const result = await this.paymentService.initiatePayment(initiatePaymentInput, user);
      
      return {
        payment: result,
        paymentIntent: result.paymentIntent,
        clientSecret: result.clientSecret,
        redirectUrl: result.redirectUrl,
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      return {
        payment: null,
        success: false,
        message: error.message,
      };
    }
  }

  @Mutation(() => PaymentResponse)
  @UseGuards(AuthGuard)
  async completePayment(
    @Args('completePaymentInput') completePaymentInput: CompletePaymentInput,
  ): Promise<PaymentResponse> {
    try {
      const payment = await this.paymentService.completePayment(completePaymentInput);
      
      return {
        payment,
        success: true,
        message: 'Payment completed successfully',
      };
    } catch (error) {
      return {
        payment: null,
        success: false,
        message: error.message,
      };
    }
  }

  @Mutation(() => RefundResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  async refundPayment(
    @Args('refundPaymentInput') refundPaymentInput: RefundPaymentInput,
    @CurrentUser() user: User,
  ): Promise<RefundResponse> {
    try {
      const refund = await this.paymentService.refundPayment(refundPaymentInput, user);
      
      return {
        payment: refund.paymentTransaction,
        refundId: refund.refundId,
        success: true,
        message: 'Refund processed successfully',
      };
    } catch (error) {
      return {
        payment: null,
        refundId: null,
        success: false,
        message: error.message,
      };
    }
  }

  @Query(() => PaymentStatusResponse)
  @UseGuards(AuthGuard)
  async checkPaymentStatus(
    @Args('paymentStatusInput') paymentStatusInput: PaymentStatusInput,
    @CurrentUser() user: User,
  ): Promise<PaymentStatusResponse> {
    try {
      const result = await this.paymentService.checkPaymentStatus(paymentStatusInput);
      
      // Check if user is authorized to view this payment status
      if (user.role === 'USER' && result.userId !== user.id) {
        throw new Error('You are not authorized to check this payment status');
      }
      
      return {
        payment: result,
        currentStatus: result.currentStatus,
        success: result.success,
        message: result.message,
        details: result.details,
      };
    } catch (error) {
      return {
        payment: null,
        currentStatus: 'UNKNOWN',
        success: false,
        message: error.message,
      };
    }
  }
}