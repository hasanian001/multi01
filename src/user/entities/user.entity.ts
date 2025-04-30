import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Role } from '@prisma/client';

// Register the Prisma Role enum for GraphQL
registerEnumType(Role, {
  name: 'Role',
  description: 'User roles',
});

@ObjectType()
export class User {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phone?: string | null;

  @Field({ nullable: true })
  avatar?: string | null;

  @Field({ nullable: true })
  address?: string | null;

  @Field(() => Role)
  role: Role;

  @Field()
  is_verified: boolean;

  @Field()
  is_banned: boolean;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

@ObjectType()
export class AuthResponse {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field({ nullable: true })
  token?: string;

  @Field()
  message: string;

  @Field()
  success: boolean;
}

@ObjectType()
export class MessageResponse {
  @Field()
  message: string;

  @Field()
  success: boolean;
}