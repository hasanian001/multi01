import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewInput, UpdateReviewInput, ReviewFilterInput } from './dto/review.dto';
import { User } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  // Get all reviews with filtering options
  async findAll(filterInput: ReviewFilterInput) {
    const {
      productId,
      userId,
      rating,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      ...(productId && { productId: Number(productId) }),
      ...(userId && { userId: Number(userId) }),
      ...(rating && { rating: Number(rating) }),
    };

    // Get total count for pagination
    const count = await this.prisma.review.count({ where });

    // Get reviews with applied filters
    const reviews = await this.prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
    });

    return {
      reviews,
      count,
      success: true,
      message: 'Reviews fetched successfully',
    };
  }

  // Get review by ID
  async findOne(id: number) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return {
      review,
      success: true,
      message: 'Review fetched successfully',
    };
  }

  // Get reviews for a product
  async findByProduct(productId: number, sortOrder: 'asc' | 'desc' = 'desc', limit: number = 10, offset: number = 0) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Get total count for pagination
    const count = await this.prisma.review.count({
      where: { productId: Number(productId) },
    });

    // Get reviews for the product
    const reviews = await this.prisma.review.findMany({
      where: { productId: Number(productId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { created_at: sortOrder },
      skip: offset,
      take: limit,
    });

    // Calculate rating stats
    const stats = {
      average: product.rating || 0,
      total: count,
      distribution: {} as Record<number, number>,
    };

    // Count reviews by rating (1-5)
    for (let i = 1; i <= 5; i++) {
      stats.distribution[i] = reviews.filter(review => review.rating === i).length;
    }

    return {
      reviews,
      count,
      stats,
      success: true,
      message: 'Product reviews fetched successfully',
    };
  }

  // Get reviews by a user
  async findByUser(userId: number, sortOrder: 'asc' | 'desc' = 'desc', limit: number = 10, offset: number = 0) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get total count for pagination
    const count = await this.prisma.review.count({
      where: { userId: Number(userId) },
    });

    // Get reviews by the user
    const reviews = await this.prisma.review.findMany({
      where: { userId: Number(userId) },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
      orderBy: { created_at: sortOrder },
      skip: offset,
      take: limit,
    });

    return {
      reviews,
      count,
      success: true,
      message: 'User reviews fetched successfully',
    };
  }

  // Create new review
  async create(createReviewInput: CreateReviewInput, user: User) {
    const { productId, rating, comment } = createReviewInput;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if user has already reviewed this product
    const existingReview = await this.prisma.review.findFirst({
      where: {
        productId: Number(productId),
        userId: user.id,
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product');
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        productId: Number(productId),
        userId: user.id,
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    });

    // Update product rating
    await this.updateProductRating(Number(productId));

    return {
      review,
      success: true,
      message: 'Review created successfully',
    };
  }

  // Update review
  async update(updateReviewInput: UpdateReviewInput, user: User) {
    const { id, rating, comment } = updateReviewInput;

    // Check if review exists
    const existingReview = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    // Check if user owns this review
    if (existingReview.userId !== user.id && user.role !== 'ADMIN') {
      throw new BadRequestException('You can only update your own reviews');
    }

    // Update review
    const review = await this.prisma.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    });

    // Update product rating if the rating was changed
    if (rating !== undefined) {
      await this.updateProductRating(existingReview.productId);
    }

    return {
      review,
      success: true,
      message: 'Review updated successfully',
    };
  }

  // Delete review
  async remove(id: number, user: User) {
    // Check if review exists
    const existingReview = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    // Check if user owns this review or is an admin
    if (existingReview.userId !== user.id && user.role !== 'ADMIN') {
      throw new BadRequestException('You can only delete your own reviews');
    }

    // Delete review
    await this.prisma.review.delete({
      where: { id },
    });

    // Update product rating
    await this.updateProductRating(existingReview.productId);

    return {
      success: true,
      message: 'Review deleted successfully',
    };
  }

  // Helper method to update product rating
  private async updateProductRating(productId: number) {
    // Get all reviews for this product
    const reviews = await this.prisma.review.findMany({
      where: { productId: Number(productId) },
      select: { rating: true },
    });

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = parseFloat((totalRating / reviews.length).toFixed(1));
    }

    // Update product with new average rating
    await this.prisma.product.update({
      where: { id: Number(productId) },
      data: {
        rating: averageRating,
        totalReviews: reviews.length,
      },
    });
  }
}