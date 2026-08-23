import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';

export default function Complete() {
  const navigate = useNavigate();
  const { session, resetSession } = useSessionStore();

  const handleDone = () => {
    resetSession();
    navigate('/');
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-brand-dark px-8">
      <div className="text-center space-y-10 max-w-lg">
        {/* Success icon */}
        <div className="w-32 h-32 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-5xl text-white shadow-lg shadow-green-500/40">
            ✓
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-5xl font-black text-white">Print Complete</h1>
          <p className="text-2xl text-white/70">Collect your photos</p>
        </div>

        {session && (
          <div className="text-white/40 text-lg space-y-1">
            <p>{session.selectedPhotoType?.name}</p>
            <p>
              Qty: {session.quantity} · ₹{session.totalAmount}
            </p>
            <p className="text-sm">{session.sessionId}</p>
          </div>
        )}

        <button onClick={handleDone} className="btn-primary text-2xl px-16 py-6 mt-8">
          DONE
        </button>
      </div>
    </div>
  );
}
