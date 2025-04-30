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
    return this.orderService.findAll(filterInput || {});
  }

  @Query(() => OrderResponse)
  @UseGuards(AuthGuard)
  async order(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<OrderResponse> {
    return this.orderService.findOne(id);
  }

  @Query(() => OrdersResponse)
  @UseGuards(AuthGuard)
  async myOrders(
    @CurrentUser() user,
    @Args('filterInput', { nullable: true }) filterInput?: Omit<OrderFilterInput, 'userId'>,
  ): Promise<OrdersResponse> {
    return this.orderService.findUserOrders(user.id, filterInput || {});
  }

  @Query(() => OrdersResponse)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async shopOrders(
    @Args('shopId', { type: () => Int }) shopId: number,
    @Args('filterInput', { nullable: true }) filterInput?: Omit<OrderFilterInput, 'shopId'>,
  ): Promise<OrdersResponse> {
    return this.orderService.findShopOrders(shopId, filterInput || {});
  }

  @Mutation(() => OrderResponse)
  @UseGuards(AuthGuard)
  async createOrder(
    @Args('createOrderInput') createOrderInput: CreateOrderInput,
    @CurrentUser() user,
  ): Promise<OrderResponse> {
    return this.orderService.create(createOrderInput, user);
  }

  @Mutation(() => OrderResponse)
  @UseGuards(AuthGuard)
  async updateOrder(
    @Args('updateOrderInput') updateOrderInput: UpdateOrderInput,
    @CurrentUser() user,
  ): Promise<OrderResponse> {
    return this.orderService.update(updateOrderInput, user);
  }

  @Mutation(() => OrderResponse)
  @UseGuards(AuthGuard)
  async cancelOrder(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<OrderResponse> {
    return this.orderService.cancelOrder(id, user);
  }
}