import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum, Matches } from 'class-validator';

enum Role {
  USER = 'USER',
  SELLER = 'SELLER',
  EDITOR = 'EDITOR',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

registerEnumType(Role, {
  name: 'Role',
  description: 'User roles',
});

@InputType()
export class SignupInput {
  @Field()
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name: string;

  @Field()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @Field()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;
}

@InputType()
export class LoginInput {
  @Field()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @Field()
  @IsString()
  password: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  avatar?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  currentPassword: string;

  @Field()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  newPassword: string;
}

@InputType()
export class ForgetPasswordInput {
  @Field()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @Field()
  @IsString()
  code: string;

  @Field()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  password: string;
}

@InputType()
export class VerifyEmailInput {
  @Field()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @Field()
  @IsString()
  code: string;
}