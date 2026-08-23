export interface PrintResult {
  success: boolean;
  jobId?: string;
  error?: string;
}

export interface PrinterInfo {
  name: string;
  isDefault: boolean;
}

/** Config block read from config/settings.json -> printer */
export interface PrinterConfig {
  mockMode: boolean;
  /** Exact Windows queue name, e.g. "DNP DS-RX1HS" */
  defaultPrinter: string;
}

/** Paper sizes the DNP DS-RX1HS supports, in inches. Matches config/photo-types.json paperSize. */
export const DNP_PAPER_SIZES_IN: Record<string, { width: number; height: number }> = {
  '2x6': { width: 2, height: 6 },
  '4x6': { width: 4, height: 6 },
  passport: { width: 4, height: 6 }, // printed on 4x6 stock, cropped/cut per layout
};