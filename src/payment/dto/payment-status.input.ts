import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class PaymentStatusInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  transactionId: string;
}