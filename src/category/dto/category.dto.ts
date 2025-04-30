import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsOptional, MinLength, IsInt, IsPositive, IsBoolean, IsUrl } from 'class-validator';

@InputType()
export class CreateCategoryInput {
  @Field()
  @IsString()
  @MinLength(2, { message: 'Category name must be at least 2 characters long' })
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  image?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  parentId?: number;

  @Field(() => Boolean, { defaultValue: false })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;
}

@InputType()
export class UpdateCategoryInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Category name must be at least 2 characters long' })
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  image?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  parentId?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;
}

@InputType()
export class CategoryFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  parentId?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

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