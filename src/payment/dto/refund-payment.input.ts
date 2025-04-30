import { Field, Float, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class RefundPaymentInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  reason?: string;
}