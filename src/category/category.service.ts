import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryInput, UpdateCategoryInput, CategoryFilterInput } from './dto/category.dto';
import { slugify } from '../utils/slugify';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  // Get all categories with filtering options
  async findAll(filterInput: CategoryFilterInput) {
    const {
      parentId,
      name,
      is_featured,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      parentId: parentId === undefined ? null : parentId, // If parentId is undefined, we fetch only root categories
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(is_featured !== undefined && { is_featured }),
    };

    // Get total count for pagination
    const count = await this.prisma.category.count({ where });

    // Get categories with applied filters
    const categories = await this.prisma.category.findMany({
      where,
      include: {
        parent: parentId !== null,
        children: true,
      },
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      categories,
      count,
      success: true,
      message: 'Categories fetched successfully',
    };
  }

  // Get category by ID
  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return {
      category,
      success: true,
      message: 'Category fetched successfully',
    };
  }

  // Create new category
  async create(createCategoryInput: CreateCategoryInput) {
    const { name, parentId } = createCategoryInput;

    // Generate slug from name
    const slug = slugify(name);

    // Check if slug already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    // Check if parent category exists if parentId is provided
    if (parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${parentId} not found`);
      }
    }

    // Create category
    const category = await this.prisma.category.create({
      data: {
        ...createCategoryInput,
        slug,
      },
      include: {
        parent: !!parentId,
        children: true,
      },
    });

    return {
      category,
      success: true,
      message: 'Category created successfully',
    };
  }

  // Update category
  async update(updateCategoryInput: UpdateCategoryInput) {
    const { id, name, parentId, ...updateData } = updateCategoryInput;

    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check parentId if it's being updated
    if (parentId !== undefined) {
      // Check if parent exists
      if (parentId !== null) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { id: parentId },
        });

        if (!parentCategory) {
          throw new NotFoundException(`Parent category with ID ${parentId} not found`);
        }

        // Prevent circular reference
        if (parentId === id) {
          throw new BadRequestException('A category cannot be its own parent');
        }

        // Check if the new parent is a child of this category (would create a circular reference)
        const isCircular = await this.checkCircularReference(id, parentId);
        if (isCircular) {
          throw new BadRequestException('Cannot set a child category as parent (circular reference)');
        }
      }
    }

    // If name is being updated, generate new slug
    let slug;
    if (name) {
      slug = slugify(name);

      // Check if slug already exists for another category
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    // Update category
    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(parentId !== undefined && { parentId }),
        ...updateData,
        ...(slug && { slug }),
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return {
      category: updatedCategory,
      success: true,
      message: 'Category updated successfully',
    };
  }

  // Toggle category featured status
  async toggleFeatured(id: number, featured: boolean) {
    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Update category featured status
    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: { is_featured: featured },
      include: {
        parent: true,
        children: true,
      },
    });

    return {
      category: updatedCategory,
      success: true,
      message: featured ? 'Category marked as featured' : 'Category unmarked as featured',
    };
  }

  // Delete category
  async remove(id: number) {
    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if category has children
    if (category.children && category.children.length > 0) {
      throw new BadRequestException('Cannot delete a category that has sub-categories');
    }

    // Check if category has products
    const productsCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      throw new BadRequestException('Cannot delete a category that has products');
    }

    // Delete category
    await this.prisma.category.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }

  // Helper function to check for circular references when updating parent
  private async checkCircularReference(categoryId: number, parentId: number): Promise<boolean> {
    // Get all child categories
    const childCategories = await this.prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });

    // If the potential parent is a child, it would create a circular reference
    if (childCategories.some(child => child.id === parentId)) {
      return true;
    }

    // Recursively check children of children
    for (const child of childCategories) {
      const isCircular = await this.checkCircularReference(child.id, parentId);
      if (isCircular) {
        return true;
      }
    }

    return false;
  }
}