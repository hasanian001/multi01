import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CouponService } from './coupon.service';
import { Coupon, CouponResponse, CouponsResponse, ValidateCouponResponse } from './entities/coupon.entity';
import { CreateCouponInput, UpdateCouponInput, ValidateCouponInput, CouponFilterInput } from './dto/coupon.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => Coupon)
export class CouponResolver {
  constructor(private readonly couponService: CouponService) {}

  @Query(() => CouponsResponse)
  async coupons(
    @Args('filterInput', { nullable: true }) filterInput?: CouponFilterInput,
  ): Promise<CouponsResponse> {
    return this.couponService.findAll(filterInput || {});
  }

  @Query(() => CouponResponse)
  async coupon(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<CouponResponse> {
    return this.couponService.findOne(id);
  }

  @Query(() => CouponResponse)
  async couponByCode(
    @Args('code') code: string,
  ): Promise<CouponResponse> {
    return this.couponService.findByCode(code);
  }

  @Mutation(() => CouponResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createCoupon(
    @Args('createCouponInput') createCouponInput: CreateCouponInput,
  ): Promise<CouponResponse> {
    return this.couponService.create(createCouponInput);
  }

  @Mutation(() => CouponResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateCoupon(
    @Args('updateCouponInput') updateCouponInput: UpdateCouponInput,
  ): Promise<CouponResponse> {
    return this.couponService.update(updateCouponInput);
  }

  @Mutation(() => CouponResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteCoupon(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<CouponResponse> {
    return this.couponService.remove(id);
  }

  @Query(() => ValidateCouponResponse)
  async validateCoupon(
    @Args('validateCouponInput') validateCouponInput: ValidateCouponInput,
  ): Promise<ValidateCouponResponse> {
    return this.couponService.validate(validateCouponInput);
  }

  @Mutation(() => CouponResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'SELLER')
  async incrementCouponUsage(
    @Args('code') code: string,
  ): Promise<CouponResponse> {
    await this.couponService.incrementUsage(code);
    return this.couponService.findByCode(code);
  }
}