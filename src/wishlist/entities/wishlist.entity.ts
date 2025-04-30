import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';

@ObjectType()
export class WishlistItem {
  @Field(() => ID)
  id: number;

  @Field(() => ID)
  userId: number;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => ID)
  productId: number;

  @Field(() => Product, { nullable: true })
  product?: Product;

  @Field()
  created_at: Date;
}

@ObjectType()
export class WishlistResponse {
  @Field(() => [WishlistItem])
  items: WishlistItem[];

  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field()
  count: number;
}

@ObjectType()
export class WishlistItemResponse {
  @Field(() => WishlistItem, { nullable: true })
  item?: WishlistItem;

  @Field()
  success: boolean;

  @Field()
  message: string;
}