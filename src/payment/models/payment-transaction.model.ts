import { Field, Float, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';
import { PaymentProvider, PaymentTransactionStatus } from '@prisma/client';

@ObjectType()
export class PaymentTransaction {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  transactionId: string;

  @Field(() => Int)
  orderId: number;

  @Field(() => Int)
  userId: number;

  @Field(() => Float)
  amount: number;

  @Field(() => String, { nullable: true })
  currency?: string;

  @Field(() => PaymentProvider)
  provider: PaymentProvider;

  @Field(() => PaymentTransactionStatus)
  status: PaymentTransactionStatus;

  @Field(() => String, { nullable: true })
  paymentIntent?: string;

  @Field(() => String, { nullable: true })
  clientSecret?: string;

  @Field(() => String, { nullable: true })
  redirectUrl?: string;

  @Field(() => String, { nullable: true })
  paymentMethod?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  errorMessage?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field(() => GraphQLISODateTime)
  created_at: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  completedAt?: Date;

  @Field(() => GraphQLISODateTime)
  updated_at: Date;
  
  @Field(() => [PaymentRefund], { nullable: true })
  refunds?: PaymentRefund[];
}

@ObjectType()
export class PaymentRefund {
  @Field(() => ID)
  id: number;

  @Field(() => String)
  refundId: string;

  @Field(() => Int)
  paymentTransactionId: number;

  @Field(() => Float)
  amount: number;

  @Field(() => String, { nullable: true })
  reason?: string;

  @Field(() => String, { nullable: true })
  providerRefundId?: string;

  @Field(() => PaymentTransactionStatus)
  status: PaymentTransactionStatus;

  @Field(() => String, { nullable: true })
  errorMessage?: string;

  @Field(() => Int)
  createdBy: number;

  @Field(() => GraphQLISODateTime)
  created_at: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  completedAt?: Date;

  @Field(() => GraphQLISODateTime)
  updated_at: Date;
}