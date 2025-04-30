import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationInput, UpdateNotificationInput, NotificationFilterInput } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  // Get all notifications for a user
  async findAllForUser(userId: number, filterInput?: NotificationFilterInput) {
    const { is_read, limit = 10, offset = 0 } = filterInput || {};
    
    const where = {
      userId,
      ...(is_read !== undefined && { is_read }),
    };

    // Get total count for pagination
    const count = await this.prisma.notification.count({ where });

    // Get notifications with applied filters
    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: {
        created_at: 'desc', // Newest first
      },
      skip: offset,
      take: limit,
    });

    return {
      notifications,
      count,
      success: true,
      message: 'Notifications fetched successfully',
    };
  }

  // Get notification by ID
  async findOne(id: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    // Check if notification belongs to the user
    if (notification.userId !== userId) {
      throw new BadRequestException('You are not authorized to access this notification');
    }

    return {
      notification,
      success: true,
      message: 'Notification fetched successfully',
    };
  }

  // Create new notification
  async create(createNotificationInput: CreateNotificationInput) {
    const { userId, title, message } = createNotificationInput;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} not found`);
    }

    // Create the notification
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        is_read: false,
      },
    });

    return {
      notification,
      success: true,
      message: 'Notification created successfully',
    };
  }

  // Create notifications for multiple users
  async createForMultipleUsers(userIds: number[], title: string, message: string) {
    // Check if users exist
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: { id: true },
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException('One or more users not found');
    }

    // Create notifications for all users
    const notificationData = userIds.map(userId => ({
      userId,
      title,
      message,
      is_read: false,
    }));

    await this.prisma.notification.createMany({
      data: notificationData,
    });

    return {
      success: true,
      message: `Notifications sent to ${userIds.length} users successfully`,
    };
  }

  // Mark notification as read
  async markAsRead(id: number, userId: number) {
    // Check if notification exists and belongs to the user
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new BadRequestException('You are not authorized to update this notification');
    }

    // Mark as read
    const updatedNotification = await this.prisma.notification.update({
      where: { id },
      data: {
        is_read: true,
      },
    });

    return {
      notification: updatedNotification,
      success: true,
      message: 'Notification marked as read',
    };
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  // Update notification
  async update(updateNotificationInput: UpdateNotificationInput, userId: number) {
    const { id, ...data } = updateNotificationInput;

    // Check if notification exists and belongs to the user
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new BadRequestException('You are not authorized to update this notification');
    }

    // Update the notification
    const updatedNotification = await this.prisma.notification.update({
      where: { id },
      data,
    });

    return {
      notification: updatedNotification,
      success: true,
      message: 'Notification updated successfully',
    };
  }

  // Delete notification
  async remove(id: number, userId: number) {
    // Check if notification exists and belongs to the user
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (notification.userId !== userId) {
      throw new BadRequestException('You are not authorized to delete this notification');
    }

    // Delete the notification
    await this.prisma.notification.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }

  // Delete all read notifications for a user
  async deleteAllRead(userId: number) {
    // Delete all read notifications
    await this.prisma.notification.deleteMany({
      where: {
        userId,
        is_read: true,
      },
    });

    return {
      success: true,
      message: 'All read notifications deleted successfully',
    };
  }
}