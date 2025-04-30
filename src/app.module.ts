import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ShopModule } from './shop/shop.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { BrandModule } from './brand/brand.module';
import { OrderModule } from './order/order.module';
import { ReviewModule } from './review/review.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CouponModule } from './coupon/coupon.module';
import { PaymentModule } from './payment/payment.module';
import { AddressModule } from './address/address.module';
import { NotificationModule } from './notification/notification.module';
import { CommonModule } from './common/common.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req, res }) => ({ req, res }),
    }),
    PrismaModule,
    CommonModule,
    UserModule,
    ShopModule,
    ProductModule,
    CategoryModule,
    BrandModule,
    OrderModule,
    ReviewModule,
    CartModule,
    WishlistModule,
    CouponModule,
    PaymentModule,
    AddressModule,
    NotificationModule,
    // Add other modules here as we develop them
  ],
  controllers: [],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}