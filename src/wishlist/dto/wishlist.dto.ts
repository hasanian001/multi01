import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsInt, IsPositive, IsOptional } from 'class-validator';

@InputType()
export class AddToWishlistInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  productId: number;
}

@InputType()
export class RemoveFromWishlistInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  wishlistItemId: number;
}

@InputType()
export class WishlistFilterInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  offset?: number;

  @Field({ nullable: true })
  @IsOptional()
  sortBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}