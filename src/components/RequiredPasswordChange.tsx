import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';

export default function RequiredPasswordChange({ onChange, onLogout }: { onChange: (current: string, next: string) => Promise<void>; onLogout: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError('La nueva contraseña debe tener al menos 8 caracteres.'); return; }
    setSaving(true);
    try { await onChange(currentPassword, newPassword); }
    catch (cause: any) { setError(cause?.response?.data?.message || 'No se pudo cambiar la contraseña. Verificá la contraseña actual e intentá nuevamente.'); }
    finally { setSaving(false); }
  };
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
    <form onSubmit={submit} className="mx-auto max-w-md space-y-5 rounded-xl border bg-white p-6 shadow-sm" aria-labelledby="required-password-title">
      <div className="flex items-center gap-3"><KeyRound className="h-6 w-6 text-indigo-700" /><div><h1 id="required-password-title" className="text-lg font-bold">Actualizá tu contraseña</h1><p className="text-sm text-slate-600">Para continuar, reemplazá la contraseña temporal.</p></div></div>
      <label className="block text-sm font-medium">Contraseña actual<input autoComplete="current-password" type="password" required value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm font-medium">Nueva contraseña<input autoComplete="new-password" type="password" minLength={8} required value={newPassword} onChange={event => setNewPassword(event.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label>
      {error && <p role="alert" className="text-sm text-rose-700">{Array.isArray(error) ? error.join(' ') : error}</p>}
      <div className="flex gap-3"><button disabled={saving} className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Guardando...' : 'Cambiar contraseña'}</button><button type="button" onClick={onLogout} className="rounded-lg border px-4 py-3 text-sm font-semibold">Cerrar sesión</button></div>
    </form>
  </main>;
}
