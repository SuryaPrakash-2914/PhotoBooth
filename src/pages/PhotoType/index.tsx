import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';
import type { PhotoType } from '../../types';

// Fallback data (will be replaced by config loading via IPC in Phase 2)
const DEFAULT_PHOTO_TYPES: PhotoType[] = [
  {
    id: 'pose-4-2x6',
    name: '4 Pose – 2×6',
    poses: 4,
    paperSize: '2x6',
    price: 150,
    layout: 'vertical-4',
    description: 'Four photos stacked vertically',
  },
  {
    id: 'pose-2-4x6',
    name: '2 Pose – 4×6',
    poses: 2,
    paperSize: '4x6',
    price: 120,
    layout: 'vertical-2',
    description: 'Two photos on classic 4×6',
  },
  {
    id: 'pose-1-4x6',
    name: '1 Pose – 4×6',
    poses: 1,
    paperSize: '4x6',
    price: 100,
    layout: 'single',
    description: 'Single high-quality print',
  },
  {
    id: 'passport',
    name: 'Passport',
    poses: 1,
    paperSize: 'passport',
    price: 80,
    layout: 'passport',
    description: 'Official passport size',
  },
];

export default function PhotoType() {
  const navigate = useNavigate();
  const { session, selectPhotoType } = useSessionStore();
  const [photoTypes, setPhotoTypes] = useState<PhotoType[]>(DEFAULT_PHOTO_TYPES);
  const [selected, setSelected] = useState<PhotoType | null>(null);

  useEffect(() => {
    // Phase 2: Load from config via window.api.config.getPhotoTypes()
    // For now use defaults
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
    <div className="w-full h-full flex flex-col bg-brand-dark">
      {/* Header */}
      <div className="pt-12 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white">Select Photo Type</h1>
        <p className="text-white/60 text-xl mt-3">Choose your preferred layout</p>
      </div>

      {/* Cards */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="grid grid-cols-2 gap-6 max-w-5xl w-full">
          {photoTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSelect(type)}
              className={`card text-left transition-all duration-200 active:scale-[0.98] min-h-[180px]
                ${selected?.id === type.id ? 'card-selected bg-slate-700' : 'hover:bg-slate-700/80'}`}
            >
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{type.name}</h2>
                  <p className="text-white/50 mt-2 text-lg">{type.description}</p>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <span className="text-3xl font-black text-brand-primary">₹{type.price}</span>
                  <span className="text-white/40 text-sm uppercase tracking-wider">
                    {type.poses} pose{type.poses > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pb-12 pt-6 flex justify-center gap-6">
        <button onClick={() => navigate('/')} className="btn-ghost">
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`btn-primary ${!selected ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          CONTINUE
        </button>
      </div>
    </div>
  );
}
