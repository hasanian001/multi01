import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';

@ObjectType()
export class Review {
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

  @Field(() => Int)
  rating: number;

  @Field()
  comment: string;

  @Field({ nullable: true })
  reply?: string;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

@ObjectType()
export class ReviewResponse {
  @Field(() => Review, { nullable: true })
  review?: Review;

  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class ReviewsResponse {
  @Field(() => [Review])
  reviews: Review[];

  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field()
  count: number;
}