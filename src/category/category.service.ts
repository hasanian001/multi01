import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryInput, UpdateCategoryInput, CategoryFilterInput } from './dto/category.dto';
import { generateUniqueSlug } from '../common/utils/slug.utils';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(filterInput: CategoryFilterInput) {
    const {
      parentId,
      featured,
      limit = 10,
      offset = 0,
      search,
    } = filterInput || {};

    const where: any = {};

    if (parentId !== undefined) {
      where.parentId = parentId === null ? null : parentId;
    }

    if (featured !== undefined) {
      where.is_featured = featured;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const count = await this.prisma.category.count({ where });

    // Get categories with applied filters
    const categories = await this.prisma.category.findMany({
      where,
      include: {
        // Replacing parent with mainCategory which is the correct relation in schema
        mainCategory: parentId !== null,
      },
      skip: offset,
      take: limit,
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
        // Replacing parent with mainCategory which is the correct relation in schema
        mainCategory: true,
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
    const { name, description, image, parentId } = createCategoryInput;

    // If parentId is provided, check if it exists
    if (parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${parentId} not found`);
      }

      // Check to prevent circular reference
      if (await this.checkCircularReference(0, parentId)) {
        throw new BadRequestException('Circular reference detected in category hierarchy');
      }
    }

    // Generate a unique slug for the category
    const slug = generateUniqueSlug(name);

    // Create category
    const category = await this.prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
        // Map parentId to mainCategoryId for Prisma schema
        mainCategoryId: parentId || null,
        is_featured: createCategoryInput.is_featured || false,
      },
      include: {
        // Replacing parent with mainCategory which is the correct relation in schema
        mainCategory: !!parentId,
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
    const { id, name, description, image, parentId, is_featured } = updateCategoryInput;

    // Check if category exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // If parentId is provided, check if it exists and not the same as category being updated
    if (parentId !== undefined) {
      if (parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      if (parentId !== null) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { id: parentId },
        });

        if (!parentCategory) {
          throw new NotFoundException(`Parent category with ID ${parentId} not found`);
        }

        // Check to prevent circular reference
        if (await this.checkCircularReference(id, parentId)) {
          throw new BadRequestException('Circular reference detected in category hierarchy');
        }
      }
    }

    // Update data object
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
      // Generate new slug when name changes
      updateData.slug = generateUniqueSlug(name);
    }
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (parentId !== undefined) updateData.mainCategoryId = parentId; // Map to mainCategoryId
    if (is_featured !== undefined) updateData.is_featured = is_featured;

    // Update category
    const category = await this.prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        // Replacing parent with mainCategory which is the correct relation in schema
        mainCategory: true,
      },
    });

    return {
      category,
      success: true,
      message: 'Category updated successfully',
    };
  }

  // Toggle category featured status
  async toggleFeatured(id: number, featured: boolean) {
    // Check if category exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Update featured status
    const category = await this.prisma.category.update({
      where: { id },
      data: { is_featured: featured },
      include: {
        // Replacing parent with mainCategory which is the correct relation in schema
        mainCategory: true,
      },
    });

    return {
      category,
      success: true,
      message: `Category ${featured ? 'featured' : 'unfeatured'} successfully`,
    };
  }

  // Delete category and update children
  async remove(id: number) {
    // Check if category exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Delete category (this will cascade delete or null references based on schema relations)
    await this.prisma.category.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }

  // Helper function to check for circular references in category hierarchy
  private async checkCircularReference(categoryId: number, parentId: number): Promise<boolean> {
    if (categoryId === 0) {
      // New category being created, so no need to check existing children
      return false;
    }

    // Check if the potential parent is actually a child of the category
    const childCategories = await this.prisma.category.findMany({
      where: {
        mainCategoryId: categoryId,
      },
    });

    // No children, so no circular reference
    if (childCategories.length === 0) {
      return false;
    }

    // Check if the parent ID is in the list of child IDs
    if (childCategories.some(child => child.id === parentId)) {
      return true;
    }

    // Recursively check each child for circular references
    for (const child of childCategories) {
      if (await this.checkCircularReference(child.id, parentId)) {
        return true;
      }
    }

    return false;
  }
}