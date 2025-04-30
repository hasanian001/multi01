import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { 
  PaymentTransaction, 
  PaymentResponse, 
  PaymentsResponse, 
  InitiatePaymentResponse 
} from './entities/payment.entity';
import {
  InitiatePaymentInput,
  CompletePaymentInput,
  RefundPaymentInput,
  PaymentStatusInput,
  PaymentFilterInput
} from './dto/payment.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => PaymentTransaction)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Query(() => PaymentsResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async payments(
    @Args('filterInput', { nullable: true }) filterInput?: PaymentFilterInput,
  ): Promise<PaymentsResponse> {
    return this.paymentService.findAll(filterInput || {});
  }

  @Query(() => PaymentResponse)
  @UseGuards(AuthGuard)
  async payment(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<PaymentResponse> {
    const result = await this.paymentService.findOne(id);
    
    // Only admin or the payment owner can access payment details
    if (user.role !== 'ADMIN' && result.payment.userId !== user.id) {
      return {
        success: false,
        message: 'You are not authorized to view this payment',
      };
    }
    
    return result;
  }

  @Query(() => PaymentResponse)
  @UseGuards(AuthGuard)
  async paymentByTransactionId(
    @Args('transactionId') transactionId: string,
    @CurrentUser() user,
  ): Promise<PaymentResponse> {
    const result = await this.paymentService.findByTransactionId(transactionId);
    
    // Only admin or the payment owner can access payment details
    if (user.role !== 'ADMIN' && result.payment.userId !== user.id) {
      return {
        success: false,
        message: 'You are not authorized to view this payment',
      };
    }
    
    return result;
  }

  @Mutation(() => InitiatePaymentResponse)
  @UseGuards(AuthGuard)
  async initiatePayment(
    @Args('initiatePaymentInput') initiatePaymentInput: InitiatePaymentInput,
    @CurrentUser() user,
  ): Promise<InitiatePaymentResponse> {
    return this.paymentService.initiatePayment(initiatePaymentInput, user);
  }

  @Mutation(() => PaymentResponse)
  @UseGuards(AuthGuard)
  async completePayment(
    @Args('completePaymentInput') completePaymentInput: CompletePaymentInput,
  ): Promise<PaymentResponse> {
    return this.paymentService.completePayment(completePaymentInput);
  }

  @Mutation(() => PaymentResponse)
  @UseGuards(AuthGuard)
  async refundPayment(
    @Args('refundPaymentInput') refundPaymentInput: RefundPaymentInput,
    @CurrentUser() user,
  ): Promise<PaymentResponse> {
    return this.paymentService.refundPayment(refundPaymentInput, user);
  }

  @Query(() => PaymentResponse)
  @UseGuards(AuthGuard)
  async checkPaymentStatus(
    @Args('paymentStatusInput') paymentStatusInput: PaymentStatusInput,
  ): Promise<PaymentResponse> {
    return this.paymentService.checkPaymentStatus(paymentStatusInput);
  }
}