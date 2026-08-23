import { create } from 'zustand';
import type { PhotoType, Session, CapturedPhoto, PaymentStatus, PrintingStatus } from '../types';

interface SessionState {
  session: Session | null;
  createSession: () => string;
  selectPhotoType: (type: PhotoType) => void;
  setCurrentPose: (pose: number) => void;
  addCapturedPhoto: (photo: CapturedPhoto) => void;
  updateEditedPhoto: (poseIndex: number, path: string) => void;
  setFrame: (frame: string) => void;
  setEffect: (effect: string) => void;
  setBrightness: (value: number) => void;
  setContrast: (value: number) => void;
  setSaturation: (value: number) => void;
  setRotation: (value: number) => void;
  setQuantity: (qty: number) => void;
  setPaymentStatus: (status: PaymentStatus) => void;
  setPrintingStatus: (status: PrintingStatus) => void;
  resetSession: () => void;
}

const generateSessionId = (): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `session_${date}_${seq}`;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,

  createSession: () => {
    const sessionId = generateSessionId();
    set({
      session: {
        sessionId,
        selectedPhotoType: null,
        currentPose: 1,
        capturedPhotos: [],
        editedPhotos: [],
        brightness: 100,
        contrast: 100,
        saturation: 100,
        rotation: 0,
        quantity: 1,
        unitPrice: 0,
        totalAmount: 0,
        paymentStatus: 'idle',
        printingStatus: 'idle',
        createdAt: new Date().toISOString(),
      },
    });
    return sessionId;
  },

  selectPhotoType: (type) => {
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          selectedPhotoType: type,
          unitPrice: type.price,
          totalAmount: type.price * state.session.quantity,
          currentPose: 1,
          capturedPhotos: [],
          editedPhotos: [],
        },
      };
    });
  },

  setCurrentPose: (pose) =>
    set((state) =>
      state.session ? { session: { ...state.session, currentPose: pose } } : state
    ),

  addCapturedPhoto: (photo) =>
    set((state) => {
      if (!state.session) return state;
      const existing = state.session.capturedPhotos.filter(
        (p) => p.poseIndex !== photo.poseIndex
      );
      return {
        session: {
          ...state.session,
          capturedPhotos: [...existing, photo].sort((a, b) => a.poseIndex - b.poseIndex),
        },
      };
    }),

  updateEditedPhoto: (poseIndex, path) =>
    set((state) => {
      if (!state.session) return state;
      const photos = state.session.capturedPhotos.map((p) =>
        p.poseIndex === poseIndex ? { ...p, editedPath: path } : p
      );
      return { session: { ...state.session, capturedPhotos: photos } };
    }),

  setFrame: (frame) =>
    set((state) =>
      state.session ? { session: { ...state.session, selectedFrame: frame } } : state
    ),

  setEffect: (effect) =>
    set((state) =>
      state.session ? { session: { ...state.session, selectedEffect: effect } } : state
    ),

  setBrightness: (value) =>
    set((state) =>
      state.session ? { session: { ...state.session, brightness: value } } : state
    ),

  setContrast: (value) =>
    set((state) =>
      state.session ? { session: { ...state.session, contrast: value } } : state
    ),

  setSaturation: (value) =>
    set((state) =>
      state.session ? { session: { ...state.session, saturation: value } } : state
    ),

  setRotation: (value) =>
    set((state) =>
      state.session ? { session: { ...state.session, rotation: value } } : state
    ),

  setQuantity: (qty) =>
    set((state) => {
      if (!state.session) return state;
      const quantity = Math.max(1, Math.min(10, qty));
      return {
        session: {
          ...state.session,
          quantity,
          totalAmount: state.session.unitPrice * quantity,
        },
      };
    }),

  setPaymentStatus: (status) =>
    set((state) =>
      state.session ? { session: { ...state.session, paymentStatus: status } } : state
    ),

  setPrintingStatus: (status) =>
    set((state) =>
      state.session ? { session: { ...state.session, printingStatus: status } } : state
    ),

  resetSession: () => set({ session: null }),
}));
