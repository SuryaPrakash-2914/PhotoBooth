import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';

export default function Home() {
  const navigate = useNavigate();
  const createSession = useSessionStore((s) => s.createSession);

  const handleStart = () => {
    createSession();
    navigate('/photo-type');
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-[#0a0908]">
      {/* Subtle vignette / ambient glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        {/* Camera icon badge */}
        <div className="w-24 h-24 rounded-3xl bg-[#d4a94a] flex items-center justify-center shadow-[0_0_40px_rgba(212,169,74,0.35)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1a1408"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <h1 className="text-6xl md:text-7xl font-serif font-bold tracking-tight text-[#f5f0e8]">
            NANAGRAPHY
          </h1>
          <p className="text-sm md:text-base tracking-[0.35em] text-[#8a8378] font-light uppercase">
            Photo Booth
          </p>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-6 mt-2 text-sm text-[#a8a196]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Camera Ready
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Printer Ready
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Payment Online
          </span>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="mt-6 px-16 py-6 rounded-2xl bg-[#d4a94a] hover:bg-[#e0b658] active:scale-95 transition-all duration-200 shadow-lg"
        >
          <span className="text-2xl font-serif font-bold text-[#1a1408] tracking-wide">
            TAP TO START
          </span>
        </button>

        <p className="text-[#6e685e] text-sm mt-2">
          Touch the screen to begin your session
        </p>
      </div>
    </div>
  );
}