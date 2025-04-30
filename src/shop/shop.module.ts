import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopResolver } from './shop.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ShopResolver, ShopService],
  exports: [ShopService],
})
export class ShopModule {}