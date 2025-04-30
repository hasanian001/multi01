import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CategoryService } from './category.service';
import { Category, CategoryResponse, CategoriesResponse } from './entities/category.entity';
import { CreateCategoryInput, UpdateCategoryInput, CategoryFilterInput } from './dto/category.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Query(() => CategoriesResponse)
  async categories(
    @Args('filterInput', { nullable: true }) filterInput?: CategoryFilterInput,
  ): Promise<CategoriesResponse> {
    return this.categoryService.findAll(filterInput || {});
  }

  @Query(() => CategoryResponse)
  async category(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<CategoryResponse> {
    return this.categoryService.findOne(id);
  }

  @Mutation(() => CategoryResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createCategory(
    @Args('createCategoryInput') createCategoryInput: CreateCategoryInput,
  ): Promise<CategoryResponse> {
    return this.categoryService.create(createCategoryInput);
  }

  @Mutation(() => CategoryResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateCategory(
    @Args('updateCategoryInput') updateCategoryInput: UpdateCategoryInput,
  ): Promise<CategoryResponse> {
    return this.categoryService.update(updateCategoryInput);
  }

  @Mutation(() => CategoryResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async toggleCategoryFeatured(
    @Args('id', { type: () => Int }) id: number,
    @Args('featured', { type: () => Boolean }) featured: boolean,
  ): Promise<CategoryResponse> {
    return this.categoryService.toggleFeatured(id, featured);
  }

  @Mutation(() => CategoryResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteCategory(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<CategoryResponse> {
    return this.categoryService.remove(id);
  }
}