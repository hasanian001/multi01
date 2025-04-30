import { InputType, Field, ID, Float, Int } from '@nestjs/graphql';
import { IsString, IsEnum, IsNumber, IsPositive, IsOptional, IsISO8601, IsObject, Min, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentProvider, PaymentTransactionStatus } from '../entities/payment.entity';

@InputType()
export class InitiatePaymentInput {
  @Field(() => ID)
  @IsString()
  @IsPositive()
  orderId: number;

  @Field(() => PaymentProvider)
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @Field(() => Object, { nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

@InputType()
export class CompletePaymentInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  paymentId: number;

  @Field()
  @IsString()
  transactionId: string;

  @Field(() => PaymentTransactionStatus)
  @IsEnum(PaymentTransactionStatus)
  status: PaymentTransactionStatus;

  @Field(() => Object, { nullable: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

@InputType()
export class RefundPaymentInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  paymentId: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  reason?: string;
}

@InputType()
export class PaymentStatusInput {
  @Field()
  @IsString()
  transactionId: string;
}

@InputType()
export class PaymentFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  orderId?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @Field(() => PaymentProvider, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @Field(() => PaymentTransactionStatus, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentTransactionStatus)
  status?: PaymentTransactionStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  offset?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}