import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsInt, IsPositive, Min, IsOptional } from 'class-validator';

@InputType()
export class AddToCartInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  productId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}

@InputType()
export class UpdateCartItemInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  cartItemId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}

@InputType()
export class RemoveFromCartInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  cartItemId: number;
}

@InputType()
export class CartFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;
}