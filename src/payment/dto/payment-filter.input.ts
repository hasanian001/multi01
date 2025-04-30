import { Field, InputType, Int, Float } from '@nestjs/graphql';
import { PaymentProvider, PaymentTransactionStatus } from '../models/payment-transaction.model';

@InputType()
export class PaymentFilterInput {
  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => PaymentTransactionStatus, { nullable: true })
  status?: PaymentTransactionStatus;

  @Field(() => PaymentProvider, { nullable: true })
  provider?: PaymentProvider;

  @Field(() => Int, { nullable: true })
  orderId?: number;

  @Field(() => String, { nullable: true })
  startDate?: string;

  @Field(() => String, { nullable: true })
  endDate?: string;

  @Field(() => Float, { nullable: true })
  minAmount?: number;

  @Field(() => Float, { nullable: true })
  maxAmount?: number;

  @Field(() => String, { nullable: true })
  search?: string;

  @Field(() => String, { nullable: true })
  sortField?: string;

  @Field(() => String, { nullable: true })
  sortOrder?: 'asc' | 'desc';
}