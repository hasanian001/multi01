import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, IsPositive, Min, Max, MaxLength } from 'class-validator';

@InputType()
export class CreateReviewInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  productId: number;

  @Field(() => Int)
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot be more than 5' })
  rating: number;

  @Field()
  @IsString()
  @MaxLength(1000, { message: 'Comment cannot be longer than 1000 characters' })
  comment: string;
}

@InputType()
export class UpdateReviewInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  id: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot be more than 5' })
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Comment cannot be longer than 1000 characters' })
  comment?: string;
}

@InputType()
export class ReplyReviewInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  id: number;

  @Field()
  @IsString()
  @MaxLength(1000, { message: 'Reply cannot be longer than 1000 characters' })
  reply: string;
}

@InputType()
export class ReviewFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  productId?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  shopId?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

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
  @IsString()
  sortBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}