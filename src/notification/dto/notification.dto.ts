import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsBoolean, IsInt, Min, IsPositive } from 'class-validator';

@InputType()
export class CreateNotificationInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  userId: number;

  @Field()
  @IsString()
  title: string;

  @Field()
  @IsString()
  message: string;
}

@InputType()
export class UpdateNotificationInput {
  @Field(() => ID)
  @IsInt()
  @IsPositive()
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  message?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}

@InputType()
export class NotificationFilterInput {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
  
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