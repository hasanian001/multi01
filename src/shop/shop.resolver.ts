import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { Shop, ShopResponse, ShopsResponse } from './entities/shop.entity';
import { CreateShopInput, UpdateShopInput, ShopFilterInput } from './dto/shop.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MessageResponse } from '../user/entities/user.entity';

@Resolver(() => Shop)
export class ShopResolver {
  constructor(private readonly shopService: ShopService) {}

  @Query(() => ShopsResponse)
  async shops(@Args('filterInput', { nullable: true }) filterInput?: ShopFilterInput): Promise<ShopsResponse> {
    return this.shopService.findAll(filterInput || {});
  }

  @Query(() => ShopResponse)
  async shop(@Args('id', { type: () => Int }) id: number): Promise<ShopResponse> {
    return this.shopService.findOne(id);
  }

  @Query(() => ShopsResponse)
  @UseGuards(AuthGuard)
  async myShops(@CurrentUser() user): Promise<ShopsResponse> {
    return this.shopService.findMyShops(user.id);
  }

  @Mutation(() => ShopResponse)
  @UseGuards(AuthGuard)
  async createShop(
    @Args('createShopInput') createShopInput: CreateShopInput,
    @CurrentUser() user,
  ): Promise<ShopResponse> {
    return this.shopService.create(createShopInput, user);
  }

  @Mutation(() => ShopResponse)
  @UseGuards(AuthGuard)
  async updateShop(
    @Args('updateShopInput') updateShopInput: UpdateShopInput,
    @CurrentUser() user,
  ): Promise<ShopResponse> {
    return this.shopService.update(updateShopInput, user);
  }

  @Mutation(() => ShopResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async verifyShop(@Args('id', { type: () => Int }) id: number): Promise<ShopResponse> {
    return this.shopService.toggleVerification(id, true);
  }

  @Mutation(() => ShopResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async featureShop(
    @Args('id', { type: () => Int }) id: number,
    @Args('featured', { type: () => Boolean }) featured: boolean,
  ): Promise<ShopResponse> {
    return this.shopService.toggleFeatured(id, featured);
  }

  @Mutation(() => MessageResponse)
  @UseGuards(AuthGuard)
  async deleteShop(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<MessageResponse> {
    return this.shopService.remove(id, user);
  }
}