import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PaymentTransaction } from '../models/payment-transaction.model';
import { PaymentTransactionStatus } from '../models/payment-transaction.model';
import { 
  IPaymentProviderService, 
  PaymentIntentResult,
  PaymentRefundResult,
  PaymentStatusResult
} from '../interfaces/payment-provider.interface';

@Injectable()
export class CashOnDeliveryPaymentService implements IPaymentProviderService {
  private readonly logger = new Logger(CashOnDeliveryPaymentService.name);
  
  constructor(private configService: ConfigService) {}

  async createPaymentIntent(
    amount: number,
    currency: string,
    paymentTransaction: PaymentTransaction,
    metadata: any,
    returnUrl: string,
  ): Promise<PaymentIntentResult> {
    try {
      this.logger.log(`Creating Cash on Delivery payment for transaction ${paymentTransaction.transactionId}`);
      
      // Cash on Delivery doesn't need a payment intent, just mark it as pending
      return {
        success: true,
        paymentIntent: paymentTransaction.transactionId,
        transactionId: paymentTransaction.transactionId,
        message: 'Cash on Delivery payment created successfully. Payment will be collected upon delivery.',
        redirectUrl: returnUrl,
      };
    } catch (error) {
      this.logger.error(`Error creating Cash on Delivery payment: ${error.message}`, error.stack);
      return {
        success: false,
        transactionId: paymentTransaction.transactionId,
        message: `Failed to create Cash on Delivery payment: ${error.message}`,
        error: error,
      };
    }
  }

  async refundPayment(
    paymentTransaction: PaymentTransaction,
    amount: number,
    reason?: string,
  ): Promise<PaymentRefundResult> {
    try {
      this.logger.log(`Refunding Cash on Delivery payment for transaction ${paymentTransaction.transactionId}`);

      // For COD, a refund would typically involve returning a physical product
      // and then updating the system, so this is just a status update
      const mockRefundId = `COD-REF-${Date.now()}`;
      
      return {
        success: true,
        refundId: mockRefundId,
        message: `Refund initiated for Cash on Delivery. Please ensure the customer has returned the product for transaction ${paymentTransaction.transactionId}`,
      };
    } catch (error) {
      this.logger.error(`Error refunding Cash on Delivery payment: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Failed to process refund: ${error.message}`,
        error: error,
      };
    }
  }

  async retrievePaymentStatus(
    paymentTransaction: PaymentTransaction,
  ): Promise<PaymentStatusResult> {
    try {
      this.logger.log(`Retrieving Cash on Delivery payment status for transaction ${paymentTransaction.transactionId}`);

      // For COD, status is typically updated when delivery is completed
      // This would be set by an external delivery tracking system or manually by staff
      
      // Extract delivery status from transaction metadata if available
      const metadataObj = paymentTransaction.metadata ? 
        (typeof paymentTransaction.metadata === 'string' ? 
          JSON.parse(paymentTransaction.metadata) : paymentTransaction.metadata) : {};
      const deliveryStatus = metadataObj.deliveryStatus || 'Pending';
      
      return {
        success: true,
        status: paymentTransaction.status,
        message: `Payment status retrieved for Cash on Delivery transaction ${paymentTransaction.transactionId}`,
        paymentDetails: {
          transactionId: paymentTransaction.transactionId,
          amount: paymentTransaction.amount,
          currency: paymentTransaction.currency || 'USD',
          created: new Date(paymentTransaction.created_at).toISOString(),
          status: paymentTransaction.status,
          deliveryStatus: deliveryStatus,
        },
      };
    } catch (error) {
      this.logger.error(`Error retrieving Cash on Delivery payment status: ${error.message}`, error.stack);
      return {
        success: false,
        status: PaymentTransactionStatus.FAILED,
        message: `Failed to retrieve payment status: ${error.message}`,
        error: error,
      };
    }
  }
}