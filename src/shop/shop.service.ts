import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopInput, UpdateShopInput, ShopFilterInput } from './dto/shop.dto';
import { User } from '@prisma/client';

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  // Get all shops with filtering options
  async findAll(filterInput: ShopFilterInput) {
    const { ownerId, name, is_verified, is_featured, limit = 10, offset = 0 } = filterInput || {};

    // Build filter conditions
    const where: any = {
      ...(ownerId && { ownerId }),
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(is_verified !== undefined && { is_verified }),
      ...(is_featured !== undefined && { is_featured }),
    };

    // Get total count for pagination
    const count = await this.prisma.shop.count({ where });

    // Get shops with applied filters
    const shops = await this.prisma.shop.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            is_verified: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    return {
      shops,
      count,
      success: true,
      message: 'Shops fetched successfully',
    };
  }

  // Get shop by ID
  async findOne(id: number) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            is_verified: true,
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    return {
      shop,
      success: true,
      message: 'Shop fetched successfully',
    };
  }

  // Get shop by owner ID
  async findByOwner(ownerId: number) {
    const shops = await this.prisma.shop.findMany({
      where: { ownerId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            is_verified: true,
          },
        },
      },
    });

    return {
      shops,
      count: shops.length,
      success: true,
      message: 'Shops fetched successfully',
    };
  }

  // Create new shop
  async create(createShopInput: CreateShopInput, user: User) {
    // Check if user already has a shop
    const existingShop = await this.prisma.shop.findFirst({
      where: { ownerId: user.id },
    });

    if (existingShop) {
      throw new ConflictException('You already have a shop');
    }

    // Check if shop name already exists
    const shopWithName = await this.prisma.shop.findFirst({
      where: { name: createShopInput.name },
    });

    if (shopWithName) {
      throw new ConflictException('Shop name already exists');
    }

    // Create shop
    const shop = await this.prisma.shop.create({
      data: {
        ...createShopInput,
        ownerId: user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            is_verified: true,
          },
        },
      },
    });

    // Update user role to SELLER
    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: 'SELLER' },
    });

    return {
      shop,
      success: true,
      message: 'Shop created successfully',
    };
  }

  // Update shop
  async update(updateShopInput: UpdateShopInput, user: User) {
    const { id, ...updateData } = updateShopInput;

    // Check if shop exists
    const shop = await this.prisma.shop.findUnique({
      where: { id },
    });

    if (!shop) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    // Check if user is the owner or an admin
    if (shop.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new BadRequestException('You are not authorized to update this shop');
    }

    // If name is being updated, check if it already exists
    if (updateData.name) {
      const shopWithName = await this.prisma.shop.findFirst({
        where: {
          name: updateData.name,
          id: { not: id },
        },
      });

      if (shopWithName) {
        throw new ConflictException('Shop name already exists');
      }
    }

    // Update shop
    const updatedShop = await this.prisma.shop.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            is_verified: true,
          },
        },
      },
    });

    return {
      shop: updatedShop,
      success: true,
      message: 'Shop updated successfully',
    };
  }

  // Verify shop (admin only)
  async verifyShop(id: number) {
    // Check if shop exists
    const shop = await this.prisma.shop.findUnique({
      where: { id },
    });

    if (!shop) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    // Update shop verification status
    const updatedShop = await this.prisma.shop.update({
      where: { id },
      data: { is_verified: true },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            is_verified: true,
          },
        },
      },
    });

    return {
      shop: updatedShop,
      success: true,
      message: 'Shop verified successfully',
    };
  }

  // Feature shop (admin only)
  async featureShop(id: number, featured: boolean) {
    // Check if shop exists
    const shop = await this.prisma.shop.findUnique({
      where: { id },
    });

    if (!shop) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    // Update shop featured status
    const updatedShop = await this.prisma.shop.update({
      where: { id },
      data: { is_featured: featured },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            is_verified: true,
          },
        },
      },
    });

    return {
      shop: updatedShop,
      success: true,
      message: featured ? 'Shop featured successfully' : 'Shop unfeatured successfully',
    };
  }

  // Delete shop
  async remove(id: number, user: User) {
    // Check if shop exists
    const shop = await this.prisma.shop.findUnique({
      where: { id },
    });

    if (!shop) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    // Check if user is the owner or an admin
    if (shop.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new BadRequestException('You are not authorized to delete this shop');
    }

    // Delete shop
    await this.prisma.shop.delete({
      where: { id },
    });

    // If user has no other shops, update role back to USER (if not ADMIN)
    if (user.role !== 'ADMIN') {
      const otherShops = await this.prisma.shop.findMany({
        where: { ownerId: user.id },
      });

      if (otherShops.length === 0) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { role: 'USER' },
        });
      }
    }

    return {
      success: true,
      message: 'Shop deleted successfully',
    };
  }
}