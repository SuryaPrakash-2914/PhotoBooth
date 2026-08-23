import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';

const EFFECTS = ['Normal', 'Black & White', 'Sepia', 'Vintage', 'Cool', 'Warm'];
const FRAMES = ['None', 'Classic', 'Polaroid', 'Modern', 'Floral'];

export default function Edit() {
  const navigate = useNavigate();
  const {
    session,
    setFrame,
    setEffect,
    setBrightness,
    setContrast,
    setSaturation,
    setRotation,
  } = useSessionStore();

  const [activeTab, setActiveTab] = useState<'frame' | 'effect' | 'adjust'>('effect');
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    if (!session?.capturedPhotos?.length) {
      navigate('/camera');
    }
  }, [session, navigate]);

  if (!session) return null;

  const photos = session.capturedPhotos;
  const currentPhoto = photos[previewIndex];

  return (
    <div className="w-full h-full flex flex-col bg-brand-dark">
      {/* Header */}
      <div className="pt-8 pb-4 text-center">
        <h1 className="text-3xl font-bold text-white">Edit Photos</h1>
        <p className="text-white/50 mt-1">
          Photo {previewIndex + 1} of {photos.length}
        </p>
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center px-6 relative">
        <div className="relative max-w-2xl w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden shadow-2xl">
          {currentPhoto?.thumbnail ? (
            <img
              src={currentPhoto.thumbnail}
              alt={`Edit pose ${currentPhoto.poseIndex}`}
              className="w-full h-full object-contain"
              style={{
                filter: `
                  brightness(${session.brightness}%)
                  contrast(${session.contrast}%)
                  saturate(${session.saturation}%)
                `,
                transform: `rotate(${session.rotation}deg)`,
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-xl">
              No photo
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            {photos.map((p, i) => (
              <button
                key={p.poseIndex}
                onClick={() => setPreviewIndex(i)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all
                  ${i === previewIndex ? 'border-brand-primary scale-110' : 'border-white/20 opacity-70'}`}
              >
                {p.thumbnail && (
                  <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tools */}
      <div className="bg-slate-900/90 border-t border-white/10 px-6 pt-4 pb-8">
        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-6">
          {(['frame', 'effect', 'adjust'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl text-lg font-semibold capitalize transition-all
                ${activeTab === tab ? 'bg-brand-primary text-white' : 'bg-slate-700 text-white/70'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[100px] flex items-center justify-center">
          {activeTab === 'frame' && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {FRAMES.map((f) => (
                <button
                  key={f}
                  onClick={() => setFrame(f)}
                  className={`px-6 py-4 rounded-xl text-lg font-medium whitespace-nowrap
                    ${session.selectedFrame === f ? 'bg-brand-primary' : 'bg-slate-700'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'effect' && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {EFFECTS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEffect(e)}
                  className={`px-6 py-4 rounded-xl text-lg font-medium whitespace-nowrap
                    ${session.selectedEffect === e ? 'bg-brand-primary' : 'bg-slate-700'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'adjust' && (
            <div className="w-full max-w-xl space-y-4">
              {[
                { label: 'Brightness', value: session.brightness, setter: setBrightness },
                { label: 'Contrast', value: session.contrast, setter: setContrast },
                { label: 'Saturation', value: session.saturation, setter: setSaturation },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <span className="w-28 text-white/80 text-lg">{item.label}</span>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={item.value}
                    onChange={(e) => item.setter(Number(e.target.value))}
                    className="flex-1 h-3 accent-brand-primary"
                  />
                  <span className="w-12 text-right text-white/60">{item.value}%</span>
                </div>
              ))}
              <div className="flex items-center gap-4">
                <span className="w-28 text-white/80 text-lg">Rotate</span>
                <button
                  onClick={() => setRotation((session.rotation + 90) % 360)}
                  className="btn-secondary py-2 px-6 text-base"
                >
                  ↻ 90°
                </button>
                <span className="text-white/60">{session.rotation}°</span>
              </div>
            </div>
          )}
        </div>

        {/* Done */}
        <div className="flex justify-center mt-6">
          <button onClick={() => navigate('/preview')} className="btn-primary min-w-[220px]">
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}
