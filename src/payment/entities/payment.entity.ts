import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  SSLCOMMERZ = 'SSLCOMMERZ',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

export enum PaymentTransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(PaymentProvider, {
  name: 'PaymentProvider',
  description: 'Payment provider options',
});

registerEnumType(PaymentTransactionStatus, {
  name: 'PaymentTransactionStatus',
  description: 'Status of payment transaction',
});

@ObjectType()
export class PaymentTransaction {
  @Field(() => ID)
  id: number;

  @Field(() => ID)
  userId: number;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => ID)
  orderId: number;

  @Field(() => Order, { nullable: true })
  order?: Order;

  @Field()
  transactionId: string;

  @Field(() => PaymentProvider)
  provider: PaymentProvider;

  @Field(() => Float)
  amount: number;

  @Field(() => Float, { nullable: true })
  fee?: number;

  @Field(() => PaymentTransactionStatus)
  status: PaymentTransactionStatus;

  @Field({ nullable: true })
  paymentMethod?: string;

  @Field({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  billingAddress?: string;

  @Field({ nullable: true })
  paymentIntent?: string;

  @Field({ nullable: true })
  receiptUrl?: string;

  @Field({ nullable: true })
  refundId?: string;

  @Field(() => Object, { nullable: true })
  metadata?: Record<string, any>;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

@ObjectType()
export class PaymentResponse {
  @Field(() => PaymentTransaction, { nullable: true })
  payment?: PaymentTransaction;

  @Field({ nullable: true })
  redirectUrl?: string;

  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class PaymentsResponse {
  @Field(() => [PaymentTransaction])
  payments: PaymentTransaction[];

  @Field()
  count: number;

  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class InitiatePaymentResponse {
  @Field(() => PaymentTransaction, { nullable: true })
  payment?: PaymentTransaction;

  @Field({ nullable: true })
  redirectUrl?: string;

  @Field({ nullable: true })
  clientSecret?: string;

  @Field()
  success: boolean;

  @Field()
  message: string;
}