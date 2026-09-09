import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Delete,
  LayoutDashboard,
  Receipt,
  Image as ImageIcon,
  Frame as FrameIcon,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
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

type TabId = 'dashboard' | 'payments' | 'photoTypes' | 'frames' | 'settings';

const NAV_ITEMS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'payments', label: 'Payments', icon: Receipt },
  { id: 'photoTypes', label: 'Photo Types', icon: ImageIcon },
  { id: 'frames', label: 'Frames', icon: FrameIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/65">
      {label}
      <input className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-base text-white outline-none focus:border-amber-400" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-4 text-white/80">
      <span>{label}</span>
      <input className="h-5 w-5 accent-amber-400" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function StatCard({ label, value, valueClass, caption }: { label: string; value: string | number; valueClass: string; caption: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className={`mt-3 text-3xl font-serif font-bold ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs text-stone-500">{caption}</p>
    </div>
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
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  useEffect(() => {
    window.api.config.getSettings().then((loaded: Partial<AdminSettings>) => {
      setSettings({
        ...defaults,
        ...loaded,
        theme: { ...defaults.theme, ...loaded.theme },
        camera: { ...defaults.camera, ...loaded.camera },
        printer: { ...defaults.printer, ...loaded.printer },
        payment: { ...defaults.payment, ...loaded.payment },
        qrScanner: {
          enabled: loaded.qrScanner?.enabled ?? defaults.qrScanner!.enabled,
          deviceName: loaded.qrScanner?.deviceName ?? defaults.qrScanner!.deviceName,
        },
        frames: {
          customFrame: loaded.frames?.customFrame ?? defaults.frames!.customFrame,
          defaultFrame: loaded.frames?.defaultFrame ?? defaults.frames!.defaultFrame,
        },
        effects: {
          enabled: loaded.effects?.enabled ?? defaults.effects!.enabled,
          available: loaded.effects?.available ?? defaults.effects!.available,
        },
      });
      setStatus('Ready');
    }).catch(() => setStatus('Could not load settings'));
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    window.api.payment.getHistory().then((history: PaymentRecord[]) => setPayments(history));
  }, [unlocked]);

  const unlock = (candidate: string) => {
    if (candidate === (settings.adminPin || '1234')) {
      setUnlocked(true);
      setPinError('');
      return;
    }
    setPin('');
    setPinError('Incorrect PIN');
  };

  // Auto-submit once 4 digits are entered
  useEffect(() => {
    if (pin.length === 4) unlock(pin);
  }, [pin]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDigit = (digit: string) => {
    setPinError('');
    setPin((current) => (current.length < 4 ? current + digit : current));
  };
  const handleBackspace = () => setPin((current) => current.slice(0, -1));

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

  const isToday = (dateStr: string) => new Date(dateStr).toDateString() === new Date().toDateString();
  const todaysPayments = payments.filter((payment) => isToday(payment.createdAt));
  const paidToday = todaysPayments.filter((payment) => payment.status === 'success');
  const pendingToday = todaysPayments.filter((payment) => payment.status === 'pending');
  // NOTE: 'failed prints' isn't part of PaymentRecord yet — this reads an optional
  // printStatus field defensively so it won't break if that field doesn't exist.
  const failedPrintsToday = todaysPayments.filter((payment) => (payment as any).printStatus === 'failed');
  const revenueToday = paidToday.reduce((total, payment) => total + payment.amount, 0);

  const recentTransactions = [...payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  // ---------- PIN SCREEN ----------
  if (!unlocked) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a] text-white">
        <div className="flex w-full max-w-xs flex-col items-center gap-6 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.35)]">
            <Lock className="h-7 w-7 text-black" strokeWidth={2} />
          </div>

          <div className="space-y-1">
            <h1 className="font-serif text-3xl font-bold text-stone-100">Admin Access</h1>
            <p className="text-sm text-stone-500">Enter your PIN</p>
          </div>

          <div className="flex items-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-full border transition-colors ${
                  i < pin.length ? 'border-amber-400 bg-amber-400' : 'border-stone-600 bg-transparent'
                }`}
              />
            ))}
          </div>

          {pinError && <p className="text-sm text-red-400">{pinError}</p>}

          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#141414] font-serif text-xl font-bold text-stone-100 transition-colors hover:bg-[#1c1c1c] active:scale-95"
              >
                {digit}
              </button>
            ))}
            <div className="h-16 w-16" />
            <button
              onClick={() => handleDigit('0')}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#141414] font-serif text-xl font-bold text-stone-100 transition-colors hover:bg-[#1c1c1c] active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#141414] text-stone-300 transition-colors hover:bg-[#1c1c1c] active:scale-95"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          <button onClick={() => navigate('/')} className="text-sm text-stone-500 hover:text-stone-300">
            ← Back to Booth
          </button>
        </div>
      </div>
    );
  }

  // ---------- DASHBOARD SHELL ----------
  return (
    <div className="flex h-full w-full bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-white/10 bg-[#0a0a0a] px-4 py-6">
        <div className="px-2">
          <p className="font-serif text-lg font-bold tracking-tight text-stone-100">NANAGRAPHY</p>
          <p className="text-xs text-stone-500">Admin</p>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active ? 'bg-amber-400/10 text-amber-400' : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => { setUnlocked(false); navigate('/'); }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-400 hover:bg-white/5 hover:text-stone-200"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        {activeTab === 'dashboard' && (
          <>
            <header className="mb-6">
              <h1 className="font-serif text-3xl font-bold text-stone-100">Dashboard</h1>
              <p className="mt-1 text-sm text-stone-500">{todayLabel}</p>
            </header>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Revenue" value={`₹${revenueToday.toLocaleString()}`} valueClass="text-amber-400" caption="Today" />
              <StatCard label="Paid Sessions" value={paidToday.length} valueClass="text-emerald-400" caption="Today" />
              <StatCard label="Pending" value={pendingToday.length} valueClass="text-amber-300" caption="Today" />
              <StatCard label="Failed Prints" value={failedPrintsToday.length} valueClass="text-red-400" caption="Today" />
            </div>

            <section className="mt-8">
              <h2 className="mb-3 font-serif text-xl font-bold text-stone-100">Recent Transactions</h2>
              {recentTransactions.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-[#111111] p-5 text-center text-stone-500">No transactions yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-stone-500">
                      <tr>
                        <th className="px-4 py-3">Session ID</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Frame</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">₹</th>
                        <th className="px-4 py-3">Payment</th>
                        <th className="px-4 py-3">Print</th>
                        <th className="px-4 py-3">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((payment) => (
                        <tr key={payment.orderId} className="border-b border-white/5 text-stone-300">
                          <td className="px-4 py-3 font-mono text-xs text-stone-400">{(payment as any).sessionId ?? payment.orderId}</td>
                          <td className="px-4 py-3">{(payment as any).photoType ?? '—'}</td>
                          <td className="px-4 py-3">{(payment as any).frame ?? '—'}</td>
                          <td className="px-4 py-3">{(payment as any).quantity ?? '—'}</td>
                          <td className="px-4 py-3 font-semibold">₹{payment.amount}</td>
                          <td className={`px-4 py-3 font-semibold ${payment.status === 'success' ? 'text-emerald-400' : payment.status === 'failed' ? 'text-red-400' : 'text-amber-300'}`}>
                            {payment.status === 'success' ? 'PAID' : payment.status.toUpperCase()}
                          </td>
                          <td className="px-4 py-3">
                            {(payment as any).printStatus
                              ? <span className={(payment as any).printStatus === 'printed' ? 'text-emerald-400' : 'text-red-400'}>{((payment as any).printStatus as string).toUpperCase()}</span>
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-stone-400">{new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'payments' && (
          <>
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl font-bold text-stone-100">Payments</h1>
                <p className="mt-1 text-sm text-stone-500">All paid orders and payment attempts stored on this booth.</p>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-500">Paid orders</p>
                  <p className="text-2xl font-black text-emerald-400">{payments.filter((p) => p.status === 'success').length}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-500">Collected</p>
                  <p className="text-2xl font-black text-amber-400">₹{payments.filter((p) => p.status === 'success').reduce((t, p) => t + p.amount, 0)}</p>
                </div>
              </div>
            </header>

            {payments.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-[#111111] p-5 text-center text-stone-500">No payment records yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">UPI name</th>
                      <th className="px-4 py-3">Merchant</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.orderId} className="border-b border-white/5 text-stone-300">
                        <td className="px-4 py-3">{new Date(payment.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3">{payment.payerUpiName || 'Not provided'}</td>
                        <td className="px-4 py-3">{payment.merchantName}</td>
                        <td className="px-4 py-3 font-semibold">₹{payment.amount}</td>
                        <td className={`px-4 py-3 font-semibold ${payment.status === 'success' ? 'text-emerald-400' : payment.status === 'failed' ? 'text-red-400' : 'text-amber-300'}`}>{payment.status}</td>
                        <td className="px-4 py-3 font-mono text-xs text-stone-500">{payment.orderId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'photoTypes' && (
          <>
            <header className="mb-6">
              <h1 className="font-serif text-3xl font-bold text-stone-100">Photo Types</h1>
              <p className="mt-1 text-sm text-stone-500">Photo type configuration isn't wired to a data source yet.</p>
            </header>
            <p className="rounded-xl border border-white/10 bg-[#111111] p-5 text-stone-500">
              Add a `photoTypes` field to your settings/store to manage this here.
            </p>
          </>
        )}

        {activeTab === 'frames' && (
          <>
            <header className="mb-6">
              <h1 className="font-serif text-3xl font-bold text-stone-100">Frames & Effects</h1>
            </header>
            <div className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-[#111111] p-5">
              <Field label="Custom edited frame path" value={settings.frames?.customFrame ?? ''} onChange={(value) => updateNested('frames', 'customFrame', value)} />
              <Field label="Default frame path" value={settings.frames?.defaultFrame ?? ''} onChange={(value) => updateNested('frames', 'defaultFrame', value)} />
              <Field label="Available effects" value={settings.effects?.available ?? ''} onChange={(value) => updateNested('effects', 'available', value)} />
              <Toggle label="Effects enabled" checked={settings.effects?.enabled ?? true} onChange={(value) => updateNested('effects', 'enabled', value)} />
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <header className="mb-6">
              <h1 className="font-serif text-3xl font-bold text-stone-100">Settings</h1>
              <p className="mt-1 text-sm text-stone-500">Configure the kiosk, pricing, media, and maintenance tools.</p>
            </header>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
                <h2 className="mb-4 text-xl font-bold">Session</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Countdown (seconds)" type="number" value={settings.countdownSeconds} onChange={(value) => update('countdownSeconds', Number(value))} />
                  <Field label="Session timeout" type="number" value={settings.sessionTimeoutSeconds} onChange={(value) => update('sessionTimeoutSeconds', Number(value))} />
                  <Field label="Default prints" type="number" value={settings.defaultQuantity} onChange={(value) => update('defaultQuantity', Number(value))} />
                  <Field label="Maximum prints" type="number" value={settings.maxQuantity} onChange={(value) => update('maxQuantity', Number(value))} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Toggle label="Retake option" checked={settings.autoReturnHome} onChange={(value) => update('autoReturnHome', value)} />
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
                <h2 className="mb-4 text-xl font-bold">Payment & QR</h2>
                <div className="grid gap-4">
                  <Field label="Currency" value={settings.currency} onChange={(value) => update('currency', value)} />
                  <Field label="Merchant name" value={settings.payment.merchantName} onChange={(value) => updateNested('payment', 'merchantName', value)} />
                  <Toggle label="Testing mode (mock payment)" checked={settings.payment.mockMode} onChange={(value) => updateNested('payment', 'mockMode', value)} />
                  <Toggle label="QR scanner enabled" checked={settings.qrScanner?.enabled ?? false} onChange={(value) => updateNested('qrScanner', 'enabled', value)} />
                  <Field label="QR scanner device" value={settings.qrScanner?.deviceName ?? ''} onChange={(value) => updateNested('qrScanner', 'deviceName', value)} />
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
                <h2 className="mb-4 text-xl font-bold">Printer & desktop saver</h2>
                <div className="grid gap-4">
                  <Field label="Printer name" value={settings.printer.defaultPrinter} onChange={(value) => updateNested('printer', 'defaultPrinter', value)} />
                  <Toggle label="Printer testing mode" checked={settings.printer.mockMode} onChange={(value) => updateNested('printer', 'mockMode', value)} />
                  <Toggle label="Fullscreen kiosk" checked={settings.fullscreen} onChange={(value) => update('fullscreen', value)} />
                  <Toggle label="Desktop saver theme" checked={settings.theme.backgroundColor === '#111827'} onChange={(value) => updateNested('theme', 'backgroundColor', value ? '#111827' : '#0F172A')} />
                  <button className="rounded-xl bg-white/10 py-3 text-sm text-stone-200 hover:bg-white/15" onClick={testPrint} disabled={busy}>Test print without UPI</button>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
                <h2 className="mb-4 text-xl font-bold">Security</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Admin PIN" type="password" value={settings.adminPin ?? ''} onChange={(value) => update('adminPin', value)} />
                </div>
                <p className="mt-3 text-sm text-stone-500">PIN must be exactly 4 digits for the keypad screen.</p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#111111] p-5 lg:col-span-2">
                <h2 className="mb-2 text-xl font-bold">Backup</h2>
                <p className="text-sm text-stone-500">Create a copy of the current settings before changing the booth configuration.</p>
                <button className="mt-4 rounded-xl bg-white/10 px-5 py-3 text-sm text-stone-200 hover:bg-white/15" onClick={backup}>Create backup</button>
              </section>
            </div>

            <footer className="sticky bottom-0 mt-6 flex items-center justify-between gap-4 border-t border-white/10 bg-[#0a0a0a] py-5">
              <span className="text-sm text-stone-500">{status}</span>
              <button className="rounded-xl bg-amber-400 px-8 py-4 text-lg font-bold text-black hover:bg-amber-300" onClick={save} disabled={busy}>
                {busy ? 'Saving...' : 'Save settings'}
              </button>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}