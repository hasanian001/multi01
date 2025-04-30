import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@prisma/client';
import { StripePaymentService } from './providers/stripe.payment.service';
import { PayPalPaymentService } from './providers/paypal.payment.service';
import { SSLCommerzPaymentService } from './providers/sslcommerz.payment.service';
import { BankTransferPaymentService } from './providers/bank-transfer.payment.service';
import { CashOnDeliveryPaymentService } from './providers/cash-on-delivery.payment.service';
import { IPaymentProviderService } from './interfaces/payment-provider.interface';

@Injectable()
export class PaymentProviderFactory {
  private readonly providers: Map<PaymentProvider, IPaymentProviderService>;

  constructor(
    private readonly configService: ConfigService,
    private readonly stripePaymentService: StripePaymentService,
    private readonly paypalPaymentService: PayPalPaymentService,
    private readonly sslCommerzPaymentService: SSLCommerzPaymentService,
    private readonly bankTransferPaymentService: BankTransferPaymentService,
    private readonly cashOnDeliveryPaymentService: CashOnDeliveryPaymentService,
  ) {
    this.providers = new Map<PaymentProvider, IPaymentProviderService>([
      [PaymentProvider.STRIPE, this.stripePaymentService],
      [PaymentProvider.PAYPAL, this.paypalPaymentService],
      [PaymentProvider.SSLCOMMERZ, this.sslCommerzPaymentService],
      [PaymentProvider.BANK_TRANSFER, this.bankTransferPaymentService],
      [PaymentProvider.CASH_ON_DELIVERY, this.cashOnDeliveryPaymentService],
    ]);
  }

  getProvider(provider: PaymentProvider): IPaymentProviderService {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider) {
      throw new Error(`Payment provider ${provider} not supported`);
    }
    return paymentProvider;
  }
}