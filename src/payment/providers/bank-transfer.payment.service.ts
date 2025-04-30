import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentTransaction, PaymentTransactionStatus } from '@prisma/client';
import { 
  IPaymentProviderService, 
  PaymentIntentResult,
  PaymentRefundResult,
  PaymentStatusResult
} from '../interfaces/payment-provider.interface';

@Injectable()
export class BankTransferPaymentService implements IPaymentProviderService {
  private readonly logger = new Logger(BankTransferPaymentService.name);
  
  constructor(private configService: ConfigService) {}

  async createPaymentIntent(
    amount: number,
    currency: string,
    paymentTransaction: PaymentTransaction,
    metadata: any,
    returnUrl: string,
  ): Promise<PaymentIntentResult> {
    try {
      this.logger.log(`Creating bank transfer payment for transaction ${paymentTransaction.transactionId}`);
      
      // Bank transfer doesn't need a payment intent, just generate information for the user
      const bankDetails = {
        bankName: this.configService.get<string>('BANK_NAME') || 'Demo Bank',
        accountNumber: this.configService.get<string>('BANK_ACCOUNT_NUMBER') || '1234567890',
        accountName: this.configService.get<string>('BANK_ACCOUNT_NAME') || 'Ecommerce Store',
        reference: paymentTransaction.transactionId,
      };
      
      return {
        success: true,
        paymentIntent: paymentTransaction.transactionId,
        transactionId: paymentTransaction.transactionId,
        message: 'Bank transfer payment created successfully. Please transfer the amount to the specified bank account with the reference number.',
        // Include bank details for the client to display
        redirectUrl: `${returnUrl}?bankInfo=${encodeURIComponent(JSON.stringify(bankDetails))}`,
      };
    } catch (error) {
      this.logger.error(`Error creating bank transfer payment: ${error.message}`, error.stack);
      return {
        success: false,
        transactionId: paymentTransaction.transactionId,
        message: `Failed to create bank transfer payment: ${error.message}`,
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
      this.logger.log(`Refunding bank transfer payment for transaction ${paymentTransaction.transactionId}`);

      // Bank transfer refunds are typically manual, just log the request
      const mockRefundId = `BT-REF-${Date.now()}`;
      
      return {
        success: true,
        refundId: mockRefundId,
        message: `Refund initiated for bank transfer. A manual refund will be processed for transaction ${paymentTransaction.transactionId}`,
      };
    } catch (error) {
      this.logger.error(`Error refunding bank transfer payment: ${error.message}`, error.stack);
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
      this.logger.log(`Retrieving bank transfer payment status for transaction ${paymentTransaction.transactionId}`);

      // For bank transfers, status is usually updated manually by an admin
      // Return the current status from the database
      
      return {
        success: true,
        status: paymentTransaction.status,
        message: `Payment status retrieved for bank transfer transaction ${paymentTransaction.transactionId}`,
        paymentDetails: {
          transactionId: paymentTransaction.transactionId,
          amount: paymentTransaction.amount,
          currency: paymentTransaction.currency || 'USD',
          created: new Date(paymentTransaction.created_at).toISOString(),
          status: paymentTransaction.status,
        },
      };
    } catch (error) {
      this.logger.error(`Error retrieving bank transfer payment status: ${error.message}`, error.stack);
      return {
        success: false,
        status: PaymentTransactionStatus.FAILED,
        message: `Failed to retrieve payment status: ${error.message}`,
        error: error,
      };
    }
  }
}