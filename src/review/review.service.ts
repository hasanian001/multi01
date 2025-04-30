import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewInput, UpdateReviewInput, ReplyReviewInput, ReviewFilterInput } from './dto/review.dto';
import { User } from '@prisma/client';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  // Get all reviews with filtering options
  async findAll(filterInput: ReviewFilterInput) {
    const {
      userId,
      productId,
      shopId,
      rating,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      ...(userId && { userId }),
      ...(productId && { productId }),
      ...(rating && { rating }),
    };

    // If shopId is provided, find all products belonging to that shop
    if (shopId) {
      const products = await this.prisma.product.findMany({
        where: { shopId },
        select: { id: true },
      });
      
      const productIds = products.map(product => product.id);
      
      if (productIds.length > 0) {
        where.productId = { in: productIds };
      } else {
        // If the shop has no products, return empty result
        return {
          reviews: [],
          count: 0,
          success: true,
          message: 'No reviews found for this shop',
        };
      }
    }

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
            images: true,
            shop: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
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
            images: true,
            shop: {
              select: {
                id: true,
                name: true,
              },
            },
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

  // Create new review
  async create(createReviewInput: CreateReviewInput, user: User) {
    const { productId, rating, comment } = createReviewInput;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if user has already reviewed this product
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId: user.id,
        productId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        userId: user.id,
        productId,
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
            images: true,
            shop: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Update product rating
    await this.updateProductRating(productId);

    return {
      review,
      success: true,
      message: 'Review created successfully',
    };
  }

  // Update review
  async update(updateReviewInput: UpdateReviewInput, user: User) {
    const { id, ...updateData } = updateReviewInput;

    // Check if review exists
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    // Check if user is the owner of the review
    if (user.role !== 'ADMIN' && review.userId !== user.id) {
      throw new ForbiddenException('You are not authorized to update this review');
    }

    // Update review
    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: updateData,
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
            images: true,
            shop: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Update product rating
    await this.updateProductRating(review.productId);

    return {
      review: updatedReview,
      success: true,
      message: 'Review updated successfully',
    };
  }

  // Reply to review (for sellers and admins)
  async replyToReview(replyReviewInput: ReplyReviewInput, user: User) {
    const { id, reply } = replyReviewInput;

    // Check if review exists
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            shopId: true,
            shop: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    // Check if user is admin or seller of the product
    const isAdmin = user.role === 'ADMIN';
    const isSeller = review.product.shop && review.product.shop.userId === user.id;

    if (!isAdmin && !isSeller) {
      throw new ForbiddenException('Only the shop owner or admin can reply to reviews');
    }

    // Update review with reply
    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: { reply },
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
            images: true,
            shop: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      review: updatedReview,
      success: true,
      message: 'Reply added successfully',
    };
  }

  // Delete review
  async remove(id: number, user: User) {
    // Check if review exists
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    // Check if user is admin or the owner of the review
    if (user.role !== 'ADMIN' && review.userId !== user.id) {
      throw new ForbiddenException('You are not authorized to delete this review');
    }

    // Delete review
    await this.prisma.review.delete({
      where: { id },
    });

    // Update product rating
    await this.updateProductRating(review.productId);

    return {
      success: true,
      message: 'Review deleted successfully',
    };
  }

  // Helper method to update product rating
  private async updateProductRating(productId: number) {
    // Get all reviews for the product
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    // Calculate new average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = parseFloat((totalRating / reviews.length).toFixed(1));
    }

    // Update product with new average rating
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: averageRating,
        totalReviews: reviews.length,
      },
    });
  }
}