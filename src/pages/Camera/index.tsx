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
  const capturedPhotos = session?.capturedPhotos ?? [];

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

  const canCapture = cameraState === 'preview';
  const showLiveOverlay =
    cameraState === 'preview' || cameraState === 'countdown' || cameraState === 'capturing';

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0b0d] text-white">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/10 shrink-0">
        <button
          onClick={() => navigate('/photo-type')}
          className="text-white/70 hover:text-white transition-colors text-xl leading-none"
          aria-label="Back"
        >
          ‹
        </button>
        <h3 className="font-serif text-lg tracking-wide text-white/90">
          Pose {currentPose} of {totalPoses}
        </h3>
      </div>

      {/* Body: live view + sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Live preview */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 to-[#0b0b0d]">
          {cameraState === 'connecting' && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto border-4 border-white/20 border-t-amber-400 rounded-full animate-spin" />
                <p className="text-white/50 text-lg">Connecting to camera…</p>
              </div>
            </div>
          )}

          {showLiveOverlay && (
            <>
              {liveFrame && (
                <img src={liveFrame} alt="Live camera feed" className="w-full h-full object-cover" />
              )}

              {/* LIVE badge */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-rose-600/90 text-white text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live
              </div>

              {/* Face-guide frame — empty, no icon/label inside */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-amber-400/70 rounded-lg pointer-events-none" />
            </>
          )}

          {(cameraState === 'countdown' || cameraState === 'capturing') && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
              <div className="font-serif text-[140px] font-bold text-amber-400 drop-shadow-[0_0_30px_rgba(245,180,66,0.4)]">
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
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-4 px-8">
                <p className="text-red-400 text-xl">{errorMessage || 'Camera error'}</p>
                <button
                  onClick={handleRetake}
                  className="px-6 py-3 rounded-full border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
                >
                  TRY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-[300px] shrink-0 border-l border-white/10 flex flex-col">
          <div className="px-6 pt-6">
            <p className="text-white/40 text-xs font-semibold tracking-widest uppercase">
              Captured
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: totalPoses }, (_, i) => i + 1).map((poseNum) => {
                const photo = capturedPhotos.find((p) => p.poseIndex === poseNum);
                const isCurrent = poseNum === currentPose && !photo;
                return (
                  <div
                    key={poseNum}
                    className={`aspect-square rounded-xl border flex items-center justify-center overflow-hidden bg-black/40
                      ${isCurrent ? 'border-amber-400/70' : 'border-white/10'}`}
                  >
                    {photo?.thumbnail ? (
                      <img
                        src={photo.thumbnail}
                        alt={`Pose ${poseNum}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-serif text-2xl text-white/25">{poseNum}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action button */}
          <div className="p-6 border-t border-white/10">
            {cameraState === 'captured' ? (
              <button
                onClick={handleRetake}
                className="w-full py-3 rounded-full font-semibold border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
              >
                RETAKE
              </button>
            ) : (
              <button
                onClick={startCountdown}
                disabled={!canCapture}
                className={`w-full py-3 rounded-full font-semibold tracking-wide transition-colors
                  ${
                    canCapture
                      ? 'bg-amber-400 text-black hover:bg-amber-300'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
              >
                CAPTURE
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}