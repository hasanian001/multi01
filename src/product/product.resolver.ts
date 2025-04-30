import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ProductService } from './product.service';
import { Product, ProductResponse, ProductsResponse } from './entities/product.entity';
import { CreateProductInput, UpdateProductInput, ProductFilterInput } from './dto/product.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Query(() => ProductsResponse)
  async products(
    @Args('filterInput', { nullable: true }) filterInput?: ProductFilterInput,
  ): Promise<ProductsResponse> {
    return this.productService.findAll(filterInput || {});
  }

  @Query(() => ProductResponse)
  async product(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<ProductResponse> {
    return this.productService.findOne(id);
  }

  @Query(() => ProductsResponse)
  async shopProducts(
    @Args('shopId', { type: () => Int }) shopId: number,
    @Args('filterInput', { nullable: true }) filterInput?: Omit<ProductFilterInput, 'shopId'>,
  ): Promise<ProductsResponse> {
    return this.productService.findByShop(shopId, filterInput || {});
  }

  @Mutation(() => ProductResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async createProduct(
    @Args('createProductInput') createProductInput: CreateProductInput,
    @CurrentUser() user,
  ): Promise<ProductResponse> {
    return this.productService.create(createProductInput, user);
  }

  @Mutation(() => ProductResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async updateProduct(
    @Args('updateProductInput') updateProductInput: UpdateProductInput,
    @CurrentUser() user,
  ): Promise<ProductResponse> {
    return this.productService.update(updateProductInput, user);
  }

  @Mutation(() => ProductResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async toggleProductFeatured(
    @Args('id', { type: () => Int }) id: number,
    @Args('featured', { type: () => Boolean }) featured: boolean,
    @CurrentUser() user,
  ): Promise<ProductResponse> {
    return this.productService.toggleFeatured(id, featured, user);
  }

  @Mutation(() => ProductResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async toggleProductPublished(
    @Args('id', { type: () => Int }) id: number,
    @Args('published', { type: () => Boolean }) published: boolean,
    @CurrentUser() user,
  ): Promise<ProductResponse> {
    return this.productService.togglePublished(id, published, user);
  }

  @Mutation(() => ProductResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async deleteProduct(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<ProductResponse> {
    return this.productService.remove(id, user);
  }
}