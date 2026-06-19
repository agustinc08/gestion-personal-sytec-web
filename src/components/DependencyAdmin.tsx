import React, { FormEvent, useState } from 'react';
import { Building2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Dependency } from '../types';

interface Props {
  dependencies: Dependency[];
  onCreate: (payload: Partial<Dependency> & { name: string }) => Promise<void>;
  onUpdate: (id: string, payload: Partial<Dependency>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function DependencyAdmin({ dependencies, onCreate, onUpdate, onRemove }: Props) {
  const [editing, setEditing] = useState<Dependency | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const reset = () => { setEditing(null); setName(''); setDescription(''); setIsActive(true); };
  const edit = (row: Dependency) => { setEditing(row); setName(row.name); setDescription(row.description || ''); setIsActive(row.isActive); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage('');
    try {
      if (editing) await onUpdate(editing.id, { name: name.trim(), description: description.trim(), isActive });
      else await onCreate({ name: name.trim(), description: description.trim(), isActive });
      setMessage(editing ? 'Dependencia actualizada correctamente' : 'Dependencia creada correctamente'); reset();
    } catch (error: any) { setMessage(error?.response?.data?.message || 'No se pudo guardar la dependencia'); }
    finally { setSaving(false); }
  };
  const remove = async (row: Dependency) => {
    if (!window.confirm(`¿Seguro que querés desactivar la dependencia ${row.name}?`)) return;
    try { await onRemove(row.id); setMessage('Dependencia desactivada correctamente'); } catch { setMessage('No se pudo desactivar la dependencia'); }
  };
  return <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
    <section className="xl:col-span-5 rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-2 text-lg font-bold"><Building2 className="h-5 w-5 text-indigo-600" /> {editing ? 'Editar dependencia' : 'Nueva dependencia'}</h3>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-xs font-bold">Nombre<input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required className="mt-1 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
        <label className="block text-xs font-bold">Descripción<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} className="mt-1 w-full rounded-xl border px-3 py-2.5 font-normal" /></label>
        <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} /> Activa</label>
        <div className="flex gap-2"><button disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Guardar</button>{editing && <button type="button" onClick={reset} className="flex items-center gap-2 rounded-xl border px-4 text-xs font-bold"><X className="h-4 w-4" /> Cancelar</button>}</div>
        {message && <p className="rounded-xl bg-slate-50 p-3 text-xs font-semibold">{message}</p>}
      </form>
    </section>
    <section className="xl:col-span-7 rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold">Listado de dependencias</h3>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-slate-500"><th className="p-3">Nombre</th><th className="p-3">Descripción</th><th className="p-3">Estado</th><th className="p-3">Empleados</th><th className="p-3">Acciones</th></tr></thead><tbody>{dependencies.map((row) => <tr key={row.id} className="border-b"><td className="p-3 font-bold">{row.name}</td><td className="p-3 text-slate-500">{row.description || '-'}</td><td className="p-3"><span className={`rounded-full px-2 py-1 font-bold ${row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{row.isActive ? 'Activa' : 'Inactiva'}</span></td><td className="p-3 font-mono">{row.employeeCount || 0}</td><td className="p-3"><div className="flex gap-2"><button onClick={() => edit(row)} title="Editar" className="rounded-lg border p-2 text-indigo-700"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(row)} title="Desactivar" className="rounded-lg border p-2 text-rose-700"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table>{dependencies.length === 0 && <p className="py-8 text-center text-slate-400">Sin dependencias registradas</p>}</div>
    </section>
  </div>;
}
