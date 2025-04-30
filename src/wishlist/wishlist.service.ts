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
      where: { userId: String(userId) },
    });

    // Get wishlist items with product details
    const wishlists = await this.prisma.wishlist.findMany({
      where: {
        userId: String(userId),
      },
      include: {
        product: {
          include: {
            shop: true,
            category: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
    });

    return {
      wishlists,
      count,
      success: true,
      message: 'Wishlist items fetched successfully',
    };
  }

  // Check if product is in wishlist
  async isProductInWishlist(productId: number, userId: number) {
    const wishlistItem = await this.prisma.wishlist.findFirst({
      where: {
        userId: String(userId),
        productId: String(productId),
      },
    });

    return {
      inWishlist: !!wishlistItem,
    };
  }

  // Toggle wishlist item
  async toggle(createWishlistInput: CreateWishlistInput, user: User) {
    const { productId } = createWishlistInput;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: String(productId) },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if product is already in wishlist
    const existingWishlistItem = await this.prisma.wishlist.findFirst({
      where: {
        userId: String(user.id),
        productId: String(productId),
      },
    });

    // If already in wishlist, remove it
    if (existingWishlistItem) {
      await this.prisma.wishlist.delete({
        where: {
          id: existingWishlistItem.id
        },
      });

      return {
        success: true,
        message: 'Product removed from wishlist',
        action: 'removed',
      };
    }

    // Otherwise, add to wishlist
    await this.prisma.wishlist.create({
      data: {
        userId: String(user.id),
        productId: String(productId),
      },
    });

    return {
      success: true,
      message: 'Product added to wishlist',
      action: 'added',
    };
  }

  // Add product to wishlist
  async addToWishlist(createWishlistInput: CreateWishlistInput, user: User) {
    const { productId } = createWishlistInput;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: String(productId) },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if product is already in wishlist
    const existingWishlistItem = await this.prisma.wishlist.findFirst({
      where: {
        userId: String(user.id),
        productId: String(productId),
      },
    });

    if (existingWishlistItem) {
      throw new BadRequestException('Product is already in your wishlist');
    }

    // Add to wishlist
    const wishlistItem = await this.prisma.wishlist.create({
      data: {
        userId: String(user.id),
        productId: String(productId),
      },
      include: {
        product: true,
      },
    });

    return {
      wishlistItem,
      success: true,
      message: 'Product added to wishlist',
    };
  }

  // Remove product from wishlist
  async removeFromWishlist(removeWishlistInput: RemoveWishlistInput, user: User) {
    const { productId } = removeWishlistInput;

    // Check if product is in wishlist
    const existingWishlistItem = await this.prisma.wishlist.findFirst({
      where: {
        userId: String(user.id),
        productId: String(productId),
      },
    });

    if (!existingWishlistItem) {
      throw new NotFoundException('Product is not in your wishlist');
    }

    // Remove from wishlist
    await this.prisma.wishlist.delete({
      where: {
        id: existingWishlistItem.id
      },
    });

    return {
      success: true,
      message: 'Product removed from wishlist',
    };
  }

  // Clear wishlist
  async clearWishlist(userId: number) {
    await this.prisma.wishlist.deleteMany({
      where: { userId: String(userId) },
    });

    return {
      success: true,
      message: 'Wishlist cleared successfully',
    };
  }
}