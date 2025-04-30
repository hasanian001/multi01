import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../user/entities/user.entity';

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: number;

  @Field(() => ID)
  userId: number;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field()
  is_read: boolean;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;
}

@ObjectType()
export class NotificationResponse {
  @Field(() => Notification, { nullable: true })
  notification?: Notification;

  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class NotificationsResponse {
  @Field(() => [Notification])
  notifications: Notification[];

  @Field()
  count: number;
  
  @Field()
  success: boolean;

  @Field()
  message: string;
}