import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Shop } from '../../shop/entities/shop.entity';

@ObjectType()
export class Product {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field(() => ID)
  shopId: number;

  @Field(() => Shop, { nullable: true })
  shop?: any;

  @Field(() => ID)
  categoryId: number;

  @Field(() => ID, { nullable: true })
  subCategoryId?: number | null;

  @Field(() => ID, { nullable: true })
  brandId?: number | null;

  @Field(() => Float)
  price: number;

  @Field(() => Float, { nullable: true })
  sale_price?: number | null;

  @Field({ nullable: true })
  sku?: string | null;

  @Field()
  stock: number;

  @Field()
  is_featured: boolean;

  @Field()
  is_published: boolean;

  @Field(() => [String])
  images: string[];

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

@ObjectType()
export class ProductResponse {
  @Field(() => Product, { nullable: true })
  product?: Product;

  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class ProductsResponse {
  @Field(() => [Product])
  products: Product[];

  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field()
  count: number;
}