import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderInput, UpdateOrderInput, OrderFilterInput } from './dto/order.dto';
import { User, OrderStatus, PaymentStatus } from '@prisma/client';
import { generateOrderNumber } from '../utils/generate-order-number';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // Get all orders with filtering options
  async findAll(filterInput: OrderFilterInput) {
    const {
      userId,
      shopId,
      status,
      payment_status,
      fromDate,
      toDate,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      ...(userId && { userId: Number(userId) }),
      ...(status && { status }),
      ...(payment_status && { payment_status }),
    };

    // Add date range filter
    if (fromDate || toDate) {
      where.created_at = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    // If shopId is provided, filter by products' shop
    if (shopId) {
      where.items = {
        some: {
          product: {
            shopId: Number(shopId),
          },
        },
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
        items: {
          include: {
            product: {
              include: {
                shop: true,
              },
            },
          },
        },
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
        items: {
          include: {
            product: {
              include: {
                shop: true,
              },
            },
          },
        },
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
      status,
      payment_status,
      fromDate,
      toDate,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build filter conditions
    const where: any = {
      userId,
      ...(status && { status }),
      ...(payment_status && { payment_status }),
    };

    // Add date range filter
    if (fromDate || toDate) {
      where.created_at = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    // Get total count for pagination
    const count = await this.prisma.order.count({ where });

    // Get orders with applied filters
    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                shop: true,
              },
            },
          },
        },
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

  // Get orders for a shop
  async findShopOrders(shopId: number, filterInput?: Omit<OrderFilterInput, 'shopId'>) {
    const {
      status,
      payment_status,
      fromDate,
      toDate,
      limit = 10,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filterInput || {};

    // Build base filter conditions (without shop for now)
    const where: any = {
      ...(status && { status }),
      ...(payment_status && { payment_status }),
    };

    // Add date range filter
    if (fromDate || toDate) {
      where.created_at = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    // Add filter to include only orders with items from this shop
    where.items = {
      some: {
        product: {
          shopId: Number(shopId),
        },
      },
    };

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
        items: {
          include: {
            product: {
              include: {
                shop: true,
              },
            },
          },
        },
      },
      skip: offset,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    // Filter order items to only include those for this shop
    const filteredOrders = orders.map(order => ({
      ...order,
      items: order.items.filter(item => item.product.shopId === Number(shopId)),
    }));

    return {
      orders: filteredOrders,
      count,
      success: true,
      message: 'Shop orders fetched successfully',
    };
  }

  // Create new order
  async create(createOrderInput: CreateOrderInput, user: User) {
    const { items, ...orderData } = createOrderInput;

    // Check if the cart is empty
    if (!items || items.length === 0) {
      throw new BadRequestException('Cannot create order with empty cart');
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { productId, quantity } = item;

      // Check if product exists
      const product = await this.prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      // Check if the product is in stock
      if (product.stock < quantity) {
        throw new BadRequestException(`Product "${product.name}" only has ${product.stock} items in stock`);
      }

      // Calculate subtotal
      const itemPrice = product.sale_price || product.price;
      const itemSubtotal = itemPrice * quantity;
      subtotal += itemSubtotal;

      // Prepare order item
      orderItems.push({
        productId: Number(productId),
        quantity,
        price: itemPrice,
      });
    }

    // Calculate total
    const discount = orderData.discount || 0;
    const shippingFee = orderData.shipping_fee || 0;
    const total = subtotal - discount + shippingFee;

    // Generate unique order number
    const orderNumber = generateOrderNumber();

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        ...orderData,
        userId: user.id,
        total,
        discount,
        shipping_fee: shippingFee,
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
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update product stock
    for (const item of orderItems) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return {
      order,
      success: true,
      message: 'Order created successfully',
    };
  }

  // Update order
  async update(updateOrderInput: UpdateOrderInput, user: User) {
    const { id, status, payment_status, tracking_number, notes } = updateOrderInput;

    // Check if order exists
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                shop: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Only admin or the user who placed the order can update it
    if (user.role !== 'ADMIN' && order.userId !== user.id) {
      // Check if user is a seller and this order contains their products
      const isSeller = user.role === 'SELLER';
      const isSellerOrder = order.items.some(
        item => item.product.shop.ownerId === user.id
      );

      if (!(isSeller && isSellerOrder)) {
        throw new BadRequestException('You are not authorized to update this order');
      }
    }

    // If status is being updated, validate status change
    if (status) {
      // Validate status transitions
      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Cannot update a cancelled order');
      }

      if (
        order.status === OrderStatus.DELIVERED &&
        status !== OrderStatus.COMPLETED &&
        status !== OrderStatus.RETURNED
      ) {
        throw new BadRequestException('Delivered order can only be marked as completed or returned');
      }
    }

    // Update order
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(payment_status && { payment_status }),
        ...(tracking_number && { tracking_number }),
        ...(notes && { notes }),
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
        items: {
          include: {
            product: {
              include: {
                shop: true,
              },
            },
          },
        },
      },
    });

    // If order is cancelled, restore product stock
    if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      for (const item of order.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

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
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Only admin or the user who placed the order can cancel it
    if (user.role !== 'ADMIN' && order.userId !== user.id) {
      throw new BadRequestException('You are not authorized to cancel this order');
    }

    // Validate order status
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    if (
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.COMPLETED
    ) {
      throw new BadRequestException('Cannot cancel delivered or completed orders');
    }

    // Cancel order
    const cancelledOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
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
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Restore product stock
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    return {
      order: cancelledOrder,
      success: true,
      message: 'Order cancelled successfully',
    };
  }
}