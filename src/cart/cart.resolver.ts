import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CartService } from './cart.service';
import { Cart, CartResponse, CartItemResponse } from './entities/cart.entity';
import { AddToCartInput, UpdateCartItemInput, RemoveFromCartInput } from './dto/cart.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Cart)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  @Query(() => CartResponse)
  @UseGuards(AuthGuard)
  async myCart(@CurrentUser() user): Promise<CartResponse> {
    return this.cartService.findOne(user.id);
  }

  @Mutation(() => CartItemResponse)
  @UseGuards(AuthGuard)
  async addToCart(
    @Args('addToCartInput') addToCartInput: AddToCartInput,
    @CurrentUser() user,
  ): Promise<CartItemResponse> {
    return this.cartService.addToCart(addToCartInput, user);
  }

  @Mutation(() => CartItemResponse)
  @UseGuards(AuthGuard)
  async updateCartItem(
    @Args('updateCartItemInput') updateCartItemInput: UpdateCartItemInput,
    @CurrentUser() user,
  ): Promise<CartItemResponse> {
    return this.cartService.updateCartItem(updateCartItemInput, user);
  }

  @Mutation(() => CartResponse)
  @UseGuards(AuthGuard)
  async removeFromCart(
    @Args('removeFromCartInput') removeFromCartInput: RemoveFromCartInput,
    @CurrentUser() user,
  ): Promise<CartResponse> {
    return this.cartService.removeFromCart(removeFromCartInput, user);
  }

  @Mutation(() => CartResponse)
  @UseGuards(AuthGuard)
  async clearCart(@CurrentUser() user): Promise<CartResponse> {
    return this.cartService.clearCart(user.id);
  }
}