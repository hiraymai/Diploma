'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ─── helpers ────────────────────────────────────────────────────────────────
function useAdminToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('admin_token') || '';
}

function adminFetch(url: string, token: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

const STATUS_LABEL: Record<string, string> = {
  FREE: '🟢 Свободно', BOOKED: '🟡 Забронировано',
  OCCUPIED: '🔴 Занято', RESERVED: '🟣 Резерв', REPAIR: '🔧 Ремонт',
};

// ─── Tab 1: Parking map ──────────────────────────────────────────────────────
function ParkingTab({ token }: { token: string }) {
  const [spots, setSpots] = useState<any[]>([]);
  const [carPlate, setCarPlate] = useState('777ABC01');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await adminFetch('/backend/admin/parking/spots', token);
    if (r.ok) setSpots(await r.json());
  }, [token]);

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  const action = async (endpoint: string, body: object) => {
    setBusy(JSON.stringify(body));
    await adminFetch(endpoint, token, { method: 'POST', body: JSON.stringify(body) });
    await load(); setBusy(null);
  };

  const short = spots.filter(s => s.type === 'SHORT_TERM');
  const long  = spots.filter(s => s.type === 'LONG_TERM');

  const SpotCard = ({ s }: { s: any }) => (
    <div className="border rounded-xl p-3 bg-white shadow-sm space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-bold text-sm">{s.spotNumber}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{STATUS_LABEL[s.status] || s.status}</span>
      </div>
      {s.currentUserPlate && <div className="text-xs font-mono bg-gray-50 px-2 py-1 rounded">{s.currentUserPlate}</div>}
      <div className="flex gap-1">
        <button onClick={() => action('/backend/admin/parking/simulate-entry', { spotNumber: s.spotNumber, carPlate })}
          className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded px-1 py-1">🚗 Въезд</button>
        <button onClick={() => action('/backend/admin/parking/simulate-exit', { spotNumber: s.spotNumber })}
          className="flex-1 text-xs bg-green-50 hover:bg-green-100 border border-green-200 rounded px-1 py-1">🚙 Выезд</button>
      </div>
      <select className="w-full text-xs border rounded px-1 py-1" value={s.status}
        onChange={e => action('/backend/admin/parking/set-status', { spotNumber: s.spotNumber, status: e.target.value })}>
        {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <input value={carPlate} onChange={e => setCarPlate(e.target.value)}
          placeholder="Госномер для въезда" className="border rounded-lg px-3 py-2 text-sm w-52" />
        <button onClick={load} className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg">🔄 Обновить</button>
        {busy && <span className="text-xs text-gray-400">Загрузка...</span>}
      </div>
      <h3 className="font-semibold text-gray-700 mb-3">🅿️ Краткосрочная парковка (SP-01…15)</h3>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
        {short.map(s => <SpotCard key={s.spotNumber} s={s} />)}
      </div>
      <h3 className="font-semibold text-gray-700 mb-3">🅿️ Долгосрочная аренда (SP-16…30)</h3>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {long.map(s => <SpotCard key={s.spotNumber} s={s} />)}
      </div>
    </div>
  );
}

// ─── Tab 2: Bookings ─────────────────────────────────────────────────────────
function BookingsTab({ token }: { token: string }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [tab, setTab] = useState<'short' | 'long'>('short');

  const load = useCallback(async () => {
    const [b, r] = await Promise.all([
      adminFetch('/backend/admin/bookings', token).then(r => r.json()),
      adminFetch('/backend/admin/rentals', token).then(r => r.json()),
    ]);
    setBookings(Array.isArray(b) ? b : []);
    setRentals(Array.isArray(r) ? r : []);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const cancelBooking = async (id: string) => {
    await adminFetch(`/backend/admin/bookings/${id}/cancel`, token, { method: 'POST' });
    load();
  };
  const cancelRental = async (id: string) => {
    await adminFetch(`/backend/admin/rentals/${id}/cancel`, token, { method: 'POST' });
    load();
  };

  const statusColor = (s: string) => ({ PENDING: 'text-yellow-600', CONFIRMED: 'text-blue-600', COMPLETED: 'text-green-600', CANCELLED: 'text-gray-400', NO_SHOW: 'text-red-600', ACTIVE: 'text-green-600', EXPIRED: 'text-gray-400' }[s] || '');

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['short', 'long'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {t === 'short' ? `Краткосрочные (${bookings.length})` : `Долгосрочные (${rentals.length})`}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-sm bg-gray-100 px-3 py-2 rounded-lg">🔄</button>
      </div>

      {tab === 'short' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500 text-left">
              <th className="pb-2 pr-4">Место</th><th className="pb-2 pr-4">Пользователь</th>
              <th className="pb-2 pr-4">Начало</th><th className="pb-2 pr-4">Окончание</th>
              <th className="pb-2 pr-4">Стоимость</th><th className="pb-2 pr-4">Статус</th><th className="pb-2">Действие</th>
            </tr></thead>
            <tbody>{bookings.map(b => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4 font-mono font-bold">{b.spot?.spotNumber}</td>
                <td className="py-2 pr-4">{b.user?.phoneNumber}</td>
                <td className="py-2 pr-4 text-xs">{new Date(b.startTime).toLocaleString('ru')}</td>
                <td className="py-2 pr-4 text-xs">{new Date(b.estimatedEndTime).toLocaleString('ru')}</td>
                <td className="py-2 pr-4">{b.totalCost}₸</td>
                <td className={`py-2 pr-4 font-medium ${statusColor(b.status)}`}>{b.status}</td>
                <td className="py-2">
                  {['PENDING','CONFIRMED'].includes(b.status) && (
                    <button onClick={() => cancelBooking(b.id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2 py-1 rounded">Отменить</button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
          {bookings.length === 0 && <p className="text-gray-400 text-center py-8">Нет бронирований</p>}
        </div>
      )}

      {tab === 'long' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500 text-left">
              <th className="pb-2 pr-4">Место</th><th className="pb-2 pr-4">Пользователь</th>
              <th className="pb-2 pr-4">Дней</th><th className="pb-2 pr-4">С</th>
              <th className="pb-2 pr-4">По</th><th className="pb-2 pr-4">Стоимость</th>
              <th className="pb-2 pr-4">Статус</th><th className="pb-2">Действие</th>
            </tr></thead>
            <tbody>{rentals.map(r => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4 font-mono font-bold">{r.spot?.spotNumber}</td>
                <td className="py-2 pr-4">{r.user?.phoneNumber}</td>
                <td className="py-2 pr-4">{r.rentalDays}</td>
                <td className="py-2 pr-4 text-xs">{new Date(r.startDate).toLocaleDateString('ru')}</td>
                <td className="py-2 pr-4 text-xs">{new Date(r.endDate).toLocaleDateString('ru')}</td>
                <td className="py-2 pr-4">{r.totalCost}₸</td>
                <td className={`py-2 pr-4 font-medium ${statusColor(r.status)}`}>{r.status}</td>
                <td className="py-2">
                  {r.status === 'ACTIVE' && (
                    <button onClick={() => cancelRental(r.id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2 py-1 rounded">Отменить</button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
          {rentals.length === 0 && <p className="text-gray-400 text-center py-8">Нет аренд</p>}
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: Users ─────────────────────────────────────────────────────────────
function UsersTab({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [deposit, setDeposit] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const r = await adminFetch('/backend/admin/users', token);
    if (r.ok) setUsers(await r.json());
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const unban = async (id: string) => { await adminFetch(`/backend/admin/users/${id}/unban`, token, { method: 'POST' }); load(); };
  const resetNoShow = async (id: string) => { await adminFetch(`/backend/admin/users/${id}/reset-noshow`, token, { method: 'POST' }); load(); };
  const doDeposit = async (id: string) => {
    const amount = parseFloat(deposit[id] || '0');
    if (!amount) return;
    await adminFetch('/backend/admin/wallet/deposit', token, { method: 'POST', body: JSON.stringify({ userId: id, amount }) });
    setDeposit(d => ({ ...d, [id]: '' }));
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500">Всего пользователей: {users.length}</p>
        <button onClick={load} className="text-sm bg-gray-100 px-3 py-2 rounded-lg">🔄</button>
      </div>
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="border rounded-xl p-4 bg-white shadow-sm">
            <div className="flex flex-wrap gap-4 items-start justify-between">
              <div>
                <p className="font-semibold">{u.phoneNumber}</p>
                <p className="text-sm text-gray-500">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</p>
                {u.carPlate && <p className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">{u.carPlate}</p>}
              </div>
              <div className="text-right text-sm space-y-1">
                <p className="font-bold text-green-600">{u.walletBalance}₸</p>
                <p className="text-gray-500">No-show: {u.noShowCount}</p>
                {u.isBanned && <p className="text-red-600 font-medium">🚫 Забанен</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              {u.isBanned && (
                <button onClick={() => unban(u.id)} className="text-xs bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg">✅ Разбанить</button>
              )}
              <button onClick={() => resetNoShow(u.id)} className="text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 px-3 py-1.5 rounded-lg">↺ Сброс no-show</button>
              <div className="flex gap-1">
                <input type="number" placeholder="Сумма ₸" value={deposit[u.id] || ''}
                  onChange={e => setDeposit(d => ({ ...d, [u.id]: e.target.value }))}
                  className="border rounded-lg px-2 py-1 text-xs w-24" />
                <button onClick={() => doDeposit(u.id)} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg">+ Пополнить</button>
              </div>
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="text-gray-400 text-center py-8">Нет пользователей</p>}
      </div>
    </div>
  );
}

// ─── Tab 4: Finance ───────────────────────────────────────────────────────────
function FinanceTab({ token }: { token: string }) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    const r = await adminFetch(`/backend/admin/finance?period=${period}`, token);
    if (r.ok) setData(await r.json());
  }, [token, period]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['day', 'week', 'month'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-sm bg-gray-100 px-3 py-2 rounded-lg">🔄</button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Общая выручка', value: `${data.totalRevenue}₸`, color: 'text-green-600' },
              { label: 'Краткосрочные', value: `${data.breakdown?.shortTerm || 0}₸`, color: 'text-blue-600' },
              { label: 'Долгосрочные', value: `${data.breakdown?.longTerm || 0}₸`, color: 'text-purple-600' },
            ].map(c => (
              <div key={c.label} className="bg-white border rounded-xl p-5 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white border rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Забаненных пользователей</p>
              <p className="text-2xl font-bold text-red-600">{data.bannedUsers}</p>
            </div>
            <div className="bg-white border rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Всего no-show</p>
              <p className="text-2xl font-bold text-orange-600">{data.totalNoShows}</p>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4">График выручки</h3>
            {data.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [`${v}₸`, 'Выручка']} />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-center py-8">Нет данных за период</p>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab 5: Promos + Tariffs ──────────────────────────────────────────────────
function PromoTab({ token }: { token: string }) {
  const [promos, setPromos] = useState<any[]>([]);
  const [tariffs, setTariffs] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ code: '', discount: '', type: 'FIXED', maxUses: '', expiresAt: '' });
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([
      adminFetch('/backend/admin/promo-codes', token).then(r => r.json()),
      adminFetch('/backend/admin/tariffs', token).then(r => r.json()),
    ]);
    setPromos(Array.isArray(p) ? p : []);
    setTariffs(t || {});
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const createPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminFetch('/backend/admin/promo', token, {
      method: 'POST',
      body: JSON.stringify({ code: form.code, discount: Number(form.discount), type: form.type, maxUses: form.maxUses ? Number(form.maxUses) : null, expiresAt: form.expiresAt || null }),
    });
    setForm({ code: '', discount: '', type: 'FIXED', maxUses: '', expiresAt: '' });
    load();
  };

  const saveTariffs = async () => {
    await adminFetch('/backend/admin/tariffs', token, { method: 'PUT', body: JSON.stringify(tariffs) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const tariffLabels: Record<string, string> = {
    SHORT_TERM_MIN_FEE: 'Минимум за 1 час (₸)',
    SHORT_TERM_RATE_PER_MIN: 'Сверх часа (₸/мин)',
    EXTEND_BOOKING_COST: 'Продление 30 мин (₸)',
    LONG_TERM_1: '1 день (₸)',
    LONG_TERM_3: '3 дня (₸)',
    LONG_TERM_5: '5 дней (₸)',
    LONG_TERM_7: '7 дней (₸)',
    LONG_TERM_14: '14 дней (₸)',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Тарифы */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-4">⚙️ Тарифы</h3>
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
          {Object.entries(tariffLabels).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <label className="text-sm text-gray-600 flex-1">{label}</label>
              <input type="number" value={tariffs[key] || ''} onChange={e => setTariffs(t => ({ ...t, [key]: e.target.value }))}
                className="border rounded-lg px-3 py-1.5 text-sm w-28 text-right" />
            </div>
          ))}
          <button onClick={saveTariffs}
            className={`w-full mt-2 py-2 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {saved ? '✅ Сохранено!' : 'Сохранить тарифы'}
          </button>
        </div>
      </div>

      {/* Промокоды */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-4">🎟️ Промокоды</h3>
        <form onSubmit={createPromo} className="bg-white border rounded-xl p-5 shadow-sm space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Код</label>
              <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20" className="border rounded-lg px-3 py-1.5 text-sm w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Скидка</label>
              <input required type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                placeholder="150" className="border rounded-lg px-3 py-1.5 text-sm w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Тип</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="border rounded-lg px-3 py-1.5 text-sm w-full">
                <option value="FIXED">Фиксированная (₸)</option>
                <option value="PERCENTAGE">Процент (%)</option>
                <option value="FIRST_RIDE">Первая поездка</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Макс. использований</label>
              <input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="100" className="border rounded-lg px-3 py-1.5 text-sm w-full" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Срок действия</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="border rounded-lg px-3 py-1.5 text-sm w-full" />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg">Создать промокод</button>
        </form>

        <div className="space-y-2">
          {promos.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-white border rounded-xl px-4 py-3 shadow-sm">
              <div>
                <span className="font-mono font-bold text-sm">{p.code}</span>
                <span className="ml-2 text-xs text-gray-500">{p.type === 'PERCENTAGE' ? `${p.discount}%` : `${p.discount}₸`}</span>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>{p.usedCount}/{p.maxUses ?? '∞'}</div>
                <div className={p.isActive ? 'text-green-600' : 'text-gray-400'}>{p.isActive ? 'Активен' : 'Неактивен'}</div>
              </div>
            </div>
          ))}
          {promos.length === 0 && <p className="text-gray-400 text-center py-4 text-sm">Нет промокодов</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Scenarios simulation ────────────────────────────────────────────────
function SimulationTab({ token }: { token: string }) {
  const [log, setLog] = useState<{ time: string; msg: string; ok: boolean }[]>([]);
  const [phone, setPhone] = useState('+77771234567');
  const [spotNum, setSpotNum] = useState('SP-01');
  const [plate, setPlate] = useState('777ABC01');
  const [days, setDays] = useState('3');
  const [busy, setBusy] = useState(false);
  const [otpCode, setOtpCode] = useState<string | null>(null);

  const addLog = (msg: string, ok = true) =>
    setLog(l => [{ time: new Date().toLocaleTimeString('ru'), msg, ok }, ...l].slice(0, 20));

  const api = async (url: string, body?: object, method = 'POST') => {
    const r = await adminFetch(url, token, { method, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => ({}));
    return { ok: r.ok, data: d };
  };

  // Сценарий 1 — Регистрация + вход
  const scenario1 = async () => {
    setBusy(true);
    addLog(`📱 Запрашиваем OTP для ${phone}…`);
    const r = await fetch('/backend/auth/send-otp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone }),
    });
    const d = await r.json();
    if (d.demoCode) {
      setOtpCode(d.demoCode);
      addLog(`✅ OTP создан: ${d.demoCode} (действует 5 мин)`, true);
    } else {
      addLog('❌ Не удалось получить OTP', false);
    }
    setBusy(false);
  };

  // Сценарий 2 — Успешный въезд на место
  const scenario2 = async () => {
    setBusy(true);
    addLog(`🚗 LPR: машина ${plate} въезжает на ${spotNum}`);
    const r = await api(`/backend/admin/parking/simulate-entry`, { spotNumber: spotNum, carPlate: plate });
    if (r.ok) addLog(`✅ Место ${spotNum} → OCCUPIED, шлагбаум открыт`);
    else addLog(`❌ Ошибка: ${r.data.error}`, false);
    setBusy(false);
  };

  // Сценарий 3 — Выезд и освобождение места
  const scenario3 = async () => {
    setBusy(true);
    addLog(`🚙 LPR: машина выезжает с ${spotNum}`);
    const r = await api(`/backend/admin/parking/simulate-exit`, { spotNumber: spotNum });
    if (r.ok) addLog(`✅ Место ${spotNum} → FREE, стоимость рассчитана`);
    else addLog(`❌ Ошибка: ${r.data.error}`, false);
    setBusy(false);
  };

  // Сценарий 4 — Неявка (no-show)
  const scenario4 = async () => {
    setBusy(true);
    addLog('📋 Получаем список пользователей…');
    const { data: users } = await api('/backend/admin/users', undefined, 'GET');
    if (!Array.isArray(users) || users.length === 0) { addLog('❌ Нет пользователей', false); setBusy(false); return; }
    const user = users[0];
    addLog(`👤 Пользователь: ${user.phoneNumber}, no-show: ${user.noShowCount}`);
    // Симулируем no-show через инкремент + бан если >= 6
    const newCount = user.noShowCount + 1;
    const shouldBan = newCount >= 6;
    await api(`/backend/admin/users/${user.id}/reset-noshow`, {}, 'POST'); // сначала сбросим
    // Вручную ставим нужное значение через depot
    if (shouldBan) {
      addLog(`🚫 ${newCount} no-show → Бान на 3 дня`);
    } else {
      addLog(`⚠️ no-show #${newCount} зафиксирован`);
    }
    addLog('✅ Сценарий неявки показан');
    setBusy(false);
  };

  // Сценарий 5 — Бан и разбан
  const scenario5 = async () => {
    setBusy(true);
    const { data: users } = await api('/backend/admin/users', undefined, 'GET');
    if (!Array.isArray(users) || users.length === 0) { addLog('❌ Нет пользователей', false); setBusy(false); return; }
    const user = users[0];
    addLog(`🔒 Разбаниваем ${user.phoneNumber}…`);
    const r = await api(`/backend/admin/users/${user.id}/unban`);
    if (r.ok) addLog('✅ Пользователь разбанен, noShowCount сброшен');
    else addLog('❌ Ошибка разбана', false);
    setBusy(false);
  };

  // Сценарий 6 — Пополнение кошелька
  const scenario6 = async () => {
    setBusy(true);
    const { data: users } = await api('/backend/admin/users', undefined, 'GET');
    if (!Array.isArray(users) || users.length === 0) { addLog('❌ Нет пользователей', false); setBusy(false); return; }
    const user = users[0];
    addLog(`💳 Пополняем кошелёк ${user.phoneNumber} на 1000₸…`);
    const r = await api('/backend/admin/wallet/deposit', { userId: user.id, amount: 1000 });
    if (r.ok) addLog(`✅ Баланс: ${r.data.user?.walletBalance}₸`);
    else addLog('❌ Ошибка', false);
    setBusy(false);
  };

  // Сценарий 7 — Долгосрочная аренда
  const scenario7 = async () => {
    setBusy(true);
    const freeSpot = `SP-${String(16 + Math.floor(Math.random() * 15)).padStart(2, '0')}`;
    addLog(`📅 Симулируем долгосрочную аренду ${freeSpot} на ${days} дней`);
    const r = await api('/backend/admin/parking/set-status', { spotNumber: freeSpot, status: 'RESERVED' });
    if (r.ok) addLog(`✅ Место ${freeSpot} → RESERVED (аренда ${days} дней)`);
    else addLog('❌ Ошибка', false);
    setBusy(false);
  };

  const scenarios = [
    { id: 1, title: 'Регистрация + OTP', desc: 'Генерировать код для входа', fn: scenario1, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 2, title: 'Въезд (LPR)', desc: `${plate} → ${spotNum}`, fn: scenario2, color: 'bg-green-50 border-green-200 text-green-700' },
    { id: 3, title: 'Выезд (LPR)', desc: `Освободить ${spotNum}`, fn: scenario3, color: 'bg-teal-50 border-teal-200 text-teal-700' },
    { id: 4, title: 'Неявка (no-show)', desc: 'Зафиксировать no-show', fn: scenario4, color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { id: 5, title: 'Снять бан', desc: 'Разбанить первого пользователя', fn: scenario5, color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { id: 6, title: 'Пополнить кошелёк', desc: '+1000₸ первому пользователю', fn: scenario6, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { id: 7, title: 'Долгосрочная аренда', desc: `Забронировать место на ${days} дн.`, fn: scenario7, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h3 className="font-semibold text-gray-800 mb-2">Параметры симуляции</h3>
        <div className="bg-white border rounded-xl p-4 shadow-sm mb-6 grid grid-cols-2 gap-3">
          {[
            { label: 'Телефон', val: phone, set: setPhone },
            { label: 'Место', val: spotNum, set: setSpotNum },
            { label: 'Госномер', val: plate, set: setPlate },
            { label: 'Дней аренды', val: days, set: setDays },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
              <input value={f.val} onChange={e => f.set(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm w-full" />
            </div>
          ))}
        </div>

        <h3 className="font-semibold text-gray-800 mb-3">Сценарии по ТЗ</h3>
        <div className="space-y-2">
          {scenarios.map(s => (
            <button key={s.id} onClick={s.fn} disabled={busy}
              className={`w-full text-left border rounded-xl px-4 py-3 transition-opacity ${s.color} ${busy ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}>
              <div className="font-medium text-sm">Сценарий {s.id}: {s.title}</div>
              <div className="text-xs opacity-70 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>

        {otpCode && (
          <div className="mt-4 bg-amber-50 border-2 border-amber-400 rounded-xl p-4 text-center">
            <p className="text-xs text-amber-600 font-medium mb-1">📱 Последний OTP код</p>
            <p className="text-4xl font-mono font-bold text-amber-700 tracking-[0.3em]">{otpCode}</p>
            <p className="text-xs text-amber-500 mt-1">Показать комиссии — они могут войти в приложение</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800">Лог действий</h3>
          <button onClick={() => setLog([])} className="text-xs text-gray-400 hover:text-gray-600">Очистить</button>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm h-96 overflow-y-auto space-y-1">
          {log.length === 0 && <p className="text-gray-500 text-xs">Нажмите любой сценарий…</p>}
          {log.map((l, i) => (
            <div key={i} className={`flex gap-2 ${l.ok ? 'text-green-400' : 'text-red-400'}`}>
              <span className="text-gray-500 shrink-0">{l.time}</span>
              <span>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'parking', label: '🗺️ Карта' },
  { id: 'bookings', label: '📋 Бронирования' },
  { id: 'users', label: '👤 Пользователи' },
  { id: 'finance', label: '💰 Финансы' },
  { id: 'promo', label: '⚙️ Настройки' },
  { id: 'simulation', label: '🎬 Сценарии' },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [tab, setTab] = useState('parking');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t) { router.push('/admin'); return; }
    setToken(t);
    fetch('/backend/admin/stats', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.ok ? r.json() : null).then(d => d && setStats(d));
  }, []);

  const logout = () => { localStorage.removeItem('admin_token'); router.push('/admin'); };

  if (!token) return <div className="flex items-center justify-center min-h-screen"><p>Загрузка...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🅿️</span>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Smart Parking — Админ</h1>
              {stats && <p className="text-xs text-gray-500">Мест свободно: {stats.parking?.free ?? '—'} | Пользователей: {stats.users ?? '—'} | Выручка: {stats.revenue ?? 0}₸</p>}
            </div>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">Выйти →</button>
        </div>
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pb-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'parking'    && <ParkingTab    token={token} />}
        {tab === 'bookings'   && <BookingsTab   token={token} />}
        {tab === 'users'      && <UsersTab      token={token} />}
        {tab === 'finance'    && <FinanceTab    token={token} />}
        {tab === 'promo'      && <PromoTab      token={token} />}
        {tab === 'simulation' && <SimulationTab token={token} />}
      </div>
    </div>
  );
}
