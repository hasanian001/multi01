import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './payment.resolver';
import { PaymentProviderFactory } from './payment-provider.factory';
import { StripePaymentService } from './providers/stripe.payment.service';
import { PayPalPaymentService } from './providers/paypal.payment.service';
import { SSLCommerzPaymentService } from './providers/sslcommerz.payment.service';
import { BankTransferPaymentService } from './providers/bank-transfer.payment.service';
import { CashOnDeliveryPaymentService } from './providers/cash-on-delivery.payment.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    PaymentService,
    PaymentResolver,
    PaymentProviderFactory,
    StripePaymentService,
    PayPalPaymentService,
    SSLCommerzPaymentService,
    BankTransferPaymentService,
    CashOnDeliveryPaymentService,
  ],
  exports: [PaymentService, PaymentProviderFactory],
})
export class PaymentModule {}