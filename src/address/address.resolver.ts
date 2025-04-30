import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { Address, AddressResponse, AddressesResponse } from './entities/address.entity';
import { CreateAddressInput, UpdateAddressInput, AddressFilterInput } from './dto/address.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Address)
export class AddressResolver {
  constructor(private readonly addressService: AddressService) {}

  @Query(() => AddressesResponse)
  @UseGuards(AuthGuard)
  async myAddresses(
    @CurrentUser() user,
    @Args('filterInput', { nullable: true }) filterInput?: AddressFilterInput,
  ): Promise<AddressesResponse> {
    return this.addressService.findAllForUser(user.id, filterInput);
  }

  @Query(() => AddressResponse)
  @UseGuards(AuthGuard)
  async address(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<AddressResponse> {
    return this.addressService.findOne(id, user.id);
  }

  @Mutation(() => AddressResponse)
  @UseGuards(AuthGuard)
  async createAddress(
    @Args('createAddressInput') createAddressInput: CreateAddressInput,
    @CurrentUser() user,
  ): Promise<AddressResponse> {
    return this.addressService.create(createAddressInput, user);
  }

  @Mutation(() => AddressResponse)
  @UseGuards(AuthGuard)
  async updateAddress(
    @Args('updateAddressInput') updateAddressInput: UpdateAddressInput,
    @CurrentUser() user,
  ): Promise<AddressResponse> {
    return this.addressService.update(updateAddressInput, user.id);
  }

  @Mutation(() => AddressResponse)
  @UseGuards(AuthGuard)
  async deleteAddress(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<AddressResponse> {
    return this.addressService.remove(id, user.id);
  }

  @Mutation(() => AddressResponse)
  @UseGuards(AuthGuard)
  async setDefaultAddress(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user,
  ): Promise<AddressResponse> {
    return this.addressService.setDefault(id, user.id);
  }
}