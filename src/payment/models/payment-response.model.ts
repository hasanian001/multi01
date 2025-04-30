import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PaymentTransaction } from './payment-transaction.model';
import { GraphQLJSONScalar } from '../../common/scalars/json.scalar';

@ObjectType()
export class PaginationInfo {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  pages: number;
}

@ObjectType()
export class PaymentsResponse {
  @Field(() => [PaymentTransaction])
  data: PaymentTransaction[];

  @Field(() => PaginationInfo)
  pagination: PaginationInfo;

  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;
}

@ObjectType()
export class PaymentResponse {
  @Field(() => PaymentTransaction)
  payment: PaymentTransaction;

  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;
}

@ObjectType()
export class InitiatePaymentResponse {
  @Field(() => PaymentTransaction)
  payment: PaymentTransaction;

  @Field(() => String, { nullable: true })
  paymentIntent?: string;

  @Field(() => String, { nullable: true })
  clientSecret?: string;

  @Field(() => String, { nullable: true })
  redirectUrl?: string;

  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;
}

@ObjectType()
export class RefundResponse {
  @Field(() => PaymentTransaction)
  payment: PaymentTransaction;

  @Field(() => String)
  refundId: string;

  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;
}

@ObjectType()
export class PaymentStatusResponse {
  @Field(() => PaymentTransaction)
  payment: PaymentTransaction;

  @Field(() => String)
  currentStatus: string;

  @Field(() => Boolean)
  success: boolean;

  @Field(() => String)
  message: string;

  @Field(() => GraphQLJSONScalar, { nullable: true })
  details?: any;
}