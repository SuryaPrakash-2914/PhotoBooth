import { contextBridge, ipcRenderer } from 'electron';

/**
 * Secure API exposed to the renderer process.
 * Only the methods listed here are available in the UI.
 */
const api = {
  // Config
  config: {
    getPhotoTypes: () => ipcRenderer.invoke('config:getPhotoTypes'),
    getSettings: () => ipcRenderer.invoke('config:getSettings'),
    updateSettings: (settings: object) => ipcRenderer.invoke('config:updateSettings', settings),
    backup: () => ipcRenderer.invoke('config:backup'),
  },

  // Camera
  camera: {
    connect: () => ipcRenderer.invoke('camera:connect'),
    capture: (sessionId: string, poseIndex: number) =>
      ipcRenderer.invoke('camera:capture', sessionId, poseIndex),
    // Returns a base64 JPEG string (or null) — poll this at ~10fps for the live view UI.
    getLiveView: () => ipcRenderer.invoke('camera:getLiveView'),
    disconnect: () => ipcRenderer.invoke('camera:disconnect'),
  },

  // Storage
  storage: {
    createSession: (sessionId: string) => ipcRenderer.invoke('storage:createSession', sessionId),
    cleanupSession: (sessionId: string) => ipcRenderer.invoke('storage:cleanupSession', sessionId),
  },

  // Printer
  printer: {
    getPrinters: () => ipcRenderer.invoke('printer:getPrinters'),
    print: (filePath: string, copies: number, paperSize?: string) =>
      ipcRenderer.invoke('printer:print', filePath, copies, paperSize),
    testPrint: () => ipcRenderer.invoke('printer:testPrint'),
  },

  // Payment
  payment: {
    create: (amount: number) => ipcRenderer.invoke('payment:create', amount),
    checkStatus: (orderId: string) => ipcRenderer.invoke('payment:checkStatus', orderId),
    getHistory: () => ipcRenderer.invoke('payment:getHistory'),
  },
};

contextBridge.exposeInMainWorld('api', api);

// Type declaration helper for renderer
export type ElectronAPI = typeof api;