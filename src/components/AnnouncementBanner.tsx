import React from 'react';
import { Announcement } from '../types';
import { announcementsApi } from '../api/announcements.api';
const colors: Record<string, string> = { URGENT: 'border-rose-300 bg-rose-50 text-rose-950', HIGH: 'border-amber-300 bg-amber-50 text-amber-950', NORMAL: 'border-indigo-200 bg-indigo-50 text-indigo-950', LOW: 'border-slate-200 bg-slate-50 text-slate-800' };
export default function AnnouncementBanner({ items, onRefresh }: { items: Announcement[]; onRefresh: () => void }) {
  if (!items.length) return null;
  return <section className="mb-6 space-y-3">{items.map((item) => <article key={item.id} className={`rounded-2xl border p-4 shadow-sm ${colors[item.priority]}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><strong>{item.title}</strong>{item.pinned && <span className="rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-black uppercase">Fijado</span>}<span className="text-[9px] font-black uppercase">{item.priority === 'URGENT' ? 'Urgente' : item.priority === 'HIGH' ? 'Alta' : item.priority === 'LOW' ? 'Baja' : 'Normal'}</span></div><p className="mt-2 whitespace-pre-wrap text-sm">{item.message}</p>{item.endsAt && <p className="mt-2 text-[10px] opacity-70">Visible hasta: {new Date(item.endsAt).toLocaleString('es-AR')}</p>}</div>{!item.readAt && <button onClick={() => announcementsApi.read(item.id).then(onRefresh)} className="rounded-xl border bg-white/70 px-3 py-2 text-xs font-bold">Marcar leído</button>}</div></article>)}</section>;
}
