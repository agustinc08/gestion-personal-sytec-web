import React, { useState } from 'react';
import { AlertCircle, CreditCard, HelpCircle, KeyRound, Shield, UserCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (cuil: string, password: string) => Promise<any>;
  loadError?: string | null;
  setLoadError?: (message: string | null) => void;
}

export default function LoginScreen({ onLogin, loadError, setLoadError }: LoginScreenProps) {
  const [cuil, setCuil] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(loadError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const formatCuil = (val: string) => {
    const cleanNum = val.replace(/\D/g, '');
    let formatted = '';
    if (cleanNum.length > 0) formatted += cleanNum.substring(0, 2);
    if (cleanNum.length > 2) formatted += '-' + cleanNum.substring(2, 10);
    if (cleanNum.length > 10) formatted += '-' + cleanNum.substring(10, 11);
    return formatted.substring(0, 13);
  };

  const executeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoadError?.(null);
    setSuccessMsg(null);
    if (!cuil || !password) {
      setErrorMsg('Por favor, ingresa tu CUIL y contrasena.');
      return;
    }
    try {
      setSubmitting(true);
      const user = await onLogin(cuil, password);
      setSuccessMsg(`Bienvenido/a, ${user.email || user.cuil || 'usuario'}`);
    } catch (error: any) {
      const status = error?.response?.status;
      const code = error?.code;
      if (status === 401) {
        setErrorMsg('CUIL o contraseña incorrectos.');
      } else if (status === 403) {
        setErrorMsg('No tenés permisos para ingresar.');
      } else if (status >= 500) {
        setErrorMsg('Error interno del servidor. Intentá nuevamente o avisá al administrador.');
      } else if (code === 'ERR_NETWORK' || error?.message === 'Network Error') {
        setErrorMsg('No se pudo conectar con el servidor. Verificá que la API esté levantada.');
      } else {
        setErrorMsg(error?.response?.data?.message || 'No se pudo iniciar sesión.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-slate-950 p-4 rounded-3xl text-white shadow-xl ring-4 ring-slate-100">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black text-slate-900 tracking-tight">AREA DE DESARROLLO</h2>
        <p className="mt-1 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
          Oficina de Sistemas y Tecnologia (SyTec)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200/80 shadow-lg space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse">
              <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={executeLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> CUIL del Agente
              </label>
              <input
                type="text"
                placeholder="Ej. 20-41111111-9"
                value={cuil}
                onChange={(e) => setCuil(formatCuil(e.target.value))}
                className="w-full text-sm font-semibold border border-slate-300 rounded-2xl px-4 py-3 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Contraseña
              </label>
              <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-300 rounded-2xl px-4 py-3 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full cursor-pointer bg-slate-950 hover:bg-red-600 disabled:bg-slate-400 text-white font-bold text-xs py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-slate-700 text-xs space-y-2">
          <p className="font-bold text-amber-800 flex items-center gap-1.5 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-amber-700" /> Aviso Importante para Agentes PJN:
          </p>
          <p className="text-[10px] leading-relaxed text-slate-650">
            La validacion de acceso se realiza contra la API segura. Si tu clave fue blanqueada, la administracion debe informarte la clave temporal.
          </p>
          <div className="pt-2 text-center border-t border-slate-205/65 mt-1">
            <p className="text-[9px] text-slate-400 italic">Area de Desarrollo Judicial - Tecnologia y Sistemas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
