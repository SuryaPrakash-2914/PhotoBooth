/**
 * Payment Service
 * ---------------------------------------------------------------------------
 * Real adapter builds a standard UPI intent deep link
 * (upi://pay?pa=<vpa>&pn=<name>&am=<amount>&tn=<note>&cu=INR) and renders it
 * to a PNG QR code with the `qrcode` npm package, entirely offline — no
 * payment-gateway account is required just to *display* a payable QR.
 *
 * WHAT THIS ADAPTER DOES NOT DO:
 * Standard UPI intent links have no delivery receipt built in — the paying
 * app never tells your machine "this succeeded". Real-world kiosks solve
 * this one of two ways:
 *   1. A PSP aggregator (Razorpay, Cashfree, PhonePe Business, etc.) that
 *      issues its own order id/QR and pushes a webhook or gives you a
 *      status-poll endpoint when money lands.
 *   2. A UPI-linked bank SMS/webhook listener that matches incoming credits
 *      to the amount+timestamp of an open order.
 * Neither is wired up here — there's no PSP account/credentials to test
 * against from this environment. checkStatus() below is the integration
 * point: swap its body for a call to whichever provider you pick, matching
 * the same StatusResult shape. Until then it always reports 'pending', so
 * the UI needs a manual "confirm cash/UPI received" fallback if you go live
 * before wiring a real provider — see paymentStore note in Payment page.
 *
 * SETUP CHECKLIST (on the Mini PC):
 *   1. Set config/settings.json -> payment.mockMode = false.
 *   2. Set payment.merchantVpa to the receiving UPI id, e.g. "shop@okhdfcbank".
 *   3. Pick a PSP/webhook approach and implement checkStatus() below.
 * ---------------------------------------------------------------------------
 */

import QRCode from 'qrcode';
import type {
  PaymentAdapter,
  PaymentConfig,
  CreateOrderResult,
  StatusResult,
} from './payment.types';

class MockPaymentAdapter implements PaymentAdapter {
  private orders = new Map<string, { amount: number; createdAt: number }>();

  async createOrder(amount: number): Promise<CreateOrderResult> {
    const orderId = `order_${Date.now()}`;
    this.orders.set(orderId, { amount, createdAt: Date.now() });
    const qrData = `upi://pay?pa=merchant@upi&am=${amount}&tn=NANAGRAPHY&cu=INR`;
    const qrImage = await QRCode.toDataURL(qrData, { margin: 1, width: 512 });
    return { success: true, orderId, qrData, qrImage };
  }

  async checkStatus(orderId: string): Promise<StatusResult> {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, status: 'failed', error: 'Unknown orderId' };
    }
    const elapsed = Date.now() - order.createdAt;
    // Mirrors the old renderer-side mock timing (~4s to "pay", ~2s to verify)
    // so existing demo pacing feels the same, now driven from main process.
    if (elapsed < 4000) {
      return { success: true, status: 'pending' };
    }
    if (elapsed < 6000) {
      return { success: true, status: 'pending' };
    }
    const success = Math.random() > 0.1;
    return success
      ? { success: true, status: 'success', transactionId: `txn_${Date.now()}` }
      : { success: true, status: 'failed', error: 'Payment declined' };
  }
}

class UpiPaymentAdapter implements PaymentAdapter {
  constructor(private readonly vpa: string, private readonly merchantName: string) {}

  async createOrder(amount: number): Promise<CreateOrderResult> {
    if (!this.vpa) {
      return { success: false, error: 'payment.merchantVpa is not set in config/settings.json' };
    }
    const orderId = `order_${Date.now()}`;
    const qrData =
      `upi://pay?pa=${encodeURIComponent(this.vpa)}` +
      `&pn=${encodeURIComponent(this.merchantName)}` +
      `&am=${amount.toFixed(2)}` +
      `&tn=${encodeURIComponent(`${this.merchantName} order ${orderId}`)}` +
      `&cu=INR`;
    try {
      const qrImage = await QRCode.toDataURL(qrData, { margin: 1, width: 512 });
      return { success: true, orderId, qrData, qrImage };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Failed to generate QR' };
    }
  }

  async checkStatus(_orderId: string): Promise<StatusResult> {
    // No PSP/webhook wired up yet — see file header. Always 'pending' until
    // this is connected to a real provider.
    return { success: true, status: 'pending' };
  }
}

export class PaymentService {
  private adapter: PaymentAdapter;

  constructor(cfg: PaymentConfig) {
    this.adapter = cfg.mockMode
      ? new MockPaymentAdapter()
      : new UpiPaymentAdapter(cfg.merchantVpa ?? '', cfg.merchantName);
  }

  async createOrder(amount: number) {
    return this.adapter.createOrder(amount);
  }

  async checkStatus(orderId: string) {
    return this.adapter.checkStatus(orderId);
  }
}

export let paymentService: PaymentService | null = null;
export function initPaymentService(cfg: PaymentConfig) {
  paymentService = new PaymentService(cfg);
  return paymentService;
}
