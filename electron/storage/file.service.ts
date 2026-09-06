/**
 * File / Session Storage Service
 * Uses Electron's app.getPath('userData') – never hard-coded Windows paths
 */

import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import type { PaymentRecord } from '../payment/payment.types';

export class FileService {
  private getBaseDir() {
    return path.join(app.getPath('userData'), 'PhotoBooth');
  }

  getSessionsDir() {
    return path.join(this.getBaseDir(), 'sessions');
  }

  getLogsDir() {
    return path.join(this.getBaseDir(), 'logs');
  }

  private getPaymentsPath() {
    return path.join(this.getBaseDir(), 'payments.json');
  }

  getPaymentHistory(): PaymentRecord[] {
    const paymentsPath = this.getPaymentsPath();
    if (!fs.existsSync(paymentsPath)) return [];
    try {
      return JSON.parse(fs.readFileSync(paymentsPath, 'utf-8')) as PaymentRecord[];
    } catch {
      return [];
    }
  }

  savePayment(record: PaymentRecord): void {
    const paymentsPath = this.getPaymentsPath();
    fs.mkdirSync(this.getBaseDir(), { recursive: true });
    fs.writeFileSync(paymentsPath, JSON.stringify([record, ...this.getPaymentHistory()], null, 2), 'utf-8');
  }

  updatePayment(orderId: string, update: Partial<PaymentRecord>): void {
    const records = this.getPaymentHistory().map((record) =>
      record.orderId === orderId ? { ...record, ...update, updatedAt: new Date().toISOString() } : record
    );
    fs.mkdirSync(this.getBaseDir(), { recursive: true });
    fs.writeFileSync(this.getPaymentsPath(), JSON.stringify(records, null, 2), 'utf-8');
  }

  async createSessionFolder(sessionId: string): Promise<string> {
    const sessionDir = path.join(this.getSessionsDir(), sessionId);
    const subdirs = ['original', 'edited', 'final'];

    for (const sub of subdirs) {
      fs.mkdirSync(path.join(sessionDir, sub), { recursive: true });
    }

    return sessionDir;
  }

  getOriginalPath(sessionId: string, poseIndex: number): string {
    return path.join(
      this.getSessionsDir(),
      sessionId,
      'original',
      `pose_${String(poseIndex).padStart(2, '0')}.jpg`
    );
  }

  getEditedPath(sessionId: string, poseIndex: number): string {
    return path.join(
      this.getSessionsDir(),
      sessionId,
      'edited',
      `pose_${String(poseIndex).padStart(2, '0')}.jpg`
    );
  }

  getFinalPath(sessionId: string): string {
    return path.join(this.getSessionsDir(), sessionId, 'final', 'print_layout.jpg');
  }

  async cleanupSession(sessionId: string): Promise<void> {
    const sessionDir = path.join(this.getSessionsDir(), sessionId);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
  }
}

export const fileService = new FileService();
