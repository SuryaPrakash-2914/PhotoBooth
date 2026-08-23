import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';

export default function Preview() {
  const navigate = useNavigate();
  const { session, setQuantity } = useSessionStore();

  useEffect(() => {
    if (!session?.selectedPhotoType) {
      navigate('/');
    }
  }, [session, navigate]);

  if (!session || !session.selectedPhotoType) return null;

  const { selectedPhotoType, quantity, totalAmount, capturedPhotos } = session;

  return (
    <div className="w-full h-full flex flex-col bg-brand-dark">
      {/* Header */}
      <div className="pt-10 pb-6 text-center">
        <h1 className="text-4xl font-bold text-white">Final Preview</h1>
        <p className="text-white/50 text-xl mt-2">{selectedPhotoType.name}</p>
      </div>

      {/* Layout Preview */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-sm w-full">
          {/* Simulated print layout */}
          <div className="bg-slate-100 rounded-lg overflow-hidden">
            {selectedPhotoType.layout === 'vertical-4' && (
              <div className="flex flex-col gap-1">
                {capturedPhotos.slice(0, 4).map((p) => (
                  <div key={p.poseIndex} className="aspect-[3/2] bg-slate-300">
                    {p.thumbnail && (
                      <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
            {selectedPhotoType.layout === 'vertical-2' && (
              <div className="flex flex-col gap-1">
                {capturedPhotos.slice(0, 2).map((p) => (
                  <div key={p.poseIndex} className="aspect-[3/2] bg-slate-300">
                    {p.thumbnail && (
                      <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
            {(selectedPhotoType.layout === 'single' || selectedPhotoType.layout === 'passport') && (
              <div className="aspect-[3/4] bg-slate-300">
                {capturedPhotos[0]?.thumbnail && (
                  <img
                    src={capturedPhotos[0].thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
          </div>
          <p className="text-center text-slate-500 text-sm mt-3 uppercase tracking-wider">
            {selectedPhotoType.paperSize} Layout
          </p>
        </div>
      </div>

      {/* Quantity + Price */}
      <div className="bg-slate-900/90 border-t border-white/10 px-8 py-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Quantity */}
          <div className="flex items-center justify-between">
            <span className="text-xl text-white/80">Quantity</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(quantity - 1)}
                className="w-14 h-14 rounded-full bg-slate-700 text-2xl font-bold active:scale-90"
              >
                −
              </button>
              <span className="text-3xl font-bold w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-14 h-14 rounded-full bg-slate-700 text-2xl font-bold active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xl text-white/80">Total</span>
            <span className="text-4xl font-black text-brand-primary">₹{totalAmount}</span>
          </div>

          {/* Pay */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => navigate('/payment')}
              className="btn-primary w-full max-w-sm text-2xl py-6"
            >
              PAY NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
