import { Field, InputType, GraphQLJSON } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CompletePaymentInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  paymentIntent?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @Field(() => String)
  @IsString()
  @IsIn(['success', 'failed', 'cancelled', 'pending'])
  @IsNotEmpty()
  paymentStatus: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: any;
}