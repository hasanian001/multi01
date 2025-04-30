import { InputType, Field, ID, Float, Int } from '@nestjs/graphql';
import { IsString, IsEnum, IsNumber, IsOptional, IsPositive, Min, Max, IsDate, IsArray, ArrayMinSize, IsInt, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType, CouponStatus } from '../entities/coupon.entity';

@InputType()
export class CreateCouponInput {
  @Field()
  @IsString()
  @Matches(/^[A-Z0-9_-]{3,15}$/, {
    message: 'Code must be 3-15 characters long and contain only uppercase letters, numbers, underscores, and hyphens',
  })
  code: string;
  
  @Field(() => CouponType)
  @IsEnum(CouponType)
  type: CouponType;
  
  @Field(() => Float)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100, { 
    message: 'For percentage coupons, value cannot be greater than 100'
  })
  value: number;
  
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  usageLimit?: number;
  
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minSpend?: number;
  
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxSpend?: number;

  @Field(() => CouponStatus)
  @IsEnum(CouponStatus)
  status: CouponStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
  
  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  applicableProductIds?: number[];
  
  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  applicableCategoryIds?: number[];
  
  @Field()
  @IsString()
  @MaxLength(500)
  description: string;
}

@InputType()
export class UpdateCouponInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9_-]{3,15}$/, {
    message: 'Code must be 3-15 characters long and contain only uppercase letters, numbers, underscores, and hyphens',
  })
  code?: string;
  
  @Field(() => CouponType, { nullable: true })
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;
  
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100, { 
    message: 'For percentage coupons, value cannot be greater than 100'
  })
  value?: number;
  
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  usageLimit?: number;
  
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minSpend?: number;
  
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxSpend?: number;

  @Field(() => CouponStatus, { nullable: true })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
  
  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  applicableProductIds?: number[];
  
  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  applicableCategoryIds?: number[];
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

@InputType()
export class ValidateCouponInput {
  @Field()
  @IsString()
  code: string;

  @Field(() => Float)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cartTotal: number;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  productIds?: number[];
}

@InputType()
export class CouponFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  code?: string;

  @Field(() => CouponType, { nullable: true })
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @Field(() => CouponStatus, { nullable: true })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validOn?: Date;

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