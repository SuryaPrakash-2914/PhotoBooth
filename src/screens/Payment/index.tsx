import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '../../useNavigate';
import { useSessionStore } from '../../store/sessionStore';

type PayState = 'creating' | 'waiting' | 'verifying' | 'success' | 'failed';

const POLL_INTERVAL_MS = 1500;
const PAYMENT_TIMEOUT_MS = 90000;

export default function Payment() {
  const navigate = useNavigate();
  const { session, setPaymentStatus } = useSessionStore();
  const [payState, setPayState] = useState<PayState>('creating');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitingTicker = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!session || session.totalAmount <= 0) {
      navigate('/preview');
    }
  }, [session, navigate]);

  const clearTimers = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    if (waitingTicker.current) clearInterval(waitingTicker.current);
  };

  const startOrder = async () => {
    if (!session) return;
    setPayState('creating');
    setErrorMessage(null);
    const result = await window.api.payment.create(session.totalAmount);
    if (!result.success || !result.orderId) {
      setErrorMessage(result.error || 'Could not create payment order');
      setPayState('failed');
      setPaymentStatus('failed');
      return;
    }
    setQrImage(result.qrImage ?? null);
    setOrderId(result.orderId);
    setWaitingSeconds(0);
    setPayState('waiting');
    setPaymentStatus('pending');
  };

  // Create the order once when the screen mounts.
  useEffect(() => {
    startOrder();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.sessionId]);

  // Poll for payment status while waiting, and tick the elapsed-time counter.
  useEffect(() => {
    if (payState !== 'waiting' || !orderId) return;

    timeoutTimer.current = setTimeout(() => {
      clearTimers();
      setErrorMessage('Payment timed out');
      setPayState('failed');
      setPaymentStatus('failed');
    }, PAYMENT_TIMEOUT_MS);

    waitingTicker.current = setInterval(() => {
      setWaitingSeconds((s) => s + 1);
    }, 1000);

    pollTimer.current = setInterval(async () => {
      const result = await window.api.payment.checkStatus(orderId);
      if (!result.success) return;

      if (result.status === 'success') {
        clearTimers();
        setPayState('success');
        setPaymentStatus('success');
        setTimeout(() => navigate('/printing'), 1500);
      } else if (result.status === 'failed') {
        clearTimers();
        setErrorMessage(result.error || 'Payment verification failed');
        setPayState('failed');
        setPaymentStatus('failed');
      }
      // 'pending' keeps polling
    }, POLL_INTERVAL_MS);

    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payState, orderId]);

  const handleSimulateSuccess = () => {
    // Dev/demo helper for mock-mode payment testing. There's no real IPC
    // method for this yet, so it just fast-forwards the local UI state —
    // swap this out once a real simulateSuccess endpoint exists on
    // window.api.payment.
    clearTimers();
    setPayState('success');
    setPaymentStatus('success');
    setTimeout(() => navigate('/printing'), 1500);
  };

  if (!session) return null;

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0b0d] text-white">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/10 shrink-0">
        <button
          onClick={() => navigate('/preview')}
          className="text-white/70 hover:text-white transition-colors text-xl leading-none"
          aria-label="Back"
        >
          ‹
        </button>
        <h3 className="font-serif text-lg tracking-wide text-white/90">Payment</h3>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xs rounded-2xl border border-white/10 p-6 text-center">
          <p className="text-white/40 text-xs font-semibold tracking-widest uppercase">
            Amount to Pay
          </p>
          <p className="font-serif text-4xl font-bold text-amber-400 mt-1">
            ₹{session.totalAmount}
          </p>

          {/* QR */}
          <div className="mx-auto mt-5 w-40 h-40 bg-white rounded-2xl flex items-center justify-center overflow-hidden">
            {payState === 'creating' ? (
              <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : payState === 'waiting' || payState === 'verifying' ? (
              qrImage ? (
                <img src={qrImage} alt="Scan to pay" className="w-full h-full object-contain p-3" />
              ) : (
                <p className="text-slate-500 text-xs p-4">QR unavailable</p>
              )
            ) : payState === 'success' ? (
              <div className="text-5xl text-green-500">✓</div>
            ) : (
              <div className="text-5xl text-red-500">✗</div>
            )}
          </div>

          {/* Scan hint */}
          {(payState === 'waiting' || payState === 'verifying') && (
            <div className="mt-5">
              <p className="text-white/70 text-sm">Scan with any UPI app</p>
              <p className="text-white/30 text-xs mt-0.5">nanagraphy@upi</p>
            </div>
          )}

          {/* Status line */}
          <div className="mt-4 min-h-[20px] text-sm">
            {payState === 'creating' && <span className="text-white/40">Preparing payment…</span>}
            {payState === 'waiting' && (
              <span className="flex items-center justify-center gap-1.5 text-amber-400">
                <span className="inline-block w-3 h-3 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                Waiting · {waitingSeconds}s
              </span>
            )}
            {payState === 'verifying' && (
              <span className="flex items-center justify-center gap-1.5 text-white/70">
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Verifying payment…
              </span>
            )}
            {payState === 'success' && (
              <span className="text-green-400 font-semibold">Payment Successful!</span>
            )}
            {payState === 'failed' && (
              <span className="text-red-400">{errorMessage || 'Payment verification failed'}</span>
            )}
          </div>

          {payState === 'failed' && (
            <button
              onClick={startOrder}
              className="mt-4 w-full py-3 rounded-full font-semibold bg-amber-400 text-black hover:bg-amber-300 transition-colors"
            >
              TRY AGAIN
            </button>
          )}

          {(payState === 'waiting' || payState === 'creating') && (
            <button
              onClick={() => navigate('/preview')}
              className="mt-3 text-white/40 hover:text-white/70 text-sm transition-colors"
            >
              Cancel
            </button>
          )}

          {payState === 'waiting' && (
            <button
              onClick={handleSimulateSuccess}
              className="mt-3 text-amber-400/70 hover:text-amber-400 text-xs transition-colors"
            >
              [Demo: Simulate Success]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}