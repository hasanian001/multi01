import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';

@ObjectType()
export class CartItem {
  @Field(() => ID)
  id: number;

  @Field(() => ID)
  cartId: number;

  @Field(() => ID)
  productId: number;

  @Field(() => Product, { nullable: true })
  product?: Product;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  price: number;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

@ObjectType()
export class Cart {
  @Field(() => ID)
  id: number;

  @Field(() => ID)
  userId: number;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => [CartItem])
  items: CartItem[];

  @Field(() => Float)
  total: number;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

@ObjectType()
export class CartResponse {
  @Field(() => Cart, { nullable: true })
  cart?: Cart;

  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class CartItemResponse {
  @Field(() => CartItem, { nullable: true })
  cartItem?: CartItem;

  @Field()
  success: boolean;

  @Field()
  message: string;
}