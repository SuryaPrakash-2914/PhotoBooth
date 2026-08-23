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
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-brand-dark to-rose-950" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-brand-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-600 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-16 px-8 text-center">
        {/* Brand */}
        <div className="space-y-4">
          <h1 className="text-7xl md:text-8xl font-black tracking-tight text-white drop-shadow-2xl">
            NANAGRAPHY
          </h1>
          <p className="text-2xl md:text-3xl text-white/70 font-light tracking-wide">
            Capture Moments
          </p>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="btn-primary text-3xl px-20 py-8 rounded-3xl shadow-2xl shadow-brand-primary/40 hover:shadow-brand-primary/60 transform hover:scale-105 active:scale-95 transition-all duration-300"
        >
          START
        </button>

        <p className="text-white/40 text-lg mt-8">Touch to begin your photo session</p>
      </div>
    </div>
  );
}
