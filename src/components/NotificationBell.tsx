import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { notificationsApi, NotificationsResponse } from '../api/notifications.api';

export default function NotificationBell({ refreshKey }: { refreshKey?: string }) {
  const [data, setData] = useState<NotificationsResponse>({ items: [], unreadCount: 0 });
  const [open, setOpen] = useState(false);
  const load = () => notificationsApi.all().then(setData).catch(() => undefined);
  useEffect(() => { load(); }, [refreshKey]);
  useEffect(() => { window.addEventListener('focus', load); return () => window.removeEventListener('focus', load); }, []);

  const read = async (id: string) => { await notificationsApi.read(id); await load(); };
  const readAll = async () => { await notificationsApi.readAll(); await load(); };
  return (
    <div className="relative">
      <button type="button" aria-label="Notificaciones" onClick={() => { setOpen(!open); if (!open) load(); }} className="relative rounded-xl border border-slate-700 bg-slate-800 p-2.5 hover:bg-slate-700">
        <Bell className="h-4 w-4" />
        {data.unreadCount > 0 && <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{data.unreadCount > 99 ? '99+' : data.unreadCount}</span>}
      </button>
      {open && <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b p-4"><strong>Notificaciones</strong><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar"><X className="h-4 w-4" /></button></div>
        {data.items.length ? <><div className="max-h-96 overflow-y-auto">{data.items.map((item) => <button type="button" key={item.id} onClick={() => read(item.id)} className={`block w-full border-b p-4 text-left hover:bg-slate-50 ${item.readAt ? 'opacity-60' : 'bg-indigo-50/50'}`}><span className="block text-sm font-bold">{item.title}</span><span className="mt-1 block text-xs text-slate-600">{item.message}</span><span className="mt-2 block text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString('es-AR')}</span></button>)}</div><button type="button" onClick={readAll} className="flex w-full items-center justify-center gap-2 p-3 text-xs font-bold text-indigo-700"><CheckCheck className="h-4 w-4" /> Marcar todas como leídas</button></> : <p className="p-8 text-center text-sm text-slate-400">Sin notificaciones</p>}
      </div>}
    </div>
  );
}
