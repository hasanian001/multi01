import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { extendPrismaClient } from './prisma-extensions';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Extended client with custom models
  private extendedClient: any;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
    // Extend the client but store it in a property
    this.extendedClient = extendPrismaClient(this);
  }
  
  // Forward requests to custom models to the extended client
  get paymentTransaction() {
    return this.extendedClient.paymentTransaction;
  }
  
  get paymentRefund() {
    return this.extendedClient.paymentRefund;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    
    // This is only for development and testing environments
    const modelNames = Reflect.ownKeys(this).filter(
      (key) => key[0] !== '_' && key[0] !== '$' && key !== 'engine',
    );

    return Promise.all(
      modelNames.map((modelName) => this[modelName as string].deleteMany({})),
    );
  }
}