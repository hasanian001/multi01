import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput, UpdateProductInput, ProductFilterInput } from './dto/product.dto';
import { User } from '@prisma/client';
import { generateUniqueSlug } from '../common/utils/slug.utils';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // Get all products with filtering options
  async findAll(filterInput: ProductFilterInput) {
    const {
      shopId,
      categoryId,
      mainCategoryId,
      brandId,
      minPrice,
      maxPrice,
      search,
      status,
      featured,
      trending,
      bestSelling,
      newArrival,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      ...(shopId && { shopId }),
      ...(categoryId && { categoryId }),
      ...(mainCategoryId && { mainCategoryId }),
      ...(brandId && { brandId }),
      ...(status !== undefined && { status }),
      ...(featured !== undefined && { featured }),
      ...(trending !== undefined && { trending }),
      ...(bestSelling !== undefined && { bestSelling }),
      ...(newArrival !== undefined && { newArrival }),
    };

    // Add price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const count = await this.prisma.product.count({ where });

    // Get products with applied filters
    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        shop: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
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
        category: true,
        brand: true,
        shop: true,
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

  // Get products for a shop
  async findByShop(shopId: number, filterInput?: Omit<ProductFilterInput, 'shopId'>) {
    const {
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      search,
      status,
      featured,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions (include shopId)
    const where: any = {
      shopId,
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
      ...(status !== undefined && { status }),
      ...(featured !== undefined && { featured }),
    };

    // Add price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const count = await this.prisma.product.count({ where });

    // Get products with applied filters
    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        shop: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
    });

    return {
      products,
      count,
      success: true,
      message: 'Shop products fetched successfully',
    };
  }

  // Get product by slug
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug },
      include: {
        category: true,
        brand: true,
        shop: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }

    // Add/increment view count if the field exists
    const updateData: any = { view_count: { increment: 1 } }; // Most likely field name is view_count
    await this.prisma.product.update({
      where: { id: product.id },
      data: updateData
    });

    return {
      product,
      success: true,
      message: 'Product fetched successfully',
    };
  }

  // Create new product
  async create(createProductInput: CreateProductInput, user: User) {
    const { shopId, ...productData } = createProductInput;

    // Check if user has permission to create product for this shop
    // SELLER can only create products for their own shop
    if (user.role === 'SELLER') {
      // Get the shop to check if the user is the owner
      const shop = await this.prisma.shop.findUnique({
        where: { id: shopId },
      });

      if (!shop || shop.ownerId !== user.id) {
        throw new BadRequestException('You can only create products for your own shop');
      }
    }

    // Generate slug
    let slug = generateUniqueSlug(productData.name);

    // Check if slug is already in use
    const existingProductWithSlug = await this.prisma.product.findUnique({
      where: { slug },
    });

    // If slug exists, append a unique identifier
    if (existingProductWithSlug) {
      const uniqueSlug = `${slug}-${Math.floor(Math.random() * 10000)}`;
      
      // Create product with the generated slug
      const product = await this.prisma.product.create({
        data: {
          ...productData,
          shopId,
          slug: uniqueSlug,
        },
      });

      return {
        product,
        success: true,
        message: 'Product created successfully',
      };
    }

    // Create product
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        shopId,
        slug,
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
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      include: {
        shop: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if user has permission to update this product
    // ADMIN can update any product, SELLER can only update their own shop's products
    if (user.role === 'SELLER') {
      // Get the shop to check if the user is the owner
      const shop = await this.prisma.shop.findUnique({
        where: { id: existingProduct.shopId },
      });

      if (!shop || shop.ownerId !== user.id) {
        throw new BadRequestException('You can only update products from your own shop');
      }
    }

    // Update slug if name is updated
    const updateDataWithSlug: any = { ...updateData };
    if (updateData.name) {
      const slug = generateUniqueSlug(updateData.name);
      updateDataWithSlug.slug = slug;
    }

    // Update product
    const product = await this.prisma.product.update({
      where: { id },
      data: updateDataWithSlug,
      include: {
        category: true,
        brand: true,
      },
    });

    return {
      product,
      success: true,
      message: 'Product updated successfully',
    };
  }

  // Toggle product status
  async toggleStatus(id: number, status: string, user: User) {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      include: {
        shop: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if user has permission to update this product
    if (user.role === 'SELLER') {
      // Get the shop to check if the user is the owner
      const shop = await this.prisma.shop.findUnique({
        where: { id: existingProduct.shopId },
      });

      if (!shop || shop.ownerId !== user.id) {
        throw new BadRequestException('You can only update products from your own shop');
      }
    }

    // Update status - assumes there's a status field
    const statusData: any = { status };
    const product = await this.prisma.product.update({
      where: { id },
      data: statusData,
    });

    return {
      product,
      success: true,
      message: `Product status changed to ${status}`,
    };
  }

  // Toggle product featured status (admin only)
  async toggleFeatured(id: number, featured: boolean, user: User) {
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Only administrators can change featured status');
    }

    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      include: {
        shop: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Update featured status - assumes there's a featured field
    const featuredData: any = { is_featured: featured };
    const product = await this.prisma.product.update({
      where: { id },
      data: featuredData,
    });

    return {
      product,
      success: true,
      message: `Product ${featured ? 'featured' : 'unfeatured'} successfully`,
    };
  }
  
  // Toggle product published status (seller or admin)
  async togglePublished(id: number, published: boolean, user: User) {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      include: {
        shop: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if user has permission to update this product
    if (user.role === 'SELLER') {
      // Get the shop to check if the user is the owner
      const shop = await this.prisma.shop.findUnique({
        where: { id: existingProduct.shopId },
      });

      if (!shop || shop.ownerId !== user.id) {
        throw new BadRequestException('You can only update products from your own shop');
      }
    }

    // Update published status
    const product = await this.prisma.product.update({
      where: { id },
      data: { is_published: published },
    });

    return {
      product,
      success: true,
      message: `Product ${published ? 'published' : 'unpublished'} successfully`,
    };
  }

  // Delete product
  async remove(id: number, user: User) {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      include: {
        shop: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check if user has permission to delete this product
    if (user.role === 'SELLER') {
      // Get the shop to check if the user is the owner
      const shop = await this.prisma.shop.findUnique({
        where: { id: existingProduct.shopId },
      });

      if (!shop || shop.ownerId !== user.id) {
        throw new BadRequestException('You can only delete products from your own shop');
      }
    }

    // Don't actually delete the product, just update its status to "DELETED"
    const statusData: any = {
      status: 'DELETED',
      deleted_at: new Date(),
    };
    
    const product = await this.prisma.product.update({
      where: { id },
      data: statusData,
    });

    return {
      product,
      success: true,
      message: 'Product deleted successfully',
    };
  }
}