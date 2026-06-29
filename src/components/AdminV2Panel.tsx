import React, { useEffect, useState } from 'react';
import { Activity, Download, FileText, Gauge, RefreshCw, Settings, ShieldCheck } from 'lucide-react';
import { auditApi, dashboardV2Api, downloadExport, settingsApi } from '../api/v2.api';
import { activityTypeLabel } from '../utils/labels';

const appBasePath = () => {
  const configured = import.meta.env.VITE_BASE_PATH || import.meta.env.BASE_URL || '/';
  if (configured && configured !== '/') return configured.endsWith('/') ? configured : `${configured}/`;
  const firstPathSegment = window.location.pathname.split('/').filter(Boolean)[0];
  return firstPathSegment ? `/${firstPathSegment}/` : '/';
};

const openSection = (event: React.MouseEvent<HTMLAnchorElement>, section: string) => {
  event.preventDefault();
  window.history.pushState(null, '', `${appBasePath()}?seccion=${section}`);
  window.dispatchEvent(new CustomEvent('sytec:navigate', { detail: { section } }));
};

const moduleLabels: Record<string, string> = { AUTH: 'Acceso', PROJECTS: 'Proyectos', LICENSES: 'Licencias', WORK_LOGS: 'Parte diario', EMPLOYEES: 'Empleados', DEPENDENCIES: 'Dependencias', SETTINGS: 'Configuración' };
const splitTechStack = (value?: string) => (value || '').split(/[,;/|]+/).map((item) => item.trim()).filter(Boolean);
const workLogModeLabel: Record<string, string> = { ONSITE: 'Presencial', REMOTE: 'Remoto', MIXED: 'Mixto', LICENSE: 'Licencia', presencial: 'Presencial', remoto: 'Remoto', mixto: 'Mixto', licencia: 'Licencia' };
const formatWorkLogDate = (value?: string) => value ? new Date(value).toLocaleDateString('es-AR') : '';

export default function AdminV2Panel() {
  const [tab, setTab] = useState<'summary' | 'audit' | 'exports' | 'settings'>('summary');
  return <div className="space-y-5"><div className="flex flex-wrap gap-2">{[
    ['summary', 'Resumen ejecutivo', Gauge], ['audit', 'Auditoría', ShieldCheck], ['exports', 'Exportaciones', Download], ['settings', 'Configuración', Settings],
  ].map(([key, label, Icon]: any) => <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold ${tab === key ? 'bg-slate-900 text-white' : 'border bg-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</div>{tab === 'summary' && <ExecutiveSummary />}{tab === 'audit' && <AuditView />}{tab === 'exports' && <ExportsView />}{tab === 'settings' && <SettingsView />}</div>;
}

function ExecutiveSummary() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [showAllWorkLogs, setShowAllWorkLogs] = useState(false);
  const [expandedWorkLogs, setExpandedWorkLogs] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const load = (silent = false) => {
    if (!silent) {
      setRefreshing(true);
      setRefreshMessage('');
    }
    return dashboardV2Api.summary()
      .then((rows) => {
        setData(rows);
        setError('');
        if (!silent) setRefreshMessage('Datos actualizados');
      })
      .catch(() => setError('No se pudo cargar el resumen ejecutivo.'))
      .finally(() => {
        if (!silent) setRefreshing(false);
      });
  };
  useEffect(() => { load(); const onRefresh = () => load(true); window.addEventListener('sytec:refreshed', onRefresh); const intervalId = window.setInterval(() => load(true), 60000); return () => { window.removeEventListener('sytec:refreshed', onRefresh); window.clearInterval(intervalId); }; }, []);
  useEffect(() => { if (!refreshMessage) return; const timeoutId = window.setTimeout(() => setRefreshMessage(''), 2500); return () => window.clearTimeout(timeoutId); }, [refreshMessage]);
  if (error) return <Empty text={error} />; if (!data) return <Empty text="Cargando resumen..." />;
  const cards = [
    ['Empleados activos', data.employeesActive, 'empleados'], ['Dependencias activas', data.dependenciesActive, 'dependencias'], ['Partes cargados hoy', data.workLogsToday, 'parte-diario'], ['Partes pendientes hoy', data.workLogsPendingToday, 'parte-diario'], ['Licencias pendientes', data.pendingLicenses, 'licencias'], ['Licencias aprobadas este mes', data.approvedLicensesMonth, 'licencias'], ['Proyectos activos', data.activeProjects, 'proyectos'], ['Proyectos vencidos', data.overdueProjects, 'proyectos'], ['Proyectos proximos', data.upcomingProjects, 'proyectos'],
  ];
  const latestRows = data.latestWorkLogsByEmployee || [];
  const visibleLatestRows = showAllWorkLogs ? latestRows : latestRows.slice(0, 8);
  const toggleWorkLog = (key: string) => setExpandedWorkLogs((current) => ({ ...current, [key]: !current[key] }));
  return <div className="space-y-6">
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{cards.map(([label, value, link]) => <a key={label} href={`${appBasePath()}?seccion=${link}`} onClick={(event) => openSection(event, String(link))} className="rounded-2xl border bg-white p-4 shadow-sm hover:border-indigo-300"><span className="block text-[10px] font-black uppercase text-slate-400">{label}</span><strong className="mt-1 block text-2xl font-black">{value}</strong><span className="text-[10px] font-bold text-indigo-600">Ver detalle</span></a>)}</section>
    <section className="rounded-2xl border bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold">Ultimos partes diarios por empleado</h3>
          <p className="mt-1 text-xs text-slate-500">Lectura rapida del ultimo parte cargado por cada agente, sin entrar al proyecto.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {refreshMessage && <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{refreshMessage}</span>}
          <button type="button" onClick={() => load()} disabled={refreshing} className="self-start rounded-lg border px-3 py-1 text-[10px] font-bold text-slate-700 disabled:opacity-60"><RefreshCw className={`mr-1 inline h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />Actualizar</button>
          {latestRows.length > 8 && <button type="button" onClick={() => setShowAllWorkLogs((value) => !value)} className="self-start rounded-lg border px-3 py-1 text-[10px] font-bold text-slate-700">{showAllWorkLogs ? 'Ver menos' : 'Ver todos'}</button>}
        </div>
      </div>
      <div className={`mt-4 space-y-3 ${showAllWorkLogs ? 'max-h-[720px] overflow-y-auto pr-1' : ''}`}>
        {visibleLatestRows.map((row: any) => {
          const log = row.workLog;
          if (!log) {
            return <article key={row.employeeId} className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="font-black text-slate-900">{row.employeeName}</h4>
                  {row.dependency && <p className="text-[10px] font-semibold text-slate-500">{row.dependency}</p>}
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-slate-400">Sin parte diario cargado</span>
              </div>
            </article>;
          }
          const rowKey = `${row.employeeId}-${log.id || log.date}`;
          const description = String(log.description || '').trim();
          const isLong = description.length > 220;
          const isExpanded = Boolean(expandedWorkLogs[rowKey]);
          const visibleDescription = isLong && !isExpanded ? `${description.slice(0, 220).trim()}...` : description;
          const techs = splitTechStack(log.projectTechStack).slice(0, 4);
          const projectText = log.projectName || log.title || 'Sin proyecto vinculado';
          const attendance = log.attendance || row.attendance;
          const timeText = attendance?.entryTime || attendance?.exitTime
            ? `${attendance.entryTime || '--:--'} a ${attendance.exitTime || '--:--'}`
            : (log.entryTime || log.exitTime ? `${log.entryTime || '--:--'} a ${log.exitTime || '--:--'}` : '');
          return <article key={rowKey} className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h4 className="font-black text-slate-900">{row.employeeName}</h4>
                {row.dependency && <p className="text-[10px] font-semibold text-slate-500">{row.dependency}</p>}
              </div>
              {techs.length > 0 && <div className="flex max-w-md flex-wrap gap-1">{techs.map((tech: string) => <span key={tech} className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700">{tech}</span>)}</div>}
            </div>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-2"><dt className="text-[9px] font-black uppercase text-slate-400">Fecha</dt><dd className="font-bold text-slate-800">{formatWorkLogDate(log.date) || '-'}</dd></div>
              <div className="rounded-lg bg-slate-50 p-2"><dt className="text-[9px] font-black uppercase text-slate-400">Modalidad</dt><dd className="font-bold text-slate-800">{workLogModeLabel[log.mode] || log.mode || '-'}</dd></div>
              <div className="rounded-lg bg-slate-50 p-2"><dt className="text-[9px] font-black uppercase text-slate-400">Actividad</dt><dd className="font-bold text-slate-800">{activityTypeLabel(log.activityType) || '-'}</dd></div>
              <div className="rounded-lg bg-slate-50 p-2 sm:col-span-2"><dt className="text-[9px] font-black uppercase text-slate-400">Proyecto / titulo</dt><dd className="font-bold text-slate-800">{projectText}</dd></div>
              <div className="rounded-lg bg-slate-50 p-2"><dt className="text-[9px] font-black uppercase text-slate-400">Horas / horario</dt><dd className="font-bold text-slate-800">{log.hours !== undefined && log.hours !== null ? `${log.hours} h` : 'Sin horas'}{timeText ? ` · ${timeText}` : ''}</dd></div>
            </dl>
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase text-slate-500"><FileText className="h-3.5 w-3.5 text-indigo-600" />Descripcion</div>
              {description ? <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{visibleDescription}</p> : <p className="text-xs italic text-slate-400">Sin descripcion cargada.</p>}
              {isLong && <button type="button" onClick={() => toggleWorkLog(rowKey)} className="mt-2 rounded-lg border bg-white px-3 py-1 text-[10px] font-bold text-indigo-700">{isExpanded ? 'Contraer' : 'Ver detalle'}</button>}
            </div>
          </article>;
        })}
        {!visibleLatestRows.length && <p className="py-5 text-center text-xs text-slate-400">No hay empleados activos para mostrar.</p>}
      </div>
    </section>
    <div className="grid gap-5 lg:grid-cols-3"><section className="rounded-2xl border bg-white p-5"><h3 className="font-bold">Proxima guardia / paro</h3>{data.nextStrikeDuty ? <p className="mt-3 text-sm">{new Date(data.nextStrikeDuty.date).toLocaleDateString('es-AR')}<span className="block text-xs text-slate-500">{data.nextStrikeDuty.notes || 'Sin observaciones'}</span></p> : <p className="mt-3 text-xs text-slate-400">Sin proxima guardia configurada.</p>}</section><section className="rounded-2xl border bg-white p-5"><h3 className="font-bold">Tecnologias mas declaradas</h3><div className="mt-3 flex flex-wrap gap-2">{data.technologies?.map((row: any) => <span key={row.name} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{row.name} <b className="text-indigo-900">{row.count}</b></span>)}{!data.technologies?.length && <p className="text-xs text-slate-400">Sin stacks declarados.</p>}</div></section><section className="rounded-2xl border bg-white p-5"><h3 className="font-bold">Auditoria reciente</h3><div className="mt-3 space-y-2">{data.recentAudit?.map((row: any) => <div key={row.id} className="border-b pb-2 text-xs"><b>{row.title || row.action}</b><span className="block text-[10px] text-slate-400">{row.employeeName || 'Sistema'} · {moduleLabels[row.module] || row.module}</span></div>)}{!data.recentAudit?.length && <p className="text-xs text-slate-400">Sin acciones recientes.</p>}</div></section></div>
  </div>;
}
function AuditView() {
  const [filters, setFilters] = useState({ q: '', module: '', action: '', userId: '', employeeId: '', from: '', to: '', pageSize: 10 }); const [page, setPage] = useState(1); const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(false);
  const load = () => { setLoading(true); auditApi.all({ ...filters, page }).then(setData).finally(() => setLoading(false)); };
  useEffect(load, [page, filters.pageSize]);
  const update = (key: string, value: any) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  return <section className="rounded-2xl border bg-white p-5"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-indigo-600" /><h2 className="text-lg font-black">Auditoría administrativa</h2></div><div className="mt-4 grid gap-2 md:grid-cols-4"><input value={filters.q} onChange={(e) => update('q', e.target.value)} placeholder="Buscar texto..." className="rounded-xl border px-3 py-2 text-xs" /><select value={filters.module} onChange={(e) => update('module', e.target.value)} className="rounded-xl border px-3 py-2 text-xs"><option value="">Todos los módulos</option>{Object.entries(moduleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><input value={filters.action} onChange={(e) => update('action', e.target.value)} placeholder="Acción exacta" className="rounded-xl border px-3 py-2 text-xs" /><input value={filters.employeeId} onChange={(e) => update('employeeId', e.target.value)} placeholder="ID de empleado" className="rounded-xl border px-3 py-2 text-xs" /><input value={filters.userId} onChange={(e) => update('userId', e.target.value)} placeholder="ID de usuario" className="rounded-xl border px-3 py-2 text-xs" /><input type="date" value={filters.from} onChange={(e) => update('from', e.target.value)} className="rounded-xl border px-3 py-2 text-xs" /><input type="date" value={filters.to} onChange={(e) => update('to', e.target.value)} className="rounded-xl border px-3 py-2 text-xs" /><button onClick={load} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">Aplicar filtros</button><button onClick={() => { setFilters({ q: '', module: '', action: '', userId: '', employeeId: '', from: '', to: '', pageSize: 10 }); setPage(1); }} className="rounded-xl border px-4 py-2 text-xs font-bold">Limpiar filtros</button></div>{loading ? <Empty text="Cargando auditoría..." /> : data?.items?.length ? <><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-slate-400"><th className="p-2">Fecha</th><th className="p-2">Usuario</th><th className="p-2">Módulo</th><th className="p-2">Acción</th><th className="p-2">Detalle</th><th className="p-2">Entidad</th></tr></thead><tbody>{data.items.map((row: any) => <tr key={row.id} className="border-b"><td className="p-2 whitespace-nowrap">{new Date(row.createdAt).toLocaleString('es-AR')}</td><td className="p-2">{row.employee?.name || row.user?.cuil || 'Sistema'}</td><td className="p-2">{moduleLabels[row.module] || row.module}</td><td className="p-2 font-bold">{row.action}</td><td className="p-2">{row.detail || row.title || '-'}</td><td className="p-2 font-mono text-[10px]">{row.entityType || row.entity}{row.entityId ? ` · ${row.entityId}` : ''}</td></tr>)}</tbody></table></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs"><span>Mostrando {data.items.length} de {data.total}</span><div className="flex items-center gap-2"><select value={filters.pageSize} onChange={(e) => update('pageSize', Number(e.target.value))} className="rounded-lg border p-2">{[10,25,50].map((size) => <option key={size} value={size}>{size} por página</option>)}</select><button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Anterior</button><b>Página {page} de {data.totalPages}</b><button disabled={page === data.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Siguiente</button></div></div></> : <Empty text="No hay acciones para mostrar." />}</section>;
}

function ExportsView() {
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [loading, setLoading] = useState(''); const [message, setMessage] = useState('');
  const resources = [['employees','Empleados'],['licenses','Licencias'],['work-logs','Parte diario'],['projects','Proyectos'],['dependencies','Dependencias'],['technology-stats','Tecnologías / stacks'],['strike-duty','Guardias / paro'],['audit-logs','Auditoría']];
  const download = async (resource: string) => { setLoading(resource); setMessage(''); try { await downloadExport(resource, { from, to }); setMessage('Exportación generada correctamente.'); } catch { setMessage('No se pudo generar la exportación. Intentá nuevamente.'); } finally { setLoading(''); } };
  return <section className="rounded-2xl border bg-white p-5"><h2 className="text-lg font-black">Exportaciones Excel</h2><p className="text-xs text-slate-500">Los reportes excluyen contraseñas, hashes y tokens.</p><div className="mt-4 flex flex-wrap gap-2"><label className="text-xs">Desde<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-2 rounded-lg border p-2" /></label><label className="text-xs">Hasta<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-2 rounded-lg border p-2" /></label></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{resources.map(([resource,label]) => <button key={resource} onClick={() => download(resource)} disabled={!!loading} className="flex items-center justify-center gap-2 rounded-xl border bg-slate-50 p-4 text-xs font-bold hover:border-indigo-300"><FileText className="h-4 w-4 text-emerald-600" />{loading === resource ? 'Generando...' : `Exportar ${label}`}</button>)}</div>{message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs">{message}</p>}<p className="mt-4 text-[10px] text-slate-400">PDF queda pendiente; Excel es el formato principal de esta versión.</p></section>;
}

function SettingsView() {
  const [rows, setRows] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [message, setMessage] = useState('');
  useEffect(() => { settingsApi.all().then(setRows).finally(() => setLoading(false)); }, []);
  const save = async (row: any, raw: string | boolean) => { let value: any = raw; try { if (row.type === 'number') value = Number(raw); if (row.type === 'json') value = JSON.parse(String(raw)); await settingsApi.update(row.key, value); setRows(await settingsApi.all()); setMessage('Cambios guardados correctamente.'); } catch { setMessage('No se pudo guardar. Intentá nuevamente.'); } };
  if (loading) return <Empty text="Cargando configuración..." />;
  return <section className="rounded-2xl border bg-white p-5"><h2 className="text-lg font-black">Configuración del sistema</h2><div className="mt-5 grid gap-4 md:grid-cols-2">{rows.map((row) => <label key={row.key} className="rounded-xl border p-4 text-xs font-bold">{row.label}<span className="block text-[10px] font-normal text-slate-400">{row.description || row.key}</span>{row.type === 'boolean' ? <input type="checkbox" checked={Boolean(row.value)} onChange={(e) => save(row, e.target.checked)} className="mt-3" /> : <input defaultValue={row.type === 'json' ? JSON.stringify(row.value) : String(row.value)} onBlur={(e) => save(row, e.target.value)} className="mt-3 w-full rounded-lg border px-3 py-2 font-normal" />}</label>)}</div>{message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs">{message}</p>}</section>;
}

function Empty({ text }: { text: string }) { return <div className="my-5 rounded-2xl border border-dashed bg-slate-50 p-8 text-center text-xs text-slate-500">{text}</div>; }
