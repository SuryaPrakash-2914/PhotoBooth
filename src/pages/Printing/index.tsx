import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';

type Stage = 'printing' | 'complete' | 'failed';

const AUTO_RETURN_SECONDS = 5;

export default function Printing() {
  const navigate = useNavigate();
  const { session, setPrintingStatus } = useSessionStore();
  const [stage, setStage] = useState<Stage>('printing');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [returnIn, setReturnIn] = useState(AUTO_RETURN_SECONDS);
  const started = useRef(false);

  useEffect(() => {
    if (!session || session.paymentStatus !== 'success') {
      navigate('/');
      return;
    }
    if (started.current) return;
    started.current = true;

    setPrintingStatus('printing');

    // Fake progress while the real print job runs in the background —
    // there's no per-job progress callback from the OS print pipeline, so
    // this just gives the operator visual feedback until the job resolves.
    const progressInterval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 8 : p));
    }, 300);

    (async () => {
      // NOTE: there's no image-compositing step yet (electron/image/ is an
      // empty stub) — Edit only applies CSS filters in the renderer and
      // never writes a merged file. Until that's built, we print the last
      // captured pose directly rather than a composited multi-pose layout.
      const photo =
        session.capturedPhotos[session.capturedPhotos.length - 1];
      const filePath = photo?.editedPath || photo?.originalPath;
      const paperSize = session.selectedPhotoType?.paperSize;

      if (!filePath) {
        clearInterval(progressInterval);
        setErrorMessage('No photo available to print');
        setPrintingStatus('failed');
        setStage('failed');
        return;
      }

      const result = await window.api.printer.print(filePath, session.quantity, paperSize);
      clearInterval(progressInterval);

      if (result.success) {
        setProgress(100);
        setPrintingStatus('success');
        setStage('complete');
      } else {
        setErrorMessage(result.error || 'Print failed');
        setPrintingStatus('failed');
        setStage('failed');
      }
    })();

    return () => clearInterval(progressInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Auto-return-home countdown once printing has completed.
  useEffect(() => {
    if (stage !== 'complete') return;
    setReturnIn(AUTO_RETURN_SECONDS);

    const tick = setInterval(() => {
      setReturnIn((s) => s - 1);
    }, 1000);

    const redirect = setTimeout(() => navigate('/'), AUTO_RETURN_SECONDS * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [stage, navigate]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b0b0d] text-white px-8">
      <style>{`
        @keyframes paperFeed {
          0% { transform: translateY(-6px); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(28px); opacity: 0; }
        }
        .paper-feed { animation: paperFeed 1.4s ease-in-out infinite; }
      `}</style>

      {stage === 'printing' && (
        <div className="text-center space-y-8 max-w-sm">
          {/* Animated printer */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-amber-400/10 animate-ping" />
            <span className="absolute inset-2 rounded-full bg-amber-400/10" />
            <span className="relative text-6xl">🖨️</span>
            {/* feeding paper strip */}
            <span className="absolute top-full w-10 h-6 bg-white/90 rounded-sm paper-feed" />
          </div>

          <h1 className="font-serif text-3xl font-bold text-white">Printing…</h1>
          <p className="text-white/40 text-sm">Please wait while we print your photos</p>

          <div className="w-full">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white/30 mt-2 text-sm">{progress}%</p>
          </div>
        </div>
      )}

      {stage === 'complete' && (
        <div className="text-center space-y-6 max-w-sm">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl" />
            <span className="relative w-16 h-16 rounded-full bg-emerald-950/60 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#34d399"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </div>

          <h1 className="font-serif text-4xl font-bold text-white">PRINT COMPLETE</h1>
          <div>
            <p className="text-white/60">Collect your photos from the printer</p>
            <p className="text-white/25 text-xs mt-1 tracking-wide">{session?.sessionId}</p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="mx-auto block px-10 py-3 rounded-2xl font-semibold bg-amber-400 text-black hover:bg-amber-300 transition-colors"
          >
            DONE
          </button>
          <p className="text-white/30 text-xs">Returning to home in {returnIn}s</p>
        </div>
      )}

      {stage === 'failed' && (
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-950/60 flex items-center justify-center text-3xl text-red-400">
            ✗
          </div>
          <h1 className="font-serif text-3xl font-bold text-white">Print Failed</h1>
          <p className="text-white/50 text-sm">{errorMessage || 'Something went wrong while printing'}</p>
          <button
            onClick={() => navigate('/preview')}
            className="px-8 py-3 rounded-2xl font-semibold bg-amber-400 text-black hover:bg-amber-300 transition-colors"
          >
            BACK TO PREVIEW
          </button>
        </div>
      )}
    </div>
  );
}