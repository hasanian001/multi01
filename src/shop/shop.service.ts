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
    const count = await this.prisma.$queryRaw<[{count: number}]>`
      SELECT COUNT(*) as count FROM shops WHERE 
      ${ownerId ? `"ownerId" = ${ownerId} AND` : ''} 
      ${name ? `name ILIKE '%${name}%' AND` : ''} 
      ${is_verified !== undefined ? `"is_verified" = ${is_verified} AND` : ''}
      ${is_featured !== undefined ? `"is_featured" = ${is_featured} AND` : ''}
      TRUE
    `;

    // Get shops with applied filters
    const shops = await this.prisma.$queryRaw`
      SELECT s.*, u.id as "userId", u.name as "userName", u.email as "userEmail" 
      FROM shops s
      LEFT JOIN "User" u ON s."ownerId" = u.id
      WHERE 
      ${ownerId ? `s."ownerId" = ${ownerId} AND` : ''} 
      ${name ? `s.name ILIKE '%${name}%' AND` : ''} 
      ${is_verified !== undefined ? `s."is_verified" = ${is_verified} AND` : ''}
      ${is_featured !== undefined ? `s."is_featured" = ${is_featured} AND` : ''}
      TRUE
      ORDER BY s.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Transform results to match the expected schema
    const formattedShops = shops.map(shop => ({
      ...shop,
      owner: {
        id: shop.userId,
        name: shop.userName,
        email: shop.userEmail,
      }
    }));

    return {
      shops: formattedShops,
      count: Number(count[0].count),
      success: true,
      message: 'Shops fetched successfully',
    };
  }

  // Get shop by ID
  async findOne(id: number) {
    const shop = await this.prisma.$queryRaw`
      SELECT s.*, u.id as "userId", u.name as "userName", u.email as "userEmail" 
      FROM shops s
      LEFT JOIN "User" u ON s."ownerId" = u.id
      WHERE s.id = ${id}
    `;

    if (!shop || shop.length === 0) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    // Transform results to match the expected schema
    const formattedShop = {
      ...shop[0],
      owner: {
        id: shop[0].userId,
        name: shop[0].userName,
        email: shop[0].userEmail,
      }
    };

    return {
      shop: formattedShop,
      success: true,
      message: 'Shop fetched successfully',
    };
  }

  // Get shops for a user
  async findMyShops(userId: number) {
    const shops = await this.prisma.$queryRaw`
      SELECT * FROM shops
      WHERE "ownerId" = ${userId}
      ORDER BY created_at DESC
    `;

    const count = shops.length;

    return {
      shops,
      count,
      success: true,
      message: 'Your shops fetched successfully',
    };
  }

  // Create new shop
  async create(createShopInput: CreateShopInput, user: User) {
    // Check if user already has a shop with this name
    const shopExists = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM shops
      WHERE "ownerId" = ${user.id} AND name = ${createShopInput.name}
    `;

    if (shopExists && shopExists.length > 0) {
      throw new ConflictException(`You already have a shop with the name "${createShopInput.name}"`);
    }

    // Create new shop
    const shop = await this.prisma.$queryRaw`
      INSERT INTO shops (name, description, logo, banner, "ownerId", "is_verified", "is_featured", created_at, updated_at)
      VALUES (
        ${createShopInput.name}, 
        ${createShopInput.description || null}, 
        ${createShopInput.logo || null}, 
        ${createShopInput.banner || null}, 
        ${user.id}, 
        false, 
        false, 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    return {
      shop: shop[0],
      success: true,
      message: 'Shop created successfully',
    };
  }

  // Update shop
  async update(updateShopInput: UpdateShopInput, user: User) {
    const { id, ...updateData } = updateShopInput;

    // Check if shop exists
    const existingShop = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM shops WHERE id = ${id}
    `;

    if (!existingShop || existingShop.length === 0) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    // Check if user has permission to update this shop
    if (user.role !== 'ADMIN' && existingShop[0].ownerId !== user.id) {
      throw new BadRequestException('You can only update your own shop');
    }

    // Update shop
    const setClause = Object.entries(updateData)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `"${key}" = ${typeof value === 'string' ? `'${value}'` : value}`)
      .join(', ');

    if (!setClause) {
      return {
        shop: existingShop[0],
        success: true,
        message: 'No changes to update',
      };
    }

    const shop = await this.prisma.$queryRaw`
      UPDATE shops
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return {
      shop: shop[0],
      success: true,
      message: 'Shop updated successfully',
    };
  }

  // Toggle shop verification status (admin only)
  async toggleVerification(id: number, isVerified: boolean) {
    // Check if shop exists
    const existingShop = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM shops WHERE id = ${id}
    `;

    if (!existingShop || existingShop.length === 0) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    // Update verification status
    const shop = await this.prisma.$queryRaw`
      UPDATE shops
      SET "is_verified" = ${isVerified}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return {
      shop: shop[0],
      success: true,
      message: `Shop ${isVerified ? 'verified' : 'unverified'} successfully`,
    };
  }

  // Toggle shop featured status (admin only)
  async toggleFeatured(id: number, isFeatured: boolean) {
    // Check if shop exists
    const existingShop = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM shops WHERE id = ${id}
    `;

    if (!existingShop || existingShop.length === 0) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    // Update featured status
    const shop = await this.prisma.$queryRaw`
      UPDATE shops
      SET "is_featured" = ${isFeatured}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return {
      shop: shop[0],
      success: true,
      message: `Shop ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
    };
  }

  // Delete shop
  async remove(id: number, user: User) {
    // Check if shop exists
    const existingShop = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM shops WHERE id = ${id}
    `;

    if (!existingShop || existingShop.length === 0) {
      throw new NotFoundException(`Shop with ID ${id} not found`);
    }

    // Check if user has permission to delete this shop
    if (user.role !== 'ADMIN' && existingShop[0].ownerId !== user.id) {
      throw new BadRequestException('You can only delete your own shop');
    }

    // Delete shop
    await this.prisma.$queryRaw`
      DELETE FROM shops WHERE id = ${id}
    `;

    return {
      success: true,
      message: 'Shop deleted successfully',
    };
  }
}