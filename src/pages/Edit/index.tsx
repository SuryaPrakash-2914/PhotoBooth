import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';

const EFFECTS = [
  { name: 'Normal', swatch: '#334155', price: 'FREE' },
  { name: 'Black & White', swatch: '#6b7280', price: 'FREE' },
  { name: 'Sepia', swatch: '#a16207', price: '+₹10' },
  { name: 'Vintage', swatch: '#78350f', price: '+₹10' },
  { name: 'Cool', swatch: '#0ea5e9', price: '+₹10' },
  { name: 'Warm', swatch: '#f97316', price: '+₹10' },
];

const FRAMES = [
  { name: 'Classic', swatch: '#1e293b', price: 'FREE' },
  { name: 'Golden Hour', swatch: '#d99a3f', price: '+₹20' },
  { name: 'Bloom', swatch: '#e0607e', price: '+₹25' },
  { name: 'Midnight', swatch: '#2c4a8f', price: '+₹20' },
  { name: 'Forest', swatch: '#1e7a4f', price: '+₹30' },
];

const TAB_LABELS: Record<'frame' | 'effect' | 'adjust', string> = {
  frame: 'Choose Frame',
  effect: 'Choose Effect',
  adjust: 'Adjust Photo',
};

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

  const [activeTab, setActiveTab] = useState<'frame' | 'effect' | 'adjust'>('frame');
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
    <div className="w-full h-full flex flex-col bg-[#0b0b0d] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/photo-type')}
            className="text-white/70 hover:text-white transition-colors text-xl leading-none"
            aria-label="Back"
          >
            ‹
          </button>
          <h3 className="font-serif text-lg tracking-wide text-white/90">
            {TAB_LABELS[activeTab]}
          </h3>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-white/[0.04] rounded-lg p-1">
          {(['frame', 'effect', 'adjust'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all
                ${
                  activeTab === tab
                    ? 'bg-white/10 text-amber-400'
                    : 'text-white/40 hover:text-white/70'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-5 p-6 min-h-0">
        {/* Preview panel */}
        <div className="flex-1 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative">
          <div className="flex gap-3 justify-center">
            {photos.map((p, i) => (
              <button
                key={p.poseIndex}
                onClick={() => setPreviewIndex(i)}
                className={`relative rounded-xl overflow-hidden bg-black transition-all
                  ${photos.length === 1 ? 'w-44 aspect-[4/3]' : 'w-32 aspect-[4/3]'}
                  ${i === previewIndex ? 'ring-2 ring-amber-400' : 'ring-1 ring-white/10 opacity-70'}`}
              >
                {p.thumbnail ? (
                  <img
                    src={p.thumbnail}
                    alt={`Pose ${p.poseIndex}`}
                    className="w-full h-full object-cover"
                    style={
                      i === previewIndex
                        ? {
                            filter: `brightness(${session.brightness}%) contrast(${session.contrast}%) saturate(${session.saturation}%)`,
                            transform: `rotate(${session.rotation}deg)`,
                          }
                        : undefined
                    }
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
                    No photo
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-white/40 text-sm mt-4">Preview</p>
        </div>

        {/* Sidebar */}
        <div className="w-[280px] shrink-0 flex flex-col">
          <div className="flex-1 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <p className="text-white/40 text-xs font-semibold tracking-widest uppercase">
                Select {activeTab === 'adjust' ? 'Adjustment' : activeTab}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
              {activeTab === 'frame' &&
                FRAMES.map((f) => {
                  const isSelected = session.selectedFrame === f.name;
                  return (
                    <button
                      key={f.name}
                      onClick={() => setFrame(f.name)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3 transition-all
                        ${
                          isSelected
                            ? 'border-amber-400/70 bg-white/[0.06]'
                            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                        }`}
                    >
                      <span
                        className="w-9 h-9 rounded-lg shrink-0"
                        style={{ backgroundColor: f.swatch }}
                      />
                      <span className="flex-1 text-left">
                        <span className="block font-semibold text-white text-sm">{f.name}</span>
                        <span className="block text-xs text-white/40">{f.price}</span>
                      </span>
                      {isSelected && <span className="text-amber-400 text-lg">✓</span>}
                    </button>
                  );
                })}

              {activeTab === 'effect' &&
                EFFECTS.map((e) => {
                  const isSelected = session.selectedEffect === e.name;
                  return (
                    <button
                      key={e.name}
                      onClick={() => setEffect(e.name)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3 transition-all
                        ${
                          isSelected
                            ? 'border-amber-400/70 bg-white/[0.06]'
                            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                        }`}
                    >
                      <span
                        className="w-9 h-9 rounded-lg shrink-0"
                        style={{ backgroundColor: e.swatch }}
                      />
                      <span className="flex-1 text-left">
                        <span className="block font-semibold text-white text-sm">{e.name}</span>
                        <span className="block text-xs text-white/40">{e.price}</span>
                      </span>
                      {isSelected && <span className="text-amber-400 text-lg">✓</span>}
                    </button>
                  );
                })}

              {activeTab === 'adjust' && (
                <div className="space-y-5 pt-1">
                  {[
                    { label: 'Brightness', value: session.brightness, setter: setBrightness },
                    { label: 'Contrast', value: session.contrast, setter: setContrast },
                    { label: 'Saturation', value: session.saturation, setter: setSaturation },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-white/70">{item.label}</span>
                        <span className="text-white/40">{item.value}%</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={150}
                        value={item.value}
                        onChange={(ev) => item.setter(Number(ev.target.value))}
                        className="w-full h-2 accent-amber-400"
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-white/70 text-sm">Rotate</span>
                    <button
                      onClick={() => setRotation((session.rotation + 90) % 360)}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm hover:bg-white/[0.1] transition-colors"
                    >
                      ↻ 90° <span className="text-white/40">{session.rotation}°</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Continue */}
          <button
            onClick={() => navigate('/preview')}
            className="mt-4 w-full py-4 rounded-2xl font-semibold bg-amber-400 text-black hover:bg-amber-300 transition-colors flex items-center justify-center gap-2"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}