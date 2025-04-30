import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput, UpdateProductInput, ProductFilterInput } from './dto/product.dto';
import { slugify } from '../utils/slugify';
import { User } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // Get all products with filtering options
  async findAll(filterInput: ProductFilterInput) {
    const {
      shopId,
      categoryId,
      subCategoryId,
      brandId,
      name,
      minPrice,
      maxPrice,
      is_featured,
      is_published,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      ...(shopId && { shopId }),
      ...(categoryId && { categoryId }),
      ...(subCategoryId && { subCategoryId }),
      ...(brandId && { brandId }),
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(is_featured !== undefined && { is_featured }),
      ...(is_published !== undefined && { is_published }),
    };

    // Add price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
    }

    // Get total count for pagination
    const count = await this.prisma.product.count({ where });

    // Get products with applied filters
    const products = await this.prisma.product.findMany({
      where,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            is_verified: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      products,
      count,
      success: true,
      message: 'Products fetched successfully',
    };
  }

  // Get product by ID
  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            is_verified: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      product,
      success: true,
      message: 'Product fetched successfully',
    };
  }

  // Get products by seller
  async findByShop(shopId: number, filterInput?: Omit<ProductFilterInput, 'shopId'>) {
    const {
      categoryId,
      subCategoryId,
      brandId,
      name,
      minPrice,
      maxPrice,
      is_featured,
      is_published,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      shopId,
      ...(categoryId && { categoryId }),
      ...(subCategoryId && { subCategoryId }),
      ...(brandId && { brandId }),
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(is_featured !== undefined && { is_featured }),
      ...(is_published !== undefined && { is_published }),
    };

    // Add price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
    }

    // Get total count for pagination
    const count = await this.prisma.product.count({ where });

    // Get products with applied filters
    const products = await this.prisma.product.findMany({
      where,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            is_verified: true,
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      products,
      count,
      success: true,
      message: 'Products fetched successfully',
    };
  }

  // Create new product
  async create(createProductInput: CreateProductInput, user: User) {
    const { shopId } = createProductInput;

    // Check if shop exists and belongs to the user
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      throw new NotFoundException(`Shop with ID ${shopId} not found`);
    }

    if (shop.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new BadRequestException('You are not authorized to add products to this shop');
    }

    // Generate slug from name
    const slug = slugify(createProductInput.name);

    // Check if slug already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this name already exists');
    }

    // Create product
    const product = await this.prisma.product.create({
      data: {
        ...createProductInput,
        slug,
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            is_verified: true,
          },
        },
      },
    });

    return {
      product,
      success: true,
      message: 'Product created successfully',
    };
  }

  // Update product
  async update(updateProductInput: UpdateProductInput, user: User) {
    const { id, ...updateData } = updateProductInput;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        shop: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if user is the shop owner or an admin
    if (product.shop.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new BadRequestException('You are not authorized to update this product');
    }

    // If name is being updated, generate new slug
    let slug;
    if (updateData.name) {
      slug = slugify(updateData.name);

      // Check if slug already exists for another product
      const existingProduct = await this.prisma.product.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this name already exists');
      }
    }

    // Update product
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        ...(slug && { slug }),
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            is_verified: true,
          },
        },
      },
    });

    return {
      product: updatedProduct,
      success: true,
      message: 'Product updated successfully',
    };
  }

  // Toggle product featured status
  async toggleFeatured(id: number, featured: boolean, user: User) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        shop: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if user is the shop owner or an admin
    if (product.shop.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new BadRequestException('You are not authorized to update this product');
    }

    // Update product featured status
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { is_featured: featured },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            is_verified: true,
          },
        },
      },
    });

    return {
      product: updatedProduct,
      success: true,
      message: featured ? 'Product marked as featured' : 'Product unmarked as featured',
    };
  }

  // Toggle product published status
  async togglePublished(id: number, published: boolean, user: User) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        shop: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if user is the shop owner or an admin
    if (product.shop.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new BadRequestException('You are not authorized to update this product');
    }

    // Update product published status
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { is_published: published },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
            is_verified: true,
          },
        },
      },
    });

    return {
      product: updatedProduct,
      success: true,
      message: published ? 'Product published successfully' : 'Product unpublished successfully',
    };
  }

  // Delete product
  async remove(id: number, user: User) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        shop: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if user is the shop owner or an admin
    if (product.shop.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new BadRequestException('You are not authorized to delete this product');
    }

    // Delete product
    await this.prisma.product.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }
}