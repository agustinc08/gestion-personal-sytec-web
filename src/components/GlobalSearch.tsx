import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchApi } from '../api/v2.api';

const groupLabels: Record<string, string> = {
  employees: 'Empleados',
  projects: 'Proyectos',
  licenses: 'Licencias',
  dependencies: 'Dependencias',
  workLogs: 'Parte diario',
  comments: 'Comentarios',
};

export default function GlobalSearch() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setData({});
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        setData(await searchApi.search(q));
      } catch {
        setData({});
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const groups = useMemo(() => Object.entries(data).filter(([, rows]) => rows?.length), [data]);

  return (
    <div className="relative w-full max-w-sm text-slate-900">
      <div className="flex items-center rounded-xl bg-white px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Buscar en todo el sistema..." className="min-w-0 flex-1 border-0 px-2 text-xs outline-none" />
        {q && <button type="button" onClick={() => setQ('')} aria-label="Limpiar búsqueda"><X className="h-4 w-4" /></button>}
      </div>
      {q.length >= 2 && (
        <div className="absolute right-0 top-11 z-50 max-h-[28rem] w-full min-w-[22rem] overflow-auto rounded-2xl border bg-white p-3 shadow-2xl">
          {loading ? <p className="p-4 text-center text-xs">Buscando...</p> : groups.length ? groups.map(([group, rows]) => (
            <section key={group} className="mb-3">
              <h4 className="mb-1 text-[10px] font-black uppercase text-slate-400">{groupLabels[group] || group}</h4>
              {rows.map((row, index) => (
                <a key={`${group}-${index}`} href={row.link} onClick={() => setQ('')} className="block rounded-xl p-2 hover:bg-slate-50">
                  <strong className="block text-xs">{row.title}</strong>
                  <span className="block truncate text-[10px] text-slate-500">{row.subtitle}</span>
                </a>
              ))}
            </section>
          )) : <p className="p-5 text-center text-xs text-slate-400">No hay resultados para la búsqueda.</p>}
        </div>
      )}
    </div>
  );
}
