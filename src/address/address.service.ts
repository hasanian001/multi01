import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressInput, UpdateAddressInput, AddressFilterInput } from './dto/address.dto';
import { User } from '@prisma/client';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  // Get all addresses for a user
  async findAllForUser(userId: number, filterInput?: AddressFilterInput) {
    const { is_default, limit = 10, offset = 0 } = filterInput || {};

    const where = {
      userId,
      ...(is_default !== undefined && { is_default }),
    };

    // Get total count for pagination
    const count = await this.prisma.address.count({ where });

    // Get addresses with applied filters
    const addresses = await this.prisma.address.findMany({
      where,
      orderBy: {
        is_default: 'desc', // Default addresses first
      },
      skip: offset,
      take: limit,
    });

    return {
      addresses,
      count,
      success: true,
      message: 'Addresses fetched successfully',
    };
  }

  // Get address by ID
  async findOne(id: number, userId: number) {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    // Check if address belongs to user
    if (address.userId !== userId) {
      throw new BadRequestException('You are not authorized to access this address');
    }

    return {
      address,
      success: true,
      message: 'Address fetched successfully',
    };
  }

  // Create new address
  async create(createAddressInput: CreateAddressInput, user: User) {
    const { is_default = false, ...addressData } = createAddressInput;

    // If this is the default address, update all other addresses to not be default
    if (is_default) {
      await this.prisma.address.updateMany({
        where: { userId: user.id },
        data: { is_default: false },
      });
    }

    // If this is the first address, make it default regardless of the input
    const addressCount = await this.prisma.address.count({
      where: { userId: user.id },
    });

    const address = await this.prisma.address.create({
      data: {
        ...addressData,
        is_default: addressCount === 0 ? true : is_default,
        userId: user.id,
      },
    });

    return {
      address,
      success: true,
      message: 'Address created successfully',
    };
  }

  // Update address
  async update(updateAddressInput: UpdateAddressInput, userId: number) {
    const { id, is_default, ...addressData } = updateAddressInput;

    // Check if address exists and belongs to the user
    const existingAddress = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    if (existingAddress.userId !== userId) {
      throw new BadRequestException('You are not authorized to update this address');
    }

    // If setting this as default, update all other addresses to not be default
    if (is_default) {
      await this.prisma.address.updateMany({
        where: {
          userId,
          id: { not: id },
        },
        data: { is_default: false },
      });
    }

    // Update the address
    const updatedAddress = await this.prisma.address.update({
      where: { id },
      data: {
        ...addressData,
        ...(is_default !== undefined && { is_default }),
      },
    });

    return {
      address: updatedAddress,
      success: true,
      message: 'Address updated successfully',
    };
  }

  // Delete address
  async remove(id: number, userId: number) {
    // Check if address exists and belongs to the user
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    if (address.userId !== userId) {
      throw new BadRequestException('You are not authorized to delete this address');
    }

    // Delete the address
    await this.prisma.address.delete({
      where: { id },
    });

    // If the deleted address was the default, set another one as default if available
    if (address.is_default) {
      const anotherAddress = await this.prisma.address.findFirst({
        where: { userId },
      });

      if (anotherAddress) {
        await this.prisma.address.update({
          where: { id: anotherAddress.id },
          data: { is_default: true },
        });
      }
    }

    return {
      success: true,
      message: 'Address deleted successfully',
    };
  }

  // Set an address as default
  async setDefault(id: number, userId: number) {
    // Check if address exists and belongs to the user
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    if (address.userId !== userId) {
      throw new BadRequestException('You are not authorized to update this address');
    }

    // Update all addresses to not be default
    await this.prisma.address.updateMany({
      where: { userId },
      data: { is_default: false },
    });

    // Set the selected address as default
    const updatedAddress = await this.prisma.address.update({
      where: { id },
      data: { is_default: true },
    });

    return {
      address: updatedAddress,
      success: true,
      message: 'Address set as default successfully',
    };
  }
}