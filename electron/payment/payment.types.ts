export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  /** upi://pay?... deep link encoded into the QR */
  qrData?: string;
  /** data:image/png;base64,... rendering of qrData, generated server-side */
  qrImage?: string;
  error?: string;
}

export type PaymentState = 'pending' | 'success' | 'failed';

export interface StatusResult {
  success: boolean;
  status: PaymentState;
  transactionId?: string;
  error?: string;
}

/** Config block read from config/settings.json -> payment */
export interface PaymentConfig {
  mockMode: boolean;
  provider: string;
  merchantName: string;
  /** UPI VPA to receive payment, e.g. "merchant@upi" (required when mockMode=false) */
  merchantVpa?: string;
}

export interface PaymentAdapter {
  createOrder(amount: number): Promise<CreateOrderResult>;
  checkStatus(orderId: string): Promise<StatusResult>;
}
