import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';

@ObjectType()
export class Address {
  @Field(() => ID)
  id: number;

  @Field(() => ID)
  userId: number;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field({ nullable: true })
  name?: string;

  @Field()
  address: string;

  @Field()
  city: string;

  @Field({ nullable: true })
  state?: string;

  @Field()
  country: string;

  @Field({ nullable: true })
  zip?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  is_default: boolean;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

@ObjectType()
export class AddressResponse {
  @Field(() => Address, { nullable: true })
  address?: Address;

  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class AddressesResponse {
  @Field(() => [Address])
  addresses: Address[];

  @Field()
  count: number;
  
  @Field()
  success: boolean;

  @Field()
  message: string;
}