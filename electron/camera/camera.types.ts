export interface CameraDevice {
  id: string;
  model: string;
  brand: 'Canon' | 'Nikon' | 'Sony' | 'Other';
  connected: boolean;
}

export interface CaptureResult {
  success: boolean;
  path?: string;
  thumbnail?: string;
  error?: string;
}

export interface CameraAdapter {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  capture(destPath: string): Promise<CaptureResult>;
  getLiveView?(): Promise<Buffer | null>;
  isConnected(): boolean;
}

/** Config block read from config/settings.json -> camera */
export interface CameraConfig {
  mockMode: boolean;
  preferredBrand: 'Canon' | 'Nikon' | 'Sony';
  /** digiCamControl install dir, e.g. "C:\\Program Files (x86)\\digiCamControl" */
  digiCamControlPath?: string;
  /** Port digiCamControl's built-in web server listens on (Tools > Settings > Web server) */
  webServerPort?: number;
  /** ms to wait for a capture round-trip before failing */
  captureTimeoutMs?: number;
}