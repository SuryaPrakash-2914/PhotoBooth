/**
 * Printer Service
 * ---------------------------------------------------------------------------
 * Real adapter targets the DNP DS-RX1HS dye-sub photo printer.
 *
 * WHY Electron silent printing instead of DNP's SDK:
 * The DS-RX1HS ships with a standard Windows print driver, so once it's
 * installed the printer just appears as a normal Windows print queue
 * (Settings > Printers & scanners > "DNP DS-RX1HS"). Electron's
 * `webContents.print()` can target a specific queue by name, print
 * silently (no dialog, required for a kiosk), and set an exact page size
 * in microns — which is enough to drive 2x6 / 4x6 output without DNP's
 * proprietary "Digital Print SDK". This avoids an extra SDK licensing step.
 *
 * If you later want faster/more reliable throughput (queue depth reporting,
 * ribbon-remaining status, error codes like "out of media"), DNP's own
 * SDK/driver status API is the next step up — this adapter can be swapped
 * out behind the same PrinterAdapter shape without touching main.ts.
 *
 * SETUP CHECKLIST (on the Mini PC):
 *   1. Install the DNP DS-RX1HS Windows driver, confirm it prints a test
 *      page from Windows normally first.
 *   2. Note the exact queue name shown in Windows (usually "DNP DS-RX1HS")
 *      and put it in config/settings.json -> printer.defaultPrinter.
 *   3. In the driver's printer properties, set default paper to match your
 *      most common job size (this service also passes pageSize explicitly
 *      per job, but a sane default avoids surprises if that's ever skipped).
 * ---------------------------------------------------------------------------
 */

import { BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import type { PrintResult, PrinterInfo, PrinterConfig } from './printer.types';
import { DNP_PAPER_SIZES_IN } from './printer.types';

const MICRONS_PER_INCH = 25400;

class MockPrinterAdapter {
  async getPrinters(): Promise<PrinterInfo[]> {
    return [{ name: 'Mock Photo Printer', isDefault: true }];
  }

  async print(filePath: string, copies: number): Promise<PrintResult> {
    console.log(`[Mock Printer] Printing ${filePath} × ${copies}`);
    await new Promise((r) => setTimeout(r, 500));
    return { success: true, jobId: `job_${Date.now()}` };
  }
}

class DnpPrinterAdapter {
  constructor(private readonly defaultPrinter: string) {}

  async getPrinters(): Promise<PrinterInfo[]> {
    // Needs an existing renderer to enumerate OS printers from; main.ts
    // passes its hidden print window in here via getPrintersFrom().
    return [];
  }

  async getPrintersFrom(win: BrowserWindow): Promise<PrinterInfo[]> {
    const printers = await win.webContents.getPrintersAsync();
    return printers.map((p) => ({ name: p.name, isDefault: p.isDefault }));
  }

  /**
   * @param filePath  absolute path to the final composited JPEG/PNG
   * @param copies    number of prints
   * @param paperSize key into DNP_PAPER_SIZES_IN, e.g. "2x6" | "4x6" | "passport"
   */
  async print(filePath: string, copies: number, paperSize: string = '4x6'): Promise<PrintResult> {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File not found: ${filePath}` };
    }

    const size = DNP_PAPER_SIZES_IN[paperSize] ?? DNP_PAPER_SIZES_IN['4x6'];
    const widthMicrons = Math.round(size.width * MICRONS_PER_INCH);
    const heightMicrons = Math.round(size.height * MICRONS_PER_INCH);

    // Build a tiny throwaway HTML page that fills the page with the image
    // edge-to-edge — this is what actually gets rasterized by Chromium's
    // print pipeline and sent to the DNP driver.
    const html = `<!doctype html>
<html><head><style>
  @page { size: ${size.width}in ${size.height}in; margin: 0; }
  html, body { margin: 0; padding: 0; }
  img { width: ${size.width}in; height: ${size.height}in; object-fit: cover; }
</style></head>
<body><img src="file://${filePath.replace(/\\/g, '/')}" /></body></html>`;

    const tmpHtmlPath = path.join(os.tmpdir(), `nanagraphy_print_${Date.now()}.html`);
    fs.writeFileSync(tmpHtmlPath, html, 'utf-8');

    const printWin = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });

    try {
      await printWin.loadFile(tmpHtmlPath);

      const jobId = `job_${Date.now()}`;
      const result = await new Promise<PrintResult>((resolve) => {
        printWin.webContents.print(
          {
            silent: true,
            deviceName: this.defaultPrinter,
            copies,
            margins: { marginType: 'none' },
            pageSize: { width: widthMicrons, height: heightMicrons },
          },
          (success, failureReason) => {
            if (success) {
              resolve({ success: true, jobId });
            } else {
              resolve({ success: false, error: failureReason || 'Print failed', jobId });
            }
          }
        );
      });

      return result;
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Unknown print error' };
    } finally {
      printWin.close();
      fs.unlink(tmpHtmlPath, () => {});
    }
  }
}

export class PrinterService {
  private adapter: MockPrinterAdapter | DnpPrinterAdapter;
  private mockMode: boolean;

  constructor(cfg: PrinterConfig) {
    this.mockMode = cfg.mockMode;
    this.adapter = cfg.mockMode
      ? new MockPrinterAdapter()
      : new DnpPrinterAdapter(cfg.defaultPrinter);
  }

  async getPrinters(probeWindow?: BrowserWindow): Promise<PrinterInfo[]> {
    if (!this.mockMode && probeWindow && this.adapter instanceof DnpPrinterAdapter) {
      return this.adapter.getPrintersFrom(probeWindow);
    }
    return this.adapter.getPrinters();
  }

  async print(filePath: string, copies: number, paperSize?: string): Promise<PrintResult> {
    if (this.adapter instanceof DnpPrinterAdapter) {
      return this.adapter.print(filePath, copies, paperSize);
    }
    return this.adapter.print(filePath, copies);
  }
}

export let printerService: PrinterService | null = null;
export function initPrinterService(cfg: PrinterConfig) {
  printerService = new PrinterService(cfg);
  return printerService;
}