import { useEffect } from 'react';
import { useNavigate } from '../../useNavigate';
import { useSessionStore } from '../../store/sessionStore';

// Keep in sync with the frame options offered on the Edit screen.
const FRAME_PRICES: Record<string, string> = {
  Classic: 'FREE',
  'Golden Hour': '+₹20',
  Bloom: '+₹25',
  Midnight: '+₹20',
  Forest: '+₹30',
};

export default function Preview() {
  const navigate = useNavigate();
  const { session, setQuantity } = useSessionStore();

  useEffect(() => {
    if (!session?.selectedPhotoType) {
      navigate('/');
    }
  }, [session, navigate]);

  if (!session || !session.selectedPhotoType) return null;

  const { selectedPhotoType, selectedFrame, quantity, totalAmount, capturedPhotos } = session;
  const framePrice = selectedFrame ? FRAME_PRICES[selectedFrame] ?? '' : '';

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0b0d] text-white">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/10 shrink-0">
        <button
          onClick={() => navigate('/edit')}
          className="text-white/70 hover:text-white transition-colors text-xl leading-none"
          aria-label="Back"
        >
          ‹
        </button>
        <h3 className="font-serif text-lg tracking-wide text-white/90">Order Preview</h3>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-5 p-6 min-h-0">
        {/* Layout preview */}
        <div className="flex-1 rounded-2xl border border-white/10 flex items-center justify-center">
          <div className="rounded-xl overflow-hidden bg-black border border-white/10 w-44">
            {selectedPhotoType.layout === 'vertical-4' && (
              <div className="flex flex-col gap-0.5">
                {capturedPhotos.slice(0, 4).map((p) => (
                  <div key={p.poseIndex} className="aspect-[3/2] bg-slate-800">
                    {p.thumbnail && (
                      <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
            {selectedPhotoType.layout === 'vertical-2' && (
              <div className="flex flex-col gap-0.5">
                {capturedPhotos.slice(0, 2).map((p) => (
                  <div key={p.poseIndex} className="aspect-[3/2] bg-slate-800">
                    {p.thumbnail && (
                      <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
            {(selectedPhotoType.layout === 'single' || selectedPhotoType.layout === 'passport') && (
              <div className="aspect-[4/3] bg-slate-800">
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
        </div>

        {/* Sidebar */}
        <div className="w-[280px] shrink-0 flex flex-col">
          <div className="flex-1 rounded-2xl border border-white/10 p-5">
            <h2 className="font-serif text-lg font-bold text-white mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/40">Package</span>
                <span className="text-white">{selectedPhotoType.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Base Price</span>
                <span className="text-white">₹{selectedPhotoType.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">Frame</span>
                <span className="text-white">
                  {selectedFrame || 'None'} {framePrice && `(${framePrice})`}
                </span>
              </div>
            </div>

            <div className="border-t border-white/10 my-4" />

            <div className="flex items-center justify-between">
              <span className="text-white/40 text-sm">Qty</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(quantity - 1)}
                  className="w-7 h-7 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-base font-bold transition-colors"
                >
                  −
                </button>
                <span className="text-base font-semibold w-5 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-base font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-white/80 font-semibold">Total</span>
              <span className="font-serif text-2xl font-bold text-amber-400">₹{totalAmount}</span>
            </div>
          </div>

          {/* Pay */}
          <button
            onClick={() => navigate('/payment')}
            className="mt-4 w-full py-4 rounded-2xl font-semibold bg-amber-400 text-black hover:bg-amber-300 transition-colors"
          >
            PAY ₹{totalAmount}
          </button>
        </div>
      </div>
    </div>
  );
}