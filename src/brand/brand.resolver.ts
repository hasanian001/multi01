import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { BrandService } from './brand.service';
import { Brand, BrandResponse, BrandsResponse } from './entities/brand.entity';
import { CreateBrandInput, UpdateBrandInput, BrandFilterInput } from './dto/brand.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => Brand)
export class BrandResolver {
  constructor(private readonly brandService: BrandService) {}

  @Query(() => BrandsResponse)
  async brands(
    @Args('filterInput', { nullable: true }) filterInput?: BrandFilterInput,
  ): Promise<BrandsResponse> {
    return this.brandService.findAll(filterInput || {});
  }

  @Query(() => BrandResponse)
  async brand(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<BrandResponse> {
    return this.brandService.findOne(id);
  }

  @Mutation(() => BrandResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createBrand(
    @Args('createBrandInput') createBrandInput: CreateBrandInput,
  ): Promise<BrandResponse> {
    return this.brandService.create(createBrandInput);
  }

  @Mutation(() => BrandResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateBrand(
    @Args('updateBrandInput') updateBrandInput: UpdateBrandInput,
  ): Promise<BrandResponse> {
    return this.brandService.update(updateBrandInput);
  }

  @Mutation(() => BrandResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async toggleBrandFeatured(
    @Args('id', { type: () => Int }) id: number,
    @Args('featured', { type: () => Boolean }) featured: boolean,
  ): Promise<BrandResponse> {
    return this.brandService.toggleFeatured(id, featured);
  }

  @Mutation(() => BrandResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteBrand(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<BrandResponse> {
    return this.brandService.remove(id);
  }
}