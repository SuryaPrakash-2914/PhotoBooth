export interface PhotoType {
  id: string;
  name: string;
  poses: number;
  paperSize: string;
  price: number;
  layout: string;
  description?: string;
  template?: string;
}

export interface CapturedPhoto {
  poseIndex: number;
  originalPath: string;
  editedPath?: string;
  thumbnail?: string;
  timestamp: string;
}

export type PaymentStatus = 'idle' | 'pending' | 'success' | 'failed';
export type PrintingStatus = 'idle' | 'printing' | 'success' | 'failed';
export type AppScreen =
  | 'home'
  | 'photo-type'
  | 'camera'
  | 'edit'
  | 'preview'
  | 'payment'
  | 'printing'
  | 'complete';

export interface Session {
  sessionId: string;
  selectedPhotoType: PhotoType | null;
  currentPose: number;
  capturedPhotos: CapturedPhoto[];
  editedPhotos: string[];
  selectedFrame?: string;
  selectedEffect?: string;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  printingStatus: PrintingStatus;
  createdAt: string;
}

export interface AppSettings {
  brandName: string;
  brandTagline: string;
  currency: string;
  sessionTimeoutSeconds: number;
  countdownSeconds: number;
  defaultQuantity: number;
  maxQuantity: number;
  kioskMode: boolean;
  fullscreen: boolean;
  autoReturnHome: boolean;
  language: string;
  theme: {
    primaryColor: string;
    backgroundColor: string;
  };
  camera: {
    mockMode: boolean;
    preferredBrand: string;
  };
  printer: {
    mockMode: boolean;
    defaultPrinter: string;
  };
  payment: {
    mockMode: boolean;
    provider: string;
    merchantName: string;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message?: string;
}

export interface PrintResult {
  success: boolean;
  jobId?: string;
  message?: string;
}
