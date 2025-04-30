import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { OrderService } from './order.service';
import { Order, OrderResponse, OrdersResponse } from './entities/order.entity';
import { CreateOrderInput, UpdateOrderInput, OrderFilterInput } from './dto/order.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Order)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Query(() => OrdersResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async orders(
    @Args('filterInput', { nullable: true }) filterInput?: OrderFilterInput,
  ): Promise<OrdersResponse> {
    const result = await this.orderService.findAll(filterInput || {});
    
    // Transform the result to match OrdersResponse type
    return {
      orders: result.orders.map(this.transformOrder),
      success: result.success,
      message: result.message,
      count: result.count
    };
  }

  @Query(() => OrderResponse)
  @UseGuards(AuthGuard)
  async order(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<OrderResponse> {
    const result = await this.orderService.findOne(id);
    
    // Transform the result to match OrderResponse type
    return {
      order: result.order ? this.transformOrder(result.order) : undefined,
      success: result.success,
      message: result.message
    };
  }

  @Query(() => OrdersResponse)
  @UseGuards(AuthGuard)
  async myOrders(
    @CurrentUser() user,
    @Args('filterInput', { nullable: true }) filterInput?: Omit<OrderFilterInput, 'userId'>,
  ): Promise<OrdersResponse> {
    const result = await this.orderService.findUserOrders(user.id, filterInput || {});
    
    // Transform the result to match OrdersResponse type
    return {
      orders: result.orders.map(this.transformOrder),
      success: result.success,
      message: result.message,
      count: result.count
    };
  }

  @Query(() => OrdersResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async shopOrders(
    @Args('shopId', { type: () => Int }) shopId: number,
    @Args('filterInput', { nullable: true }) filterInput?: Omit<OrderFilterInput, 'shopId'>,
  ): Promise<OrdersResponse> {
    const result = await this.orderService.findShopOrders(shopId, filterInput || {});
    
    // Transform the result to match OrdersResponse type
    return {
      orders: result.orders.map(this.transformOrder),
      success: result.success,
      message: result.message,
      count: result.count
    };
  }

  @Mutation(() => OrderResponse)
  @UseGuards(AuthGuard)
  async createOrder(
    @Args('createOrderInput') createOrderInput: CreateOrderInput,
    @CurrentUser() user,
  ): Promise<OrderResponse> {
    const result = await this.orderService.create(createOrderInput, user);
    
    // Transform the result to match OrderResponse type
    return {
      order: result.order ? this.transformOrder(result.order) : null,
      success: result.success,
      message: result.message
    };
  }

  @Mutation(() => OrderResponse)
  @UseGuards(AuthGuard)
  async updateOrder(
    @Args('updateOrderInput') updateOrderInput: UpdateOrderInput,
    @CurrentUser() user,
  ): Promise<OrderResponse> {
    const result = await this.orderService.update(updateOrderInput, user);
    
    // Transform the result to match OrderResponse type
    return {
      order: result.order ? this.transformOrder(result.order) : null,
      success: result.success,
      message: result.message
    };
  }

  @Mutation(() => OrderResponse)
  @UseGuards(AuthGuard)
  async cancelOrder(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<OrderResponse> {
    const result = await this.orderService.cancelOrder(id, user);
    
    // Transform the result to match OrderResponse type
    return {
      order: result.order ? this.transformOrder(result.order) : null,
      success: result.success,
      message: result.message
    };
  }

  // Helper method to transform database order objects to GraphQL Order type
  private transformOrder(dbOrder: any): Order {
    // Default required values for Order
    const orderObject: Order = {
      id: dbOrder.id,
      orderNumber: dbOrder.orderNumber || `ORD-${dbOrder.id}`,
      userId: dbOrder.userId,
      items: (dbOrder.items || []).map(item => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName || 'Unknown Product',
        productImage: item.productImage,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal
      })),
      subtotal: dbOrder.subtotal || 0,
      tax: dbOrder.tax || 0,
      shipping: dbOrder.shipping || 0,
      total: dbOrder.total || 0,
      status: dbOrder.status || OrderStatus.PENDING,
      payment_status: dbOrder.payment_status || PaymentStatus.PENDING,
      paymentMethod: dbOrder.paymentMethod || 'CASH_ON_DELIVERY',
      shippingAddress: dbOrder.shippingAddress || '',
      billingAddress: dbOrder.billingAddress || '',
      customerNotes: dbOrder.customerNotes || '',
      created_at: dbOrder.created_at || new Date(),
      updated_at: dbOrder.updated_at || new Date(),
    };

    // Add optional fields if they exist
    if (dbOrder.shopId) orderObject.shopId = dbOrder.shopId;
    if (dbOrder.user) orderObject.user = dbOrder.user;
    if (dbOrder.shop) orderObject.shop = dbOrder.shop;
    if (dbOrder.discount !== undefined) orderObject.discount = dbOrder.discount;
    if (dbOrder.trackingNumber) orderObject.trackingNumber = dbOrder.trackingNumber;
    if (dbOrder.deliveryDate) orderObject.deliveryDate = dbOrder.deliveryDate;

    return orderObject;
  }
}