import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';
import type { PhotoType } from '../../types';

// Fallback data (will be replaced by config loading via IPC in Phase 2)
const DEFAULT_PHOTO_TYPES: (PhotoType & { icon: string; tags: string[] })[] = [
  {
    id: 'pose-4-2x6',
    name: '4 Pose – 2×6',
    poses: 4,
    paperSize: '2x6',
    price: 150,
    layout: 'vertical-4',
    description: 'Four photos in a classic strip',
    icon: '📷',
    tags: ['4 poses', '2×6 print'],
  },
  {
    id: 'pose-2-4x6',
    name: '2 Pose – 4×6',
    poses: 2,
    paperSize: '4x6',
    price: 120,
    layout: 'vertical-2',
    description: 'Two photos in a wide print',
    icon: '🖼️',
    tags: ['2 poses', '4×6 print'],
  },
  {
    id: 'pose-1-4x6',
    name: '1 Pose – 4×6',
    poses: 1,
    paperSize: '4x6',
    price: 100,
    layout: 'single',
    description: 'Single full-frame photo',
    icon: '🎞️',
    tags: ['1 pose', '4×6 print'],
  },
  {
    id: 'passport',
    name: 'Passport',
    poses: 1,
    paperSize: 'passport',
    price: 80,
    layout: 'passport',
    description: '6 passport-size photos',
    icon: '🪪',
    tags: ['1 pose', 'passport print'],
  },
];

export default function PhotoType() {
  const navigate = useNavigate();
  const { session, selectPhotoType } = useSessionStore();
  const [photoTypes] = useState(DEFAULT_PHOTO_TYPES);
  const [selected, setSelected] = useState<PhotoType | null>(null);

  useEffect(() => {
    // Phase 2: Load from config via window.api.config.getPhotoTypes()
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleSelect = (type: PhotoType) => {
    setSelected(type);
  };

  const handleContinue = () => {
    if (!selected) return;
    selectPhotoType(selected);
    navigate('/camera');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0b0d] text-white">
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">
          Choose your print type
        </h1>
        <p className="text-white/40 text-sm mt-1.5">
          All packages include editing and frame selection
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 px-8 pb-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {photoTypes.map((type) => {
            const isSelected = selected?.id === type.id;
            return (
              <button
                key={type.id}
                onClick={() => handleSelect(type)}
                className={`text-left rounded-2xl border p-5 transition-all duration-200 active:scale-[0.98]
                  ${
                    isSelected
                      ? 'border-amber-400/70 bg-white/[0.06]'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                  }`}
              >
                {/* Icon + price row */}
                <div className="flex items-start justify-between mb-5">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-lg">
                    {type.icon}
                  </div>
                  <span className="text-xl font-bold text-amber-400">₹{type.price}</span>
                </div>

                {/* Title + description */}
                <h2 className="font-serif text-xl font-bold text-white">{type.name}</h2>
                <p className="text-white/40 text-sm mt-1 mb-3">{type.description}</p>

                {/* Tags */}
                <div className="flex gap-2 flex-wrap">
                  {type.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-white/60 bg-white/[0.06] rounded-full px-3 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pb-8 pt-2 flex justify-center gap-6 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-full text-white/60 hover:text-white transition-colors"
        >
          Back
        </button>
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