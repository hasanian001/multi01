import { ObjectType, Field, ID, Float, Int, registerEnumType } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';
import { Shop } from '../../shop/entities/shop.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  DIGITAL_PAYMENT = 'DIGITAL_PAYMENT',
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'Status of the order',
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'Status of the payment',
});

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
  description: 'Method of payment',
});

@ObjectType()
export class OrderItem {
  @Field(() => ID)
  id: number;

  @Field(() => ID)
  orderId: number;

  @Field(() => ID)
  productId: number;

  @Field()
  productName: string;

  @Field({ nullable: true })
  productImage?: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  subtotal: number;
}

@ObjectType()
export class Order {
  @Field(() => ID)
  id: number;

  @Field()
  orderNumber: string;

  @Field(() => ID)
  userId: number;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => ID, { nullable: true })
  shopId?: number;

  @Field(() => Shop, { nullable: true })
  shop?: Shop;

  @Field(() => [OrderItem])
  items: OrderItem[];

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float, { nullable: true })
  discount?: number;

  @Field(() => Float)
  tax: number;

  @Field(() => Float)
  shipping: number;

  @Field(() => Float)
  total: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => PaymentStatus)
  payment_status: PaymentStatus;

  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field({ nullable: true })
  trackingNumber?: string;

  @Field({ nullable: true })
  deliveryDate?: Date;

  @Field()
  shippingAddress: string;

  @Field()
  billingAddress: string;

  @Field()
  customerNotes: string;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

@ObjectType()
export class OrderResponse {
  @Field(() => Order, { nullable: true })
  order?: Order;

  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class OrdersResponse {
  @Field(() => [Order])
  orders: Order[];

  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field()
  count: number;
}