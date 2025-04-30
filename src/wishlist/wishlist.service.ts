import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWishlistInput, RemoveWishlistInput, WishlistFilterInput } from './dto/wishlist.dto';
import { User } from '@prisma/client';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  // Get all wishlist items for a user
  async findAllForUser(userId: number, filterInput?: WishlistFilterInput) {
    const { limit = 10, offset = 0 } = filterInput || {};
    
    // Get total count for pagination
    const count = await this.prisma.wishlist.count({
      where: { userId },
    });

    // Get wishlist items with product details
    const wishlists = await this.prisma.wishlist.findMany({
      where: {
        userId,
      },
      include: {
        product: {
          include: {
            shop: true,
            category: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc', // Newest first
      },
      skip: offset,
      take: limit,
    });

    return {
      wishlists,
      count,
      success: true,
      message: 'Wishlist items fetched successfully',
    };
  }

  // Add to wishlist
  async addToWishlist(createWishlistInput: CreateWishlistInput, user: User) {
    const { productId } = createWishlistInput;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if item is already in wishlist
    const existingWishlistItem = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existingWishlistItem) {
      throw new BadRequestException('Product is already in your wishlist');
    }

    // Add to wishlist
    const wishlist = await this.prisma.wishlist.create({
      data: {
        userId: user.id,
        productId,
      },
      include: {
        product: true,
      },
    });

    return {
      wishlist,
      success: true,
      message: 'Product added to wishlist successfully',
    };
  }

  // Remove from wishlist
  async removeFromWishlist(removeWishlistInput: RemoveWishlistInput, user: User) {
    const { id } = removeWishlistInput;

    // Check if wishlist item exists
    const wishlistItem = await this.prisma.wishlist.findUnique({
      where: { id },
    });

    if (!wishlistItem) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    // Check if wishlist item belongs to the user
    if (wishlistItem.userId !== user.id) {
      throw new BadRequestException('You are not authorized to remove this item');
    }

    // Remove from wishlist
    await this.prisma.wishlist.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Product removed from wishlist successfully',
    };
  }

  // Remove product from wishlist (by productId)
  async removeProductFromWishlist(productId: number, userId: number) {
    // Check if product exists in wishlist
    const wishlistItem = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!wishlistItem) {
      throw new NotFoundException(`Product with ID ${productId} not found in wishlist`);
    }

    // Remove from wishlist
    await this.prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return {
      success: true,
      message: 'Product removed from wishlist successfully',
    };
  }

  // Clear wishlist
  async clearWishlist(userId: number) {
    // Delete all wishlist items for user
    await this.prisma.wishlist.deleteMany({
      where: { userId },
    });

    return {
      success: true,
      message: 'Wishlist cleared successfully',
    };
  }
}