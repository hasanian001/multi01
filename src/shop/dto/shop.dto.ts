import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsOptional, MinLength, IsInt, IsPositive } from 'class-validator';

@InputType()
export class CreateShopInput {
  @Field()
  @IsString()
  @MinLength(3, { message: 'Shop name must be at least 3 characters long' })
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  logo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  banner?: string;
}

@InputType()
export class UpdateShopInput {
  @Field()
  @IsInt()
  @IsPositive()
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Shop name must be at least 3 characters long' })
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  logo?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  banner?: string;
}

@InputType()
export class ShopFilterInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  ownerId?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  is_verified?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  is_featured?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  limit?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  offset?: number;
}