import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session || session.totalAmount <= 0) {
      navigate('/preview');
    }
  }, [session, navigate]);

  const clearTimers = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
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
    setPayState('waiting');
    setPaymentStatus('pending');
  };

  // Create the order once when the screen mounts.
  useEffect(() => {
    startOrder();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.sessionId]);

  // Poll for payment status while waiting.
  useEffect(() => {
    if (payState !== 'waiting' || !orderId) return;

    timeoutTimer.current = setTimeout(() => {
      clearTimers();
      setErrorMessage('Payment timed out');
      setPayState('failed');
      setPaymentStatus('failed');
    }, PAYMENT_TIMEOUT_MS);

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

  if (!session) return null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-brand-dark px-8">
      <div className="text-center space-y-10 max-w-md w-full">
        <h1 className="text-4xl font-bold text-white">Scan QR to Pay</h1>

        {/* QR */}
        <div className="mx-auto w-64 h-64 bg-white rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden">
          {payState === 'creating' ? (
            <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          ) : payState === 'waiting' || payState === 'verifying' ? (
            qrImage ? (
              <img src={qrImage} alt="Scan to pay" className="w-full h-full object-contain p-4" />
            ) : (
              <p className="text-slate-500 text-sm p-6">QR unavailable</p>
            )
          ) : payState === 'success' ? (
            <div className="text-6xl text-green-500">✓</div>
          ) : (
            <div className="text-6xl text-red-500">✗</div>
          )}
        </div>

        {/* Amount */}
        <div className="text-5xl font-black text-brand-primary">₹{session.totalAmount}</div>

        {/* Status */}
        <div className="text-xl text-white/70 min-h-[32px]">
          {payState === 'creating' && 'Preparing payment...'}
          {payState === 'waiting' && 'Waiting for payment...'}
          {payState === 'verifying' && (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Verifying payment...
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
          <button onClick={startOrder} className="btn-primary mt-4">
            TRY AGAIN
          </button>
        )}

        {(payState === 'waiting' || payState === 'creating') && (
          <button onClick={() => navigate('/preview')} className="btn-ghost text-base mt-4">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
