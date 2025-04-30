import { Field, InputType } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GraphQLJSONScalar } from '../../common/scalars/json.scalar';

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
  payment_status: string;

  @Field(() => GraphQLJSONScalar, { nullable: true })
  @IsOptional()
  metadata?: any;
}