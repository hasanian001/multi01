import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsPositive, Min } from 'class-validator';

@InputType()
export class CreateWishlistInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  productId: number;
}

@InputType()
export class RemoveWishlistInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  id: number;
}

@InputType()
export class WishlistFilterInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
  
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}