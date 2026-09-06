import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';
import type { CapturedPhoto } from '../../types';

type CameraState = 'connecting' | 'preview' | 'countdown' | 'capturing' | 'captured' | 'error';

export default function Camera() {
  const navigate = useNavigate();
  const { session, setCurrentPose, addCapturedPhoto } = useSessionStore();
  const [cameraState, setCameraState] = useState<CameraState>('connecting');
  const [countdown, setCountdown] = useState(3);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [liveFrame, setLiveFrame] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const liveViewTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextCaptureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPoses = session?.selectedPhotoType?.poses ?? 1;
  const currentPose = session?.currentPose ?? 1;

  useEffect(() => {
    if (!session?.selectedPhotoType) {
      navigate('/photo-type');
    }
  }, [session, navigate]);

  // Connect to the camera once when the screen mounts.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await window.api.camera.connect();
      if (cancelled) return;
      if (result.success) {
        setCameraState('preview');
      } else {
        setErrorMessage(result.message || 'Could not connect to camera');
        setCameraState('error');
      }
    })();
    return () => {
      cancelled = true;
      window.api.camera.disconnect();
      if (nextCaptureTimer.current) clearTimeout(nextCaptureTimer.current);
    };
  }, []);

  // Poll the live view while we're in the "preview" state so the operator
  // sees a real feed instead of a static placeholder (falls back to the
  // placeholder if the adapter has no live view, e.g. mock mode).
  useEffect(() => {
    if (cameraState !== 'preview') {
      if (liveViewTimer.current) clearInterval(liveViewTimer.current);
      return;
    }
    liveViewTimer.current = setInterval(async () => {
      const frame = await window.api.camera.getLiveView();
      setLiveFrame(frame);
    }, 100);
    return () => {
      if (liveViewTimer.current) clearInterval(liveViewTimer.current);
    };
  }, [cameraState]);

  const startCountdown = useCallback(() => {
    setCameraState('countdown');
    setCountdown(3);
  }, []);

  useEffect(() => {
    if (cameraState !== 'countdown') return;

    if (countdown <= 0) {
      setCameraState('capturing');
      (async () => {
        if (!session) return;
        const result = await window.api.camera.capture(session.sessionId, currentPose);
        if (!result.success) {
          setErrorMessage(result.error || 'Capture failed');
          setCameraState('error');
          return;
        }
        const photo: CapturedPhoto = {
          poseIndex: currentPose,
          originalPath: result.path || '',
          thumbnail: result.thumbnail ?? undefined,
          timestamp: new Date().toISOString(),
        };
        addCapturedPhoto(photo);
        if (currentPose >= totalPoses) {
          setCapturedPreview(photo.thumbnail || null);
          setCameraState('captured');
          nextCaptureTimer.current = setTimeout(() => navigate('/edit'), 900);
        } else {
          setCurrentPose(currentPose + 1);
          setCapturedPreview(null);
          setCountdown(3);
          nextCaptureTimer.current = setTimeout(() => setCameraState('countdown'), 900);
        }
      })();
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cameraState, countdown, currentPose, totalPoses, addCapturedPhoto, setCurrentPose, navigate, session]);

  const handleRetake = () => {
    if (nextCaptureTimer.current) clearTimeout(nextCaptureTimer.current);
    setCapturedPreview(null);
    setErrorMessage(null);
    setCameraState('preview');
  };

  if (!session) return null;

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white/80 text-xl font-medium">
          Pose {currentPose} of {totalPoses}
        </div>
        <div className="text-white/60 text-lg">{session.selectedPhotoType?.name}</div>
      </div>

      {/* Camera Preview Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {cameraState === 'connecting' && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white/50 text-xl">Connecting to camera…</p>
          </div>
        )}

        {cameraState === 'preview' &&
          (liveFrame ? (
            <img src={liveFrame} alt="Live camera feed" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-white/20 flex items-center justify-center">
                  <span className="text-5xl">📷</span>
                </div>
                <p className="text-white/50 text-2xl">Ready</p>
              </div>
            </div>
          ))}

        {(cameraState === 'countdown' || cameraState === 'capturing') && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
            <div className="text-[180px] font-black text-white animate-pulse drop-shadow-2xl">
              {cameraState === 'countdown' && countdown > 0 ? countdown : '✓'}
            </div>
          </div>
        )}

        {cameraState === 'captured' && capturedPreview && (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedPreview}
              alt={`Pose ${currentPose}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {cameraState === 'error' && (
          <div className="text-center space-y-4 px-8">
            <p className="text-red-400 text-2xl">{errorMessage || 'Camera error'}</p>
            <button onClick={handleRetake} className="btn-secondary">
              TRY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-8 bg-gradient-to-t from-black/90 to-transparent">
        {cameraState === 'preview' && (
          <div className="flex justify-center">
            <button
              onClick={startCountdown}
              className="w-28 h-28 rounded-full bg-brand-primary hover:bg-brand-accent 
                         flex items-center justify-center text-5xl shadow-2xl shadow-brand-primary/50
                         active:scale-90 transition-transform"
            >
              📷
            </button>
          </div>
        )}

        {cameraState === 'captured' && (
          <div className="flex justify-center gap-8">
            <button onClick={handleRetake} className="btn-secondary min-w-[180px]">
              RETAKE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
