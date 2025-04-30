import { InputType, Field, ID, Float, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, IsPositive, IsNumber, Min, IsEnum, IsUUID, IsISO8601, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../entities/order.entity';

@InputType()
export class OrderItemInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  productId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;
}

@InputType()
export class CreateOrderInput {
  @Field(() => [OrderItemInput])
  @IsArray()
  @ArrayMinSize(1, { message: 'Order must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items: OrderItemInput[];

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  shopId?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;
  
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  shipping_fee?: number;

  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field()
  @IsString()
  shippingAddress: string;

  @Field()
  @IsString()
  billingAddress: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  customerNotes?: string;
}

@InputType()
export class UpdateOrderInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  id: number;

  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @Field(() => PaymentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tracking_number?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsISO8601()
  deliveryDate?: string;
}

@InputType()
export class OrderFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  shopId?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @Field(() => PaymentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

  @Field(() => PaymentMethod, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsISO8601()
  fromDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsISO8601()
  toDate?: string;

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