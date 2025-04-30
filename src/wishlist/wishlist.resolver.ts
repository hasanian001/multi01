import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { WishlistService } from './wishlist.service';
import { WishlistItem, WishlistResponse, WishlistItemResponse } from './entities/wishlist.entity';
import { AddToWishlistInput, RemoveFromWishlistInput, WishlistFilterInput } from './dto/wishlist.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => WishlistItem)
export class WishlistResolver {
  constructor(private readonly wishlistService: WishlistService) {}

  @Query(() => WishlistResponse)
  @UseGuards(AuthGuard)
  async myWishlist(
    @CurrentUser() user,
    @Args('filterInput', { nullable: true }) filterInput?: WishlistFilterInput,
  ): Promise<WishlistResponse> {
    return this.wishlistService.findAll(user.id, filterInput || {});
  }

  @Mutation(() => WishlistItemResponse)
  @UseGuards(AuthGuard)
  async addToWishlist(
    @Args('addToWishlistInput') addToWishlistInput: AddToWishlistInput,
    @CurrentUser() user,
  ): Promise<WishlistItemResponse> {
    return this.wishlistService.addToWishlist(addToWishlistInput, user);
  }

  @Mutation(() => WishlistResponse)
  @UseGuards(AuthGuard)
  async removeFromWishlist(
    @Args('removeFromWishlistInput') removeFromWishlistInput: RemoveFromWishlistInput,
    @CurrentUser() user,
  ): Promise<WishlistResponse> {
    return this.wishlistService.removeFromWishlist(removeFromWishlistInput, user);
  }

  @Mutation(() => WishlistResponse)
  @UseGuards(AuthGuard)
  async clearWishlist(@CurrentUser() user): Promise<WishlistResponse> {
    return this.wishlistService.clearWishlist(user.id);
  }

  @Query(() => Boolean)
  @UseGuards(AuthGuard)
  async isInWishlist(
    @CurrentUser() user,
    @Args('productId', { type: () => Int }) productId: number,
  ): Promise<boolean> {
    const result = await this.wishlistService.isInWishlist(user.id, productId);
    return result.inWishlist;
  }
}