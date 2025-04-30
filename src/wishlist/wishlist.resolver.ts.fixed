import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { Wishlist, WishlistResponse, WishlistsResponse } from './entities/wishlist.entity';
import { CreateWishlistInput, RemoveWishlistInput, WishlistFilterInput } from './dto/wishlist.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Wishlist)
export class WishlistResolver {
  constructor(private readonly wishlistService: WishlistService) {}

  @Query(() => WishlistsResponse)
  @UseGuards(AuthGuard)
  async myWishlist(
    @CurrentUser() user,
    @Args('filterInput', { nullable: true }) filterInput?: WishlistFilterInput,
  ): Promise<WishlistsResponse> {
    // Convert wishlists to match the entity structure
    const result = await this.wishlistService.findAllForUser(user.id, filterInput);
    
    // Ensure all IDs are properly formatted
    const wishlists = result.wishlists.map(item => ({
      ...item,
      id: typeof item.id === 'string' ? parseInt(item.id, 10) : item.id,
      userId: item.userId || user.id,
      productId: item.productId,
      product: item.product ? {
        ...item.product,
        id: typeof item.product.id === 'string' ? parseInt(item.product.id, 10) : item.product.id,
        shopId: typeof item.product.shopId === 'string' ? parseInt(item.product.shopId, 10) : item.product.shopId
      } : null
    }));
    
    return {
      ...result,
      wishlists
    };
  }

  @Mutation(() => WishlistResponse)
  @UseGuards(AuthGuard)
  async addToWishlist(
    @Args('createWishlistInput') createWishlistInput: CreateWishlistInput,
    @CurrentUser() user,
  ): Promise<WishlistResponse> {
    return this.wishlistService.addToWishlist(createWishlistInput, user);
  }

  @Mutation(() => WishlistResponse)
  @UseGuards(AuthGuard)
  async removeFromWishlist(
    @Args('removeWishlistInput') removeWishlistInput: RemoveWishlistInput,
    @CurrentUser() user,
  ): Promise<WishlistResponse> {
    return this.wishlistService.removeFromWishlist(removeWishlistInput, user);
  }

  @Mutation(() => WishlistResponse)
  @UseGuards(AuthGuard)
  async removeProductFromWishlist(
    @Args('productId', { type: () => ID }) productId: string,
    @CurrentUser() user,
  ): Promise<WishlistResponse> {
    const removeWishlistInput: RemoveWishlistInput = { productId };
    return this.wishlistService.removeFromWishlist(removeWishlistInput, user);
  }

  @Mutation(() => WishlistResponse)
  @UseGuards(AuthGuard)
  async clearWishlist(
    @CurrentUser() user,
  ): Promise<WishlistResponse> {
    return this.wishlistService.clearWishlist(user.id);
  }
}