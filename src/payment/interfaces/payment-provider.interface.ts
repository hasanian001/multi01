import { PaymentTransaction, PaymentTransactionStatus } from '../models/payment-transaction.model';

export interface PaymentIntentResult {
  success: boolean;
  paymentIntent?: string;
  clientSecret?: string;
  redirectUrl?: string;
  transactionId: string;
  message: string;
  error?: any;
}

export interface PaymentRefundResult {
  success: boolean;
  refundId?: string;
  message: string;
  error?: any;
}

export interface PaymentStatusResult {
  success: boolean;
  status: PaymentTransactionStatus;
  message: string;
  paymentDetails?: any;
  error?: any;
}

export interface IPaymentProviderService {
  createPaymentIntent(
    amount: number,
    currency: string,
    paymentTransaction: PaymentTransaction,
    metadata: any,
    returnUrl: string,
    cancelUrl?: string,
  ): Promise<PaymentIntentResult>;

  refundPayment(
    paymentTransaction: PaymentTransaction,
    amount: number,
    reason?: string,
  ): Promise<PaymentRefundResult>;

  retrievePaymentStatus(
    paymentTransaction: PaymentTransaction,
  ): Promise<PaymentStatusResult>;
}