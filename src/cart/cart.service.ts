import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartInput, UpdateCartItemInput, RemoveFromCartInput, CartFilterInput } from './dto/cart.dto';
import { User } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // Get cart for a user
  async findOne(userId: number) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Find or create a cart for the user
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                sale_price: true,
                images: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      // Create a new cart for the user
      cart = await this.prisma.cart.create({
        data: {
          userId,
          total: 0,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  sale_price: true,
                  images: true,
                  stock: true,
                },
              },
            },
          },
        },
      });
    }

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      const itemPrice = item.product.sale_price || item.product.price;
      return sum + (itemPrice * item.quantity);
    }, 0);

    // Update cart total if changed
    if (total !== cart.total) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { total },
      });
      cart.total = total;
    }

    return {
      cart,
      success: true,
      message: 'Cart fetched successfully',
    };
  }

  // Add item to cart
  async addToCart(addToCartInput: AddToCartInput, user: User) {
    const { productId, quantity } = addToCartInput;

    // Check if product exists and has enough stock
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.stock < quantity) {
      throw new BadRequestException(`Not enough stock for product: ${product.name}`);
    }

    // Find or create a cart for the user
    let cart = await this.prisma.cart.findFirst({
      where: { userId: user.id },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId: user.id,
          total: 0,
        },
      });
    }

    // Check if product already exists in cart
    const existingCartItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    const price = product.sale_price || product.price;

    let cartItem;
    if (existingCartItem) {
      // Update quantity of existing cart item
      const newQuantity = existingCartItem.quantity + quantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException(`Not enough stock for product: ${product.name}`);
      }

      cartItem = await this.prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: newQuantity,
          price,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              sale_price: true,
              images: true,
              stock: true,
            },
          },
        },
      });
    } else {
      // Add new cart item
      cartItem = await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              sale_price: true,
              images: true,
              stock: true,
            },
          },
        },
      });
    }

    // Update cart total
    const updatedCart = await this.findOne(user.id);

    return {
      cartItem,
      success: true,
      message: 'Product added to cart successfully',
    };
  }

  // Update cart item quantity
  async updateCartItem(updateCartItemInput: UpdateCartItemInput, user: User) {
    const { cartItemId, quantity } = updateCartItemInput;

    // Check if cart item exists
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${cartItemId} not found`);
    }

    // Check if user owns the cart
    if (cartItem.cart.userId !== user.id) {
      throw new BadRequestException('You can only update items in your own cart');
    }

    // Check if product has enough stock
    if (cartItem.product.stock < quantity) {
      throw new BadRequestException(`Not enough stock for product: ${cartItem.product.name}`);
    }

    // Update cart item
    const updatedCartItem = await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        quantity,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            sale_price: true,
            images: true,
            stock: true,
          },
        },
      },
    });

    // Update cart total
    await this.findOne(user.id);

    return {
      cartItem: updatedCartItem,
      success: true,
      message: 'Cart item updated successfully',
    };
  }

  // Remove item from cart
  async removeFromCart(removeFromCartInput: RemoveFromCartInput, user: User) {
    const { cartItemId } = removeFromCartInput;

    // Check if cart item exists
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${cartItemId} not found`);
    }

    // Check if user owns the cart
    if (cartItem.cart.userId !== user.id) {
      throw new BadRequestException('You can only remove items from your own cart');
    }

    // Remove cart item
    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    // Update cart total
    const updatedCart = await this.findOne(user.id);

    return {
      success: true,
      message: 'Item removed from cart successfully',
    };
  }

  // Clear cart (remove all items)
  async clearCart(userId: number) {
    // Find cart for user
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
    });

    if (!cart) {
      return {
        success: true,
        message: 'Cart is already empty',
      };
    }

    // Delete all cart items
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Update cart total
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { total: 0 },
    });

    return {
      success: true,
      message: 'Cart cleared successfully',
    };
  }
}