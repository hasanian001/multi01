import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Brand {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string | null;

  @Field({ nullable: true })
  logo?: string | null;

  @Field({ nullable: true })
  website?: string | null;

  @Field()
  is_featured: boolean;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

@ObjectType()
export class BrandResponse {
  @Field(() => Brand, { nullable: true })
  brand?: Brand;

  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class BrandsResponse {
  @Field(() => [Brand])
  brands: Brand[];

  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field()
  count: number;
}