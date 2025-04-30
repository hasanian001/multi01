import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToWishlistInput, RemoveFromWishlistInput, WishlistFilterInput } from './dto/wishlist.dto';
import { User } from '@prisma/client';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  // Get user's wishlist
  async findAll(userId: number, filterInput: WishlistFilterInput) {
    const {
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get total count for pagination
    const count = await this.prisma.wishlistItem.count({
      where: { userId },
    });

    // Get wishlist items
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            sale_price: true,
            images: true,
            stock: true,
            rating: true,
            totalReviews: true,
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
      items,
      count,
      success: true,
      message: 'Wishlist items fetched successfully',
    };
  }

  // Add product to wishlist
  async addToWishlist(addToWishlistInput: AddToWishlistInput, user: User) {
    const { productId } = addToWishlistInput;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if product is already in wishlist
    const existingItem = await this.prisma.wishlistItem.findFirst({
      where: {
        userId: user.id,
        productId,
      },
    });

    if (existingItem) {
      throw new ConflictException('Product is already in your wishlist');
    }

    // Add product to wishlist
    const wishlistItem = await this.prisma.wishlistItem.create({
      data: {
        userId: user.id,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            sale_price: true,
            images: true,
            stock: true,
            rating: true,
            totalReviews: true,
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
      item: wishlistItem,
      success: true,
      message: 'Product added to wishlist successfully',
    };
  }

  // Remove product from wishlist
  async removeFromWishlist(removeFromWishlistInput: RemoveFromWishlistInput, user: User) {
    const { wishlistItemId } = removeFromWishlistInput;

    // Check if wishlist item exists
    const wishlistItem = await this.prisma.wishlistItem.findUnique({
      where: { id: wishlistItemId },
    });

    if (!wishlistItem) {
      throw new NotFoundException(`Wishlist item with ID ${wishlistItemId} not found`);
    }

    // Check if user owns the wishlist item
    if (wishlistItem.userId !== user.id) {
      throw new BadRequestException('You can only remove items from your own wishlist');
    }

    // Remove product from wishlist
    await this.prisma.wishlistItem.delete({
      where: { id: wishlistItemId },
    });

    return {
      success: true,
      message: 'Product removed from wishlist successfully',
    };
  }

  // Check if product is in user's wishlist
  async isInWishlist(userId: number, productId: number) {
    const wishlistItem = await this.prisma.wishlistItem.findFirst({
      where: {
        userId,
        productId,
      },
    });

    return {
      inWishlist: !!wishlistItem,
      wishlistItemId: wishlistItem?.id || null,
    };
  }

  // Clear wishlist (remove all items)
  async clearWishlist(userId: number) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Delete all wishlist items
    await this.prisma.wishlistItem.deleteMany({
      where: { userId },
    });

    return {
      items: [],
      count: 0,
      success: true,
      message: 'Wishlist cleared successfully',
    };
  }
}