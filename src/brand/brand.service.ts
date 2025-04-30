import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandInput, UpdateBrandInput, BrandFilterInput } from './dto/brand.dto';
import { slugify } from '../utils/slugify';

@Injectable()
export class BrandService {
  constructor(private prisma: PrismaService) {}

  // Get all brands with filtering options
  async findAll(filterInput: BrandFilterInput) {
    const {
      name,
      is_featured,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(is_featured !== undefined && { is_featured }),
    };

    // Get total count for pagination
    const count = await this.prisma.brand.count({ where });

    // Get brands with applied filters
    const brands = await this.prisma.brand.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      brands,
      count,
      success: true,
      message: 'Brands fetched successfully',
    };
  }

  // Get brand by ID
  async findOne(id: number) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return {
      brand,
      success: true,
      message: 'Brand fetched successfully',
    };
  }

  // Create new brand
  async create(createBrandInput: CreateBrandInput) {
    const { name } = createBrandInput;

    // Generate slug from name
    const slug = slugify(name);

    // Check if slug already exists
    const existingBrand = await this.prisma.brand.findUnique({
      where: { slug },
    });

    if (existingBrand) {
      throw new ConflictException('Brand with this name already exists');
    }

    // Create brand
    const brand = await this.prisma.brand.create({
      data: {
        ...createBrandInput,
        slug,
      },
    });

    return {
      brand,
      success: true,
      message: 'Brand created successfully',
    };
  }

  // Update brand
  async update(updateBrandInput: UpdateBrandInput) {
    const { id, name, ...updateData } = updateBrandInput;

    // Check if brand exists
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    // If name is being updated, generate new slug
    let slug;
    if (name) {
      slug = slugify(name);

      // Check if slug already exists for another brand
      const existingBrand = await this.prisma.brand.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (existingBrand) {
        throw new ConflictException('Brand with this name already exists');
      }
    }

    // Update brand
    const updatedBrand = await this.prisma.brand.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...updateData,
        ...(slug && { slug }),
      },
    });

    return {
      brand: updatedBrand,
      success: true,
      message: 'Brand updated successfully',
    };
  }

  // Toggle brand featured status
  async toggleFeatured(id: number, featured: boolean) {
    // Check if brand exists
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    // Update brand featured status
    const updatedBrand = await this.prisma.brand.update({
      where: { id },
      data: { is_featured: featured },
    });

    return {
      brand: updatedBrand,
      success: true,
      message: featured ? 'Brand marked as featured' : 'Brand unmarked as featured',
    };
  }

  // Delete brand
  async remove(id: number) {
    // Check if brand exists
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    // Check if brand has products
    const productsCount = await this.prisma.product.count({
      where: { brandId: id },
    });

    if (productsCount > 0) {
      throw new ConflictException('Cannot delete a brand that has products. Remove the products first.');
    }

    // Delete brand
    await this.prisma.brand.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Brand deleted successfully',
    };
  }
}