import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponInput, UpdateCouponInput, ValidateCouponInput, CouponFilterInput } from './dto/coupon.dto';
import { CouponStatus, CouponType } from './entities/coupon.entity';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  // Get all coupons with filtering options
  async findAll(filterInput: CouponFilterInput) {
    const {
      code,
      type,
      status,
      validOn,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      ...(code && { code: { contains: code, mode: 'insensitive' } }),
      ...(type && { type }),
      ...(status && { status }),
    };

    // Add validity date filter
    if (validOn) {
      where.OR = [
        {
          startDate: null,
          endDate: null,
        },
        {
          startDate: null,
          endDate: { gte: validOn },
        },
        {
          startDate: { lte: validOn },
          endDate: null,
        },
        {
          startDate: { lte: validOn },
          endDate: { gte: validOn },
        },
      ];
    }

    // Get total count for pagination
    const count = await this.prisma.coupon.count({ where });

    // Get coupons with applied filters
    const coupons = await this.prisma.coupon.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      coupons,
      count,
      success: true,
      message: 'Coupons fetched successfully',
    };
  }

  // Get coupon by ID
  async findOne(id: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return {
      coupon,
      success: true,
      message: 'Coupon fetched successfully',
    };
  }

  // Get coupon by code
  async findByCode(code: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }

    return {
      coupon,
      success: true,
      message: 'Coupon fetched successfully',
    };
  }

  // Create new coupon
  async create(createCouponInput: CreateCouponInput) {
    const { code, type, value, applicableProductIds, applicableCategoryIds, ...rest } = createCouponInput;

    // Check if coupon code already exists
    const existingCoupon = await this.prisma.coupon.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
    });

    if (existingCoupon) {
      throw new ConflictException(`Coupon with code ${code} already exists`);
    }

    // Validate percentage coupon value
    if (type === CouponType.PERCENTAGE && (value < 0 || value > 100)) {
      throw new BadRequestException('Percentage coupon value must be between 0 and 100');
    }

    // Create coupon
    const coupon = await this.prisma.coupon.create({
      data: {
        code: code.toUpperCase(), // Always save code in uppercase
        type,
        value,
        usageCount: 0,
        applicableProductIds: applicableProductIds || [],
        applicableCategoryIds: applicableCategoryIds || [],
        ...rest,
      },
    });

    return {
      coupon,
      success: true,
      message: 'Coupon created successfully',
    };
  }

  // Update coupon
  async update(updateCouponInput: UpdateCouponInput) {
    const { id, code, type, value, applicableProductIds, applicableCategoryIds, ...rest } = updateCouponInput;

    // Check if coupon exists
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    // If code is being updated, check if it conflicts with another coupon
    if (code && code !== existingCoupon.code) {
      const codeExists = await this.prisma.coupon.findFirst({
        where: {
          code: { equals: code, mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (codeExists) {
        throw new ConflictException(`Coupon with code ${code} already exists`);
      }
    }

    // Validate percentage coupon value
    const couponType = type || existingCoupon.type;
    if (couponType === CouponType.PERCENTAGE && value !== undefined && (value < 0 || value > 100)) {
      throw new BadRequestException('Percentage coupon value must be between 0 and 100');
    }

    // Update coupon
    const updatedCoupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(type && { type }),
        ...(value !== undefined && { value }),
        ...(applicableProductIds && { applicableProductIds }),
        ...(applicableCategoryIds && { applicableCategoryIds }),
        ...rest,
      },
    });

    return {
      coupon: updatedCoupon,
      success: true,
      message: 'Coupon updated successfully',
    };
  }

  // Delete coupon
  async remove(id: number) {
    // Check if coupon exists
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    // Delete coupon
    await this.prisma.coupon.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Coupon deleted successfully',
    };
  }

  // Validate coupon for cart
  async validate(validateCouponInput: ValidateCouponInput) {
    const { code, cartTotal, productIds = [] } = validateCouponInput;

    // Find coupon by code
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }

    // Check coupon status
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException(`Coupon is ${coupon.status.toLowerCase()}`);
    }

    // Check if coupon has usage limit and if it's reached
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    // Check coupon date validity
    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      throw new BadRequestException('Coupon is not active yet');
    }
    if (coupon.endDate && new Date(coupon.endDate) < now) {
      throw new BadRequestException('Coupon has expired');
    }

    // Check minimum spend
    if (coupon.minSpend && cartTotal < coupon.minSpend) {
      throw new BadRequestException(`Minimum spend required is ${coupon.minSpend}`);
    }

    // Check maximum spend
    if (coupon.maxSpend && cartTotal > coupon.maxSpend) {
      throw new BadRequestException(`Maximum spend allowed is ${coupon.maxSpend}`);
    }

    // Check product restrictions
    if (
      coupon.applicableProductIds &&
      coupon.applicableProductIds.length > 0 &&
      productIds.length > 0
    ) {
      const hasValidProduct = productIds.some(id => 
        coupon.applicableProductIds.includes(id)
      );
      
      if (!hasValidProduct) {
        throw new BadRequestException('Coupon is not applicable to the products in your cart');
      }
    }

    // Check category restrictions
    if (
      coupon.applicableCategoryIds &&
      coupon.applicableCategoryIds.length > 0 &&
      productIds.length > 0
    ) {
      // Get products with their categories
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          categoryId: true,
        },
      });

      const categoryIds = products.map(product => product.categoryId);
      const hasValidCategory = categoryIds.some(id => 
        coupon.applicableCategoryIds.includes(id)
      );
      
      if (!hasValidCategory) {
        throw new BadRequestException('Coupon is not applicable to the product categories in your cart');
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (cartTotal * coupon.value) / 100;
    } else {
      // Fixed amount discount
      discount = Math.min(cartTotal, coupon.value); // Don't exceed cart total
    }

    return {
      coupon,
      discount,
      success: true,
      message: 'Coupon is valid',
    };
  }

  // Update coupon usage count
  async incrementUsage(code: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }

    await this.prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    // If usage limit reached, mark as inactive
    if (coupon.usageLimit && coupon.usageCount + 1 >= coupon.usageLimit) {
      await this.prisma.coupon.update({
        where: { id: coupon.id },
        data: {
          status: CouponStatus.INACTIVE,
        },
      });
    }

    return {
      success: true,
      message: 'Coupon usage incremented successfully',
    };
  }
}