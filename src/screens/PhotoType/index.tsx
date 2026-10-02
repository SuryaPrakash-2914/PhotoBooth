import { useState, useEffect } from 'react';
import { useNavigate } from '../../useNavigate';
import { useSessionStore } from '../../store/sessionStore';
import type { PhotoType } from '../../types';

type LayoutOption = PhotoType & {
  color: string; // accent colour for border, glow and pose label
  sizeLabel: string; // e.g. "2 x 6"
  poseLabel: string; // e.g. "4 POSE"
  cols: number; // frame grid used to draw the preview
  rows: number;
  frameAspect: string; // CSS aspect-ratio of the whole preview drawing
  previewWidth: number; // preview width in px
};

// Fallback data (will be replaced by config loading via IPC in Phase 2)
const DEFAULT_PHOTO_TYPES: LayoutOption[] = [
  {
    id: 'pose-4-2x6',
    name: '4 Pose – 2×6',
    poses: 4,
    paperSize: '2x6',
    price: 150,
    layout: 'vertical-4',
    description: 'Four photos in a classic strip',
    color: '#22d3ee',
    sizeLabel: '2 x 6',
    poseLabel: '4 POSE',
    cols: 1,
    rows: 4,
    frameAspect: '70 / 215',
    previewWidth: 70,
  },
  {
    id: 'pose-2-4x6',
    name: '2 Pose – 4×6',
    poses: 2,
    paperSize: '4x6',
    price: 120,
    layout: 'vertical-2',
    description: 'Two photos in a wide print',
    color: '#4ade80',
    sizeLabel: '4 x 6',
    poseLabel: '2 POSE',
    cols: 1,
    rows: 2,
    frameAspect: '92 / 220',
    previewWidth: 92,
  },
  {
    id: 'pose-1-4x6',
    name: '1 Pose – 4×6',
    poses: 1,
    paperSize: '4x6',
    price: 100,
    layout: 'single',
    description: 'Single full-frame photo',
    color: '#c084fc',
    sizeLabel: '4 x 6',
    poseLabel: '1 POSE',
    cols: 1,
    rows: 1,
    frameAspect: '106 / 196',
    previewWidth: 106,
  },
  {
    id: 'passport',
    name: 'Passport Size',
    poses: 8,
    paperSize: 'passport',
    price: 80,
    layout: 'passport',
    description: '8 passport-size photos on a 5×7 print',
    color: '#facc15',
    sizeLabel: '5 x 7',
    poseLabel: '8 POSE',
    cols: 4,
    rows: 2,
    frameAspect: '320 / 140',
    previewWidth: 320,
  },
];

/** White outlined drawing of the print: a grid of empty frames. */
function LayoutPreview({ cols, rows, aspect, width }: {
  cols: number;
  rows: number;
  aspect: string;
  width: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="border-[3px] border-white grid"
      style={{
        width,
        maxWidth: '100%',
        aspectRatio: aspect,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        boxShadow: '0 0 12px rgba(255,255,255,0.12)',
      }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return (
          <div
            key={i}
            className="border-white"
            style={{
              borderLeftWidth: col > 0 ? 2 : 0,
              borderTopWidth: row > 0 ? 2 : 0,
            }}
          />
        );
      })}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#facc15"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0 0 6px rgba(250,204,21,0.7))' }}
      aria-hidden="true"
    >
      <path d="M4 8h2.5l1.5-2.5h8L17.5 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.8" />
      <circle cx="18" cy="10.5" r="0.4" fill="#facc15" />
    </svg>
  );
}

export default function PhotoType() {
  const navigate = useNavigate();
  const { session, selectPhotoType } = useSessionStore();
  const [photoTypes] = useState(DEFAULT_PHOTO_TYPES);
  const [selected, setSelected] = useState<LayoutOption | null>(null);

  useEffect(() => {
    // Phase 2: Load from config via window.api.config.getPhotoTypes()
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleContinue = () => {
    if (!selected) return;
    selectPhotoType(selected);
    navigate('/camera');
  };

  const strips = photoTypes.filter((t) => t.id !== 'passport');
  const passport = photoTypes.find((t) => t.id === 'passport');

  return (
    <div className="w-full h-full flex flex-col bg-[#03050f] text-white">
      {/* Header: gold rules flanking a glowing camera icon */}
      <div className="px-8 pt-10 pb-4 shrink-0">
        <div className="flex items-center justify-center gap-5 max-w-3xl mx-auto">
          <div
            className="h-px flex-1"
            style={{ background: 'linear-gradient(to right, transparent, #facc15)' }}
          />
          <CameraIcon />
          <div
            className="h-px flex-1"
            style={{ background: 'linear-gradient(to left, transparent, #facc15)' }}
          />
        </div>
        <h1 className="mt-5 text-center text-3xl md:text-5xl font-bold tracking-wide uppercase">
          Choose your photo layout
        </h1>
      </div>

      {/* Layout options */}
      <div className="flex-1 px-8 pb-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-14 pt-10">
          {/* Row of three portrait cards */}
          <div className="w-full flex items-start justify-between gap-4">
            {strips.map((type) => {
              const isSelected = selected?.id === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelected(type)}
                  aria-pressed={isSelected}
                  aria-label={`${type.sizeLabel}, ${type.poseLabel}`}
                  className="flex flex-col items-center justify-between rounded-2xl border bg-black/30 px-6 pt-10 pb-6 transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  style={{
                    width: 'clamp(150px, 26%, 230px)',
                    minHeight: 380,
                    borderColor: type.color,
                    boxShadow: isSelected
                      ? `0 0 28px ${type.color}99, inset 0 0 22px ${type.color}33`
                      : `0 0 12px ${type.color}44, inset 0 0 12px ${type.color}14`,
                    opacity: selected && !isSelected ? 0.55 : 1,
                  }}
                >
                  <LayoutPreview
                    cols={type.cols}
                    rows={type.rows}
                    aspect={type.frameAspect}
                    width={type.previewWidth}
                  />
                  <div className="w-full mt-8 flex flex-col items-center">
                    <span className="text-lg tracking-widest text-white/90">{type.sizeLabel}</span>
                    <div className="w-3/5 h-px bg-white/15 my-3" />
                    <span
                      className="text-base font-semibold tracking-wider"
                      style={{ color: type.color }}
                    >
                      {type.poseLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Wide passport card with title set into the top border */}
          {passport && (
            <button
              onClick={() => setSelected(passport)}
              aria-pressed={selected?.id === passport.id}
              aria-label={`Passport size, ${passport.sizeLabel}, ${passport.poseLabel}`}
              className="relative flex flex-col items-center rounded-2xl border bg-black/30 px-8 pt-9 pb-6 transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              style={{
                width: 'min(100%, 420px)',
                borderColor: passport.color,
                boxShadow:
                  selected?.id === passport.id
                    ? `0 0 28px ${passport.color}99, inset 0 0 22px ${passport.color}33`
                    : `0 0 12px ${passport.color}44, inset 0 0 12px ${passport.color}14`,
                opacity: selected && selected.id !== passport.id ? 0.55 : 1,
              }}
            >
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#03050f] px-3 text-base font-semibold tracking-wider whitespace-nowrap"
                style={{ color: passport.color }}
              >
                PASSPORT SIZE
              </span>
              <LayoutPreview
                cols={passport.cols}
                rows={passport.rows}
                aspect={passport.frameAspect}
                width={passport.previewWidth}
              />
              <span className="mt-4 text-lg tracking-widest text-white/90">
                {passport.sizeLabel}
              </span>
              <div className="w-16 h-px bg-white/15 my-3" />
              <span
                className="text-base font-semibold tracking-wider"
                style={{ color: passport.color }}
              >
                {passport.poseLabel}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pb-8 pt-2 flex items-center justify-center gap-6 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-full text-white/60 hover:text-white transition-colors"
        >
          Back
        </button>
        {selected && (
          <span className="text-xl font-bold text-amber-400">₹{selected.price}</span>
        )}
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`px-8 py-3 rounded-full font-semibold tracking-wide transition-all
            ${
              selected
                ? 'bg-amber-400 text-black hover:bg-amber-300'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}