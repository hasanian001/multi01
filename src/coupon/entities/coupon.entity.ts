import { ObjectType, Field, ID, Float, Int, registerEnumType } from '@nestjs/graphql';

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

registerEnumType(CouponType, {
  name: 'CouponType',
  description: 'Type of coupon (percentage or fixed amount)',
});

registerEnumType(CouponStatus, {
  name: 'CouponStatus',
  description: 'Status of coupon',
});

@ObjectType()
export class Coupon {
  @Field(() => ID)
  id: number;

  @Field()
  code: string;
  
  @Field(() => CouponType)
  type: CouponType;
  
  @Field(() => Float)
  value: number;
  
  @Field(() => Int, { nullable: true })
  usageLimit?: number;
  
  @Field(() => Int)
  usageCount: number;
  
  @Field(() => Float, { nullable: true })
  minSpend?: number;
  
  @Field(() => Float, { nullable: true })
  maxSpend?: number;

  @Field(() => CouponStatus)
  status: CouponStatus;

  @Field({ nullable: true })
  startDate?: Date;
  
  @Field({ nullable: true })
  endDate?: Date;
  
  @Field(() => [ID], { nullable: true })
  applicableProductIds?: number[];
  
  @Field(() => [ID], { nullable: true })
  applicableCategoryIds?: number[];
  
  @Field()
  description: string;
  
  @Field()
  created_at: Date;
  
  @Field()
  updated_at: Date;
}

@ObjectType()
export class CouponResponse {
  @Field(() => Coupon, { nullable: true })
  coupon?: Coupon;

  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class CouponsResponse {
  @Field(() => [Coupon])
  coupons: Coupon[];

  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field()
  count: number;
}

@ObjectType()
export class ValidateCouponResponse {
  @Field(() => Coupon, { nullable: true })
  coupon?: Coupon;

  @Field(() => Float)
  discount: number;

  @Field()
  success: boolean;

  @Field()
  message: string;
}