import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Category {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field({ nullable: true })
  image?: string | null;

  @Field(() => ID, { nullable: true })
  parentId?: number | null;

  @Field(() => Category, { nullable: true })
  parent?: Category | null;

  @Field(() => [Category], { nullable: true })
  children?: Category[] | null;

  @Field()
  is_featured: boolean;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

@ObjectType()
export class CategoryResponse {
  @Field(() => Category, { nullable: true })
  category?: Category;

  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class CategoriesResponse {
  @Field(() => [Category])
  categories: Category[];

  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field()
  count: number;
}