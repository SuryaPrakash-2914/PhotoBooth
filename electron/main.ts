import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import { initCameraService, cameraService } from './camera/camera.service';
import { initPrinterService, printerService } from './printer/printer.service';
import { initPaymentService, paymentService } from './payment/payment.service';
import { fileService } from './storage/file.service';
import type { CameraConfig } from './camera/camera.types';
import type { PrinterConfig } from './printer/printer.types';
import type { PaymentConfig } from './payment/payment.types';

// Keep a global reference
let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function getConfigPath(file: string) {
  return isDev
    ? path.join(app.getAppPath(), 'config', file)
    : path.join(process.resourcesPath, 'config', file);
}

interface Settings {
  camera: CameraConfig;
  printer: PrinterConfig;
  payment: PaymentConfig;
  [key: string]: unknown;
}

function loadSettings(): Settings {
  const configPath = getConfigPath('settings.json');
  const data = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(data);
}

function fileToDataUrl(filePath: string): string | null {
  try {
    if (filePath.startsWith('mock://') || !fs.existsSync(filePath)) return null;
    const ext = path.extname(filePath).slice(1) || 'jpeg';
    const buf = fs.readFileSync(filePath);
    return `data:image/${ext};base64,${buf.toString('base64')}`;
  } catch (err) {
    console.error('[Main] fileToDataUrl failed:', err);
    return null;
  }
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: isDev ? 1280 : width,
    height: isDev ? 800 : height,
    fullscreen: !isDev,
    kiosk: !isDev,
    frame: isDev,
    autoHideMenuBar: true,
    backgroundColor: '#0F172A',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent closing in kiosk mode (production)
  if (!isDev) {
    mainWindow.on('close', (e) => {
      // Allow only programmatic close
      // e.preventDefault();
    });
  }
}

app.whenReady().then(() => {
  const settings = loadSettings();
  initCameraService(settings.camera);
  initPrinterService(settings.printer);
  initPaymentService(settings.payment);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  cameraService?.disconnect();
});

// ─── IPC Handlers ────────────────────────────────────────────────────────────

// Config
ipcMain.handle('config:getPhotoTypes', async () => {
  try {
    const data = fs.readFileSync(getConfigPath('photo-types.json'), 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load photo-types.json', err);
    return [];
  }
});

ipcMain.handle('config:getSettings', async () => {
  try {
    const data = fs.readFileSync(getConfigPath('settings.json'), 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load settings.json', err);
    return {};
  }
});

// Camera
ipcMain.handle('camera:connect', async () => {
  if (!cameraService) return { success: false, message: 'Camera service not initialized' };
  const connected = await cameraService.connect();
  return { success: connected, message: connected ? 'Camera connected' : 'Camera not detected' };
});

ipcMain.handle('camera:capture', async (_event, sessionId: string, poseIndex: number) => {
  if (!cameraService) return { success: false, error: 'Camera service not initialized' };
  const destPath = fileService.getOriginalPath(sessionId, poseIndex);
  const result = await cameraService.capture(destPath);
  if (!result.success || !result.path) return result;
  return { ...result, thumbnail: fileToDataUrl(result.path) };
});

ipcMain.handle('camera:getLiveView', async () => {
  if (!cameraService) return null;
  const frame = await cameraService.getLiveView();
  return frame ? `data:image/jpeg;base64,${frame.toString('base64')}` : null;
});

ipcMain.handle('camera:disconnect', async () => {
  await cameraService?.disconnect();
  return { success: true };
});

// Storage
ipcMain.handle('storage:createSession', async (_event, sessionId: string) => {
  const sessionDir = await fileService.createSessionFolder(sessionId);
  return { success: true, path: sessionDir };
});

ipcMain.handle('storage:cleanupSession', async (_event, sessionId: string) => {
  await fileService.cleanupSession(sessionId);
  return { success: true };
});

// Printer
ipcMain.handle('printer:getPrinters', async () => {
  if (!printerService) return [];
  return printerService.getPrinters(mainWindow ?? undefined);
});

ipcMain.handle(
  'printer:print',
  async (_event, filePath: string, copies: number, paperSize?: string) => {
    if (!printerService) return { success: false, error: 'Printer service not initialized' };
    return printerService.print(filePath, copies, paperSize);
  }
);

// Payment
ipcMain.handle('payment:create', async (_event, amount: number) => {
  if (!paymentService) return { success: false, error: 'Payment service not initialized' };
  return paymentService.createOrder(amount);
});

ipcMain.handle('payment:checkStatus', async (_event, orderId: string) => {
  if (!paymentService) return { success: false, status: 'failed', error: 'Payment service not initialized' };
  return paymentService.checkStatus(orderId);
});
