import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { PaymentProvider } from '../models/payment-transaction.model';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUrl, Min } from 'class-validator';

@InputType()
export class InitiatePaymentInput {
  @Field(() => Int)
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  orderId: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  currency?: string;

  @Field(() => PaymentProvider)
  @IsEnum(PaymentProvider)
  @IsNotEmpty()
  provider: PaymentProvider;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String)
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  returnUrl: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsUrl()
  @IsOptional()
  cancelUrl?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @IsOptional()
  metadata?: any;
}