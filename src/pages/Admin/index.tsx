import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppSettings, PaymentRecord } from '../../types';

type AdminSettings = AppSettings & {
  adminPin?: string;
  qrScanner?: { enabled: boolean; deviceName: string };
  frames?: { customFrame: string; defaultFrame: string };
  effects?: { enabled: boolean; available: string };
  backup?: { lastBackup?: string };
};

const defaults: AdminSettings = {
  brandName: 'NANAGRAPHY',
  brandTagline: 'Capture Moments',
  currency: '₹',
  sessionTimeoutSeconds: 300,
  countdownSeconds: 3,
  defaultQuantity: 1,
  maxQuantity: 10,
  kioskMode: true,
  fullscreen: true,
  autoReturnHome: true,
  language: 'en',
  theme: { primaryColor: '#E11D48', backgroundColor: '#0F172A' },
  camera: { mockMode: true, preferredBrand: 'Canon' },
  printer: { mockMode: true, defaultPrinter: '' },
  payment: { mockMode: true, provider: 'upi', merchantName: 'NANAGRAPHY Photo Booth' },
  adminPin: '1234',
  qrScanner: { enabled: false, deviceName: '' },
  frames: { customFrame: '', defaultFrame: '' },
  effects: { enabled: true, available: 'Original, Black & White, Warm, Cool' },
};

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/65">
      {label}
      <input className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none focus:border-brand-primary" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-4 text-white/80">
      <span>{label}</span>
      <input className="h-5 w-5 accent-brand-primary" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminSettings>(defaults);
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');
  const [status, setStatus] = useState('Loading settings...');
  const [busy, setBusy] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    window.api.config.getSettings().then((loaded: Partial<AdminSettings>) => {
      setSettings({ ...defaults, ...loaded, theme: { ...defaults.theme, ...loaded.theme }, camera: { ...defaults.camera, ...loaded.camera }, printer: { ...defaults.printer, ...loaded.printer }, payment: { ...defaults.payment, ...loaded.payment }, qrScanner: { enabled: loaded.qrScanner?.enabled ?? defaults.qrScanner!.enabled, deviceName: loaded.qrScanner?.deviceName ?? defaults.qrScanner!.deviceName }, frames: { customFrame: loaded.frames?.customFrame ?? defaults.frames!.customFrame, defaultFrame: loaded.frames?.defaultFrame ?? defaults.frames!.defaultFrame }, effects: { enabled: loaded.effects?.enabled ?? defaults.effects!.enabled, available: loaded.effects?.available ?? defaults.effects!.available } });
      setStatus('Ready');
    }).catch(() => setStatus('Could not load settings'));
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    window.api.payment.getHistory().then((history: PaymentRecord[]) => setPayments(history));
  }, [unlocked]);

  const unlock = () => {
    if (pin === (settings.adminPin || '1234')) {
      setUnlocked(true);
      setPinError('');
      return;
    }
    setPin('');
    setPinError('Incorrect PIN');
  };

  const update = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  const updateNested = (key: 'theme' | 'payment' | 'printer' | 'qrScanner' | 'frames' | 'effects', field: string, value: string | number | boolean) => setSettings((current) => ({ ...current, [key]: { ...(current[key] as object), [field]: value } }));

  const save = async () => {
    setBusy(true);
    const result = await window.api.config.updateSettings(settings);
    setStatus(result.success ? 'Settings saved' : result.error ?? 'Save failed');
    setBusy(false);
  };

  const testPrint = async () => {
    setBusy(true);
    const result = await window.api.printer.testPrint();
    setStatus(result.success ? 'Test print sent' : result.error ?? 'Test print failed');
    setBusy(false);
  };

  const backup = async () => {
    const result = await window.api.config.backup();
    setStatus(result.success ? `Backup created: ${result.path}` : result.error ?? 'Backup failed');
  };

  const paidPayments = payments.filter((payment) => payment.status === 'success');
  const totalCollected = paidPayments.reduce((total, payment) => total + payment.amount, 0);

  if (!unlocked) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 px-6 text-white">
        <div className="card w-full max-w-md !rounded-2xl !p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary">Admin access</p>
          <h1 className="mt-3 text-3xl font-black">Enter PIN</h1>
          <p className="mt-2 text-white/50">Enter the booth administrator PIN to continue.</p>
          <input autoFocus inputMode="numeric" maxLength={12} type="password" value={pin} onChange={(event) => setPin(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') unlock(); }} className="mt-6 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-4 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-brand-primary" aria-label="Admin PIN" />
          {pinError && <p className="mt-3 text-red-400">{pinError}</p>}
          <div className="mt-6 flex justify-center gap-3"><button className="btn-ghost !min-h-0 !px-5 !py-3 !text-base" onClick={() => navigate('/')}>Cancel</button><button className="btn-primary !min-h-0 !px-7 !py-3 !text-base" onClick={unlock}>Unlock</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-950 px-6 py-8 text-white md:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div><p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-primary">Admin dashboard</p><h1 className="mt-2 text-4xl font-black">Booth controls</h1><p className="mt-2 text-white/50">Configure the kiosk, pricing, media, and maintenance tools.</p></div>
          <button className="btn-ghost !min-h-0 !px-5 !py-3 !text-base" onClick={() => navigate('/')}>Exit</button>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="card !rounded-2xl !p-5"><h2 className="mb-4 text-xl font-bold">Session</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Countdown (seconds)" type="number" value={settings.countdownSeconds} onChange={(value) => update('countdownSeconds', Number(value))} /><Field label="Session timeout" type="number" value={settings.sessionTimeoutSeconds} onChange={(value) => update('sessionTimeoutSeconds', Number(value))} /><Field label="Default prints" type="number" value={settings.defaultQuantity} onChange={(value) => update('defaultQuantity', Number(value))} /><Field label="Maximum prints" type="number" value={settings.maxQuantity} onChange={(value) => update('maxQuantity', Number(value))} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Toggle label="Retake option" checked={settings.autoReturnHome} onChange={(value) => update('autoReturnHome', value)} /><Toggle label="Effects enabled" checked={settings.effects?.enabled ?? true} onChange={(value) => updateNested('effects', 'enabled', value)} /></div></section>

          <section className="card !rounded-2xl !p-5"><h2 className="mb-4 text-xl font-bold">Frames & effects</h2><div className="grid gap-4"><Field label="Custom edited frame path" value={settings.frames?.customFrame ?? ''} onChange={(value) => updateNested('frames', 'customFrame', value)} /><Field label="Default frame path" value={settings.frames?.defaultFrame ?? ''} onChange={(value) => updateNested('frames', 'defaultFrame', value)} /><Field label="Available effects" value={settings.effects?.available ?? ''} onChange={(value) => updateNested('effects', 'available', value)} /></div></section>

          <section className="card !rounded-2xl !p-5"><h2 className="mb-4 text-xl font-bold">Payment & QR</h2><div className="grid gap-4"><Field label="Currency" value={settings.currency} onChange={(value) => update('currency', value)} /><Field label="Merchant name" value={settings.payment.merchantName} onChange={(value) => updateNested('payment', 'merchantName', value)} /><Toggle label="Testing mode (mock payment)" checked={settings.payment.mockMode} onChange={(value) => updateNested('payment', 'mockMode', value)} /><Toggle label="QR scanner enabled" checked={settings.qrScanner?.enabled ?? false} onChange={(value) => updateNested('qrScanner', 'enabled', value)} /><Field label="QR scanner device" value={settings.qrScanner?.deviceName ?? ''} onChange={(value) => updateNested('qrScanner', 'deviceName', value)} /></div></section>

          <section className="card !rounded-2xl !p-5"><h2 className="mb-4 text-xl font-bold">Printer & desktop saver</h2><div className="grid gap-4"><Field label="Printer name" value={settings.printer.defaultPrinter} onChange={(value) => updateNested('printer', 'defaultPrinter', value)} /><Toggle label="Printer testing mode" checked={settings.printer.mockMode} onChange={(value) => updateNested('printer', 'mockMode', value)} /><Toggle label="Fullscreen kiosk" checked={settings.fullscreen} onChange={(value) => update('fullscreen', value)} /><Toggle label="Desktop saver theme" checked={settings.theme.backgroundColor === '#111827'} onChange={(value) => updateNested('theme', 'backgroundColor', value ? '#111827' : '#0F172A')} /><button className="btn-secondary !min-h-0 !py-3 !text-base" onClick={testPrint} disabled={busy}>Test print without UPI</button></div></section>

          <section className="card !rounded-2xl !p-5"><h2 className="mb-4 text-xl font-bold">Security</h2><div className="grid gap-4 sm:grid-cols-2"><Field label="Admin PIN" type="password" value={settings.adminPin ?? ''} onChange={(value) => update('adminPin', value)} /><Field label="Forgot password reset" type="password" value={settings.adminPin ?? ''} onChange={(value) => update('adminPin', value)} /></div><p className="mt-3 text-sm text-white/45">Use the reset field to set a new PIN, then save.</p></section>

          <section className="card !rounded-2xl !p-5"><h2 className="mb-4 text-xl font-bold">Backup</h2><p className="text-sm text-white/55">Create a copy of the current settings before changing the booth configuration.</p><button className="btn-secondary mt-5 !min-h-0 !py-3 !text-base" onClick={backup}>Create backup</button></section>

          <section className="card !rounded-2xl !p-5 lg:col-span-2"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-xl font-bold">Payment history</h2><p className="mt-1 text-sm text-white/50">Paid orders and payment attempts stored on this booth.</p></div><div className="flex gap-6 text-right"><div><p className="text-xs uppercase tracking-wider text-white/45">Paid orders</p><p className="text-2xl font-black text-green-400">{paidPayments.length}</p></div><div><p className="text-xs uppercase tracking-wider text-white/45">Collected</p><p className="text-2xl font-black text-brand-primary">₹{totalCollected}</p></div></div></div>{payments.length === 0 ? <p className="mt-6 rounded-xl border border-white/10 bg-slate-950/40 p-5 text-center text-white/45">No payment records yet.</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45"><tr><th className="px-3 py-3">Time</th><th className="px-3 py-3">UPI name</th><th className="px-3 py-3">Merchant</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Order</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.orderId} className="border-b border-white/5 text-white/75"><td className="px-3 py-3">{new Date(payment.createdAt).toLocaleString()}</td><td className="px-3 py-3">{payment.payerUpiName || 'Not provided'}</td><td className="px-3 py-3">{payment.merchantName}</td><td className="px-3 py-3 font-semibold">₹{payment.amount}</td><td className={`px-3 py-3 font-semibold ${payment.status === 'success' ? 'text-green-400' : payment.status === 'failed' ? 'text-red-400' : 'text-amber-300'}`}>{payment.status}</td><td className="px-3 py-3 font-mono text-xs text-white/45">{payment.orderId}</td></tr>)}</tbody></table></div>}</section>
        </div>

        <footer className="sticky bottom-0 mt-6 flex items-center justify-between gap-4 border-t border-white/10 bg-slate-950/95 py-5"><span className="text-sm text-white/55">{status}</span><button className="btn-primary !min-h-0 !px-8 !py-4 !text-lg" onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save settings'}</button></footer>
      </div>
    </div>
  );
}
