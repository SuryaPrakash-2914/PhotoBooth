/**
 * Camera Service
 * ---------------------------------------------------------------------------
 * Real adapter targets Canon EOS R100 via digiCamControl (free/open-source
 * Windows tethering tool: https://digicamcontrol.com).
 *
 * WHY digiCamControl instead of Canon's own SDK:
 * Canon's official "EDSDK" requires a signed developer/partner agreement
 * with Canon before you can even download it. digiCamControl already speaks
 * PTP to Canon EOS bodies (R100 included) and ships two integration points
 * we use here:
 *   1. CameraControlRemoteCmd.exe – CLI that sends commands to an already
 *      running digiCamControl instance (session config + capture).
 *   2. Built-in web server (Tools > Settings > Web server, default port
 *      5513) – serves the current live-view frame at /liveview.jpg, which
 *      we poll for the UI 3-2-1 preview.
 *
 * SETUP CHECKLIST (on the Mini PC):
 *   1. Install digiCamControl, plug in the R100 (set camera to PC/tether
 *      or "Movie/Photo auto" mode as digiCamControl requires), confirm it
 *      shows "Connected" in the digiCamControl UI.
 *   2. Tools > Settings > Web server > enable, note the port (default 5513).
 *   3. Leave digiCamControl running in the background (or launch it from
 *      main.ts on app start — see spawnDigiCamControl() below).
 *   4. Update config/settings.json -> camera.digiCamControlPath if you
 *      installed to a non-default location.
 *
 * NOTE: I have not been able to test this against physical hardware from
 * here — the exact CLI flags below match digiCamControl's published
 * command reference, but you should smoke-test `connect()` and `capture()`
 * once against the real R100 and adjust paths/flags if your installed
 * version differs.
 * ---------------------------------------------------------------------------
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import http from 'http';
import type { CameraAdapter, CaptureResult, CameraConfig } from './camera.types';

const execFileAsync = promisify(execFile);

class MockCameraAdapter implements CameraAdapter {
  private connected = false;

  async connect(): Promise<boolean> {
    this.connected = true;
    console.log('[Camera] Mock camera connected');
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('[Camera] Mock camera disconnected');
  }

  async capture(destPath: string): Promise<CaptureResult> {
    if (!this.connected) {
      return { success: false, error: 'Camera not connected' };
    }
    await new Promise((r) => setTimeout(r, 300));
    return { success: true, path: destPath || `mock://capture_${Date.now()}.jpg` };
  }

  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Canon EOS R100 (and other EOS bodies) via digiCamControl.
 */
class DigiCamControlAdapter implements CameraAdapter {
  private connected = false;
  private readonly exePath: string;
  private readonly webServerPort: number;
  private readonly captureTimeoutMs: number;

  constructor(cfg: CameraConfig) {
    const installDir =
      cfg.digiCamControlPath || 'C:\\Program Files (x86)\\digiCamControl';
    this.exePath = path.join(installDir, 'CameraControlRemoteCmd.exe');
    this.webServerPort = cfg.webServerPort ?? 5513;
    this.captureTimeoutMs = cfg.captureTimeoutMs ?? 10000;
  }

  private async runCmd(args: string[]): Promise<string> {
    if (!fs.existsSync(this.exePath)) {
      throw new Error(
        `digiCamControl CLI not found at ${this.exePath}. Check config/settings.json -> camera.digiCamControlPath`
      );
    }
    const { stdout } = await execFileAsync(this.exePath, args, {
      timeout: this.captureTimeoutMs,
    });
    return stdout.trim();
  }

  async connect(): Promise<boolean> {
    try {
      // "/c list" prints connected camera names; empty output = nothing detected.
      const out = await this.runCmd(['/c', 'list']);
      this.connected = out.length > 0;
      console.log(`[Camera] digiCamControl device list: "${out}"`);
      return this.connected;
    } catch (err) {
      console.error('[Camera] connect() failed:', err);
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // digiCamControl keeps the camera session open in the background app;
    // nothing to explicitly tear down per-capture, so this is a no-op that
    // just flips our local flag.
    this.connected = false;
  }

  async capture(destPath: string): Promise<CaptureResult> {
    if (!this.connected) {
      return { success: false, error: 'Camera not connected' };
    }
    try {
      const dir = path.dirname(destPath);
      const filename = path.basename(destPath, path.extname(destPath));
      fs.mkdirSync(dir, { recursive: true });

      // Point digiCamControl's session at our folder/filename, then capture.
      await this.runCmd(['/c', 'session.folder', dir]);
      await this.runCmd(['/c', 'session.filenametemplate', filename]);
      await this.runCmd(['/c', 'capture']);

      if (!fs.existsSync(destPath)) {
        // digiCamControl may append its own extension/counter; give it a
        // moment and check for the most recent file it dropped in dir.
        await new Promise((r) => setTimeout(r, 500));
        const candidate = this.findLatestFile(dir);
        if (candidate) {
          return { success: true, path: candidate };
        }
        return { success: false, error: 'Capture completed but file was not found on disk' };
      }

      return { success: true, path: destPath };
    } catch (err: any) {
      console.error('[Camera] capture() failed:', err);
      return { success: false, error: err?.message ?? 'Unknown capture error' };
    }
  }

  private findLatestFile(dir: string): string | null {
    try {
      const files = fs
        .readdirSync(dir)
        .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
        .sort((a, b) => b.t - a.t);
      return files.length ? path.join(dir, files[0].f) : null;
    } catch {
      return null;
    }
  }

  /**
   * Live-view frame for the on-screen "camera view" (UI 3), pulled from
   * digiCamControl's web server. Poll this at ~10-15fps from the renderer.
   */
  async getLiveView(): Promise<Buffer | null> {
    return new Promise((resolve) => {
      const req = http.get(
        { host: '127.0.0.1', port: this.webServerPort, path: '/liveview.jpg', timeout: 2000 },
        (res) => {
          if (res.statusCode !== 200) {
            resolve(null);
            return;
          }
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        }
      );
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export class CameraService {
  private adapter: CameraAdapter;

  constructor(cfg: CameraConfig) {
    this.adapter = cfg.mockMode ? new MockCameraAdapter() : new DigiCamControlAdapter(cfg);
  }

  async connect() {
    return this.adapter.connect();
  }

  async disconnect() {
    return this.adapter.disconnect();
  }

  async capture(destPath: string) {
    return this.adapter.capture(destPath);
  }

  async getLiveView() {
    return this.adapter.getLiveView ? this.adapter.getLiveView() : null;
  }

  isConnected() {
    return this.adapter.isConnected();
  }
}

// Instantiated with real config in main.ts (needs settings.json loaded first).
export let cameraService: CameraService | null = null;
export function initCameraService(cfg: CameraConfig) {
  cameraService = new CameraService(cfg);
  return cameraService;
}