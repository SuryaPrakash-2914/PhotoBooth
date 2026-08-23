import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';

export default function Printing() {
  const navigate = useNavigate();
  const { session, setPrintingStatus } = useSessionStore();
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        return;
      }

      const result = await window.api.printer.print(filePath, session.quantity, paperSize);
      clearInterval(progressInterval);

      if (result.success) {
        setProgress(100);
        setPrintingStatus('success');
        setTimeout(() => navigate('/complete'), 800);
      } else {
        setErrorMessage(result.error || 'Print failed');
        setPrintingStatus('failed');
      }
    })();

    return () => clearInterval(progressInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-brand-dark">
      <div className="text-center space-y-10">
        <div className="text-8xl animate-pulse">🖨️</div>
        <h1 className="text-4xl font-bold text-white">
          {errorMessage ? 'Print Failed' : 'Printing...'}
        </h1>
        <p className="text-white/50 text-xl">
          {errorMessage || 'Please wait while we print your photos'}
        </p>

        {!errorMessage && (
          <div className="w-80 mx-auto">
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-primary transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white/40 mt-3 text-lg">{progress}%</p>
          </div>
        )}

        {errorMessage && (
          <button onClick={() => navigate('/preview')} className="btn-primary">
            BACK TO PREVIEW
          </button>
        )}
      </div>
    </div>
  );
}
