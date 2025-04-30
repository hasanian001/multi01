import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification, NotificationResponse, NotificationsResponse } from './entities/notification.entity';
import { CreateNotificationInput, UpdateNotificationInput, NotificationFilterInput } from './dto/notification.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Notification)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Query(() => NotificationsResponse)
  @UseGuards(AuthGuard)
  async myNotifications(
    @CurrentUser() user,
    @Args('filterInput', { nullable: true }) filterInput?: NotificationFilterInput,
  ): Promise<NotificationsResponse> {
    return this.notificationService.findAllForUser(user.id, filterInput);
  }

  @Query(() => NotificationResponse)
  @UseGuards(AuthGuard)
  async notification(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<NotificationResponse> {
    return this.notificationService.findOne(id, user.id);
  }

  @Mutation(() => NotificationResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createNotification(
    @Args('createNotificationInput') createNotificationInput: CreateNotificationInput,
  ): Promise<NotificationResponse> {
    return this.notificationService.create(createNotificationInput);
  }

  @Mutation(() => NotificationResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createNotificationsForUsers(
    @Args('userIds', { type: () => [Int] }) userIds: number[],
    @Args('title') title: string,
    @Args('message') message: string,
  ): Promise<NotificationResponse> {
    return this.notificationService.createForMultipleUsers(userIds, title, message);
  }

  @Mutation(() => NotificationResponse)
  @UseGuards(AuthGuard)
  async markNotificationAsRead(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<NotificationResponse> {
    return this.notificationService.markAsRead(id, user.id);
  }

  @Mutation(() => NotificationResponse)
  @UseGuards(AuthGuard)
  async markAllNotificationsAsRead(
    @CurrentUser() user,
  ): Promise<NotificationResponse> {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Mutation(() => NotificationResponse)
  @UseGuards(AuthGuard)
  async updateNotification(
    @Args('updateNotificationInput') updateNotificationInput: UpdateNotificationInput,
    @CurrentUser() user,
  ): Promise<NotificationResponse> {
    return this.notificationService.update(updateNotificationInput, user.id);
  }

  @Mutation(() => NotificationResponse)
  @UseGuards(AuthGuard)
  async deleteNotification(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<NotificationResponse> {
    return this.notificationService.remove(id, user.id);
  }

  @Mutation(() => NotificationResponse)
  @UseGuards(AuthGuard)
  async deleteAllReadNotifications(
    @CurrentUser() user,
  ): Promise<NotificationResponse> {
    return this.notificationService.deleteAllRead(user.id);
  }
}