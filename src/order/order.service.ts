import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderInput, UpdateOrderInput, OrderFilterInput } from './dto/order.dto';
import { OrderStatus, PaymentStatus } from './entities/order.entity';
import { User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // Get all orders with filtering options
  async findAll(filterInput: OrderFilterInput) {
    const {
      userId,
      shopId,
      orderNumber,
      status,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      ...(userId && { userId }),
      ...(shopId && { shopId }),
      ...(orderNumber && { orderNumber }),
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(paymentMethod && { paymentMethod }),
    };

    // Add date range filter
    if (startDate || endDate) {
      where.created_at = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    // Get total count for pagination
    const count = await this.prisma.order.count({ where });

    // Get orders with applied filters
    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        shop: shopId ? {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        } : false,
        items: true,
      },
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      orders,
      count,
      success: true,
      message: 'Orders fetched successfully',
    };
  }

  // Get order by ID
  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return {
      order,
      success: true,
      message: 'Order fetched successfully',
    };
  }

  // Get orders for a user
  async findUserOrders(userId: number, filterInput?: Omit<OrderFilterInput, 'userId'>) {
    const {
      shopId,
      orderNumber,
      status,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      userId,
      ...(shopId && { shopId }),
      ...(orderNumber && { orderNumber }),
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(paymentMethod && { paymentMethod }),
    };

    // Add date range filter
    if (startDate || endDate) {
      where.created_at = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    // Get total count for pagination
    const count = await this.prisma.order.count({ where });

    // Get orders with applied filters
    const orders = await this.prisma.order.findMany({
      where,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        items: true,
      },
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      orders,
      count,
      success: true,
      message: 'User orders fetched successfully',
    };
  }

  // Get orders for a shop
  async findShopOrders(shopId: number, filterInput?: Omit<OrderFilterInput, 'shopId'>) {
    const {
      userId,
      orderNumber,
      status,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      shopId,
      ...(userId && { userId }),
      ...(orderNumber && { orderNumber }),
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(paymentMethod && { paymentMethod }),
    };

    // Add date range filter
    if (startDate || endDate) {
      where.created_at = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    // Get total count for pagination
    const count = await this.prisma.order.count({ where });

    // Get orders with applied filters
    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: true,
      },
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      orders,
      count,
      success: true,
      message: 'Shop orders fetched successfully',
    };
  }

  // Create new order
  async create(createOrderInput: CreateOrderInput, user: User) {
    const { items, shopId, discount = 0, ...orderData } = createOrderInput;

    // Check if items are valid
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    // Fetch products information
    const productIds = items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    // Check if all products exist
    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products do not exist');
    }

    // Check if products are in stock
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product with ID ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Not enough stock for product: ${product.name}`);
      }
    }

    // Check shop ID if provided
    if (shopId) {
      const shop = await this.prisma.shop.findUnique({
        where: { id: shopId },
      });
      if (!shop) {
        throw new BadRequestException(`Shop with ID ${shopId} not found`);
      }
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      const price = product.sale_price || product.price;
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: product.images[0] || null,
        price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    // Calculate tax and total
    const tax = subtotal * 0.1; // 10% tax rate
    const shipping = 10; // Fixed shipping cost
    const total = subtotal - discount + tax + shipping;

    // Generate order number
    const orderNumber = `ORD-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create order transaction
    const order = await this.prisma.$transaction(async (prisma) => {
      // Create order
      const newOrder = await prisma.order.create({
        data: {
          orderNumber,
          userId: user.id,
          shopId,
          subtotal,
          discount,
          tax,
          shipping,
          total,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          ...orderData,
          items: {
            create: orderItems,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          shop: shopId ? {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          } : false,
          items: true,
        },
      });

      // Update product stock
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    return {
      order,
      success: true,
      message: 'Order created successfully',
    };
  }

  // Update order
  async update(updateOrderInput: UpdateOrderInput, user: User) {
    const { id, ...updateData } = updateOrderInput;

    // Check if order exists
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Check if user is admin or the order belongs to this user
    if (user.role !== 'ADMIN' && order.userId !== user.id) {
      throw new BadRequestException('You are not authorized to update this order');
    }

    // Convert delivery date string to Date object if provided
    let deliveryDate;
    if (updateData.deliveryDate) {
      deliveryDate = new Date(updateData.deliveryDate);
      delete updateData.deliveryDate;
    }

    // Update order
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        ...updateData,
        ...(deliveryDate && { deliveryDate }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        items: true,
      },
    });

    return {
      order: updatedOrder,
      success: true,
      message: 'Order updated successfully',
    };
  }

  // Cancel order
  async cancelOrder(id: number, user: User) {
    // Check if order exists
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Check if user is admin or the order belongs to this user
    if (user.role !== 'ADMIN' && order.userId !== user.id) {
      throw new BadRequestException('You are not authorized to cancel this order');
    }

    // Check if order can be cancelled
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }

    // Cancel order transaction
    const cancelledOrder = await this.prisma.$transaction(async (prisma) => {
      // Update order status
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.REFUNDED,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          items: true,
        },
      });

      // Restore product stock
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      return updatedOrder;
    });

    return {
      order: cancelledOrder,
      success: true,
      message: 'Order cancelled successfully',
    };
  }
}