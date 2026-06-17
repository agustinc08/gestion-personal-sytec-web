import React from 'react';
import { Employee } from '../types';
import { Users, Shield, User, ArrowLeftRight } from 'lucide-react';

interface RoleSelectorProps {
  currentRole: 'admin' | 'employee';
  currentEmployee: Employee | null;
  employees: Employee[];
  onChangeRole: (role: 'admin' | 'employee', employeeId?: string) => void;
}

export default function RoleSelector({
  currentRole,
  currentEmployee,
  employees,
  onChangeRole,
}: RoleSelectorProps) {
  return (
    <div className="bg-slate-900 text-white p-3 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 shadow-md">
      <div className="flex items-center gap-2.5">
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-inner">
          <ArrowLeftRight className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-black tracking-tight flex items-center gap-1">
            Simulador de Roles Interactivos 
            <span className="bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ml-1 animate-pulse">
              Persistente
            </span>
          </h1>
          <p className="text-[10px] text-slate-400">Selecciona un rol para testear el flujo de asistencia y proyectos instantáneamente.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Selector de Administrador */}
        <button
          onClick={() => onChangeRole('admin')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            currentRole === 'admin'
              ? 'bg-red-600 text-white shadow-md ring-2 ring-red-300'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Vista Directiva (Julieta Borgna)
        </button>

        {/* Separador */}
        <span className="text-slate-600 text-xs hidden sm:inline">|</span>

        {/* Desplegable de Empleados */}
        <div className="flex items-center gap-2.5 bg-slate-850 p-1.5 rounded-xl border border-slate-750">
          <span className="text-[10px] uppercase font-bold text-slate-400 pl-1">Ver como Empleado:</span>
          <select
            value={currentRole === 'employee' && currentEmployee ? currentEmployee.id : ''}
            onChange={(e) => {
              if (e.target.value) {
                onChangeRole('employee', e.target.value);
              }
            }}
            className="bg-slate-800 text-white text-xs font-semibold px-2 py-1 rounded focus:outline-none border-none cursor-pointer"
          >
            <option value="" disabled={currentRole === 'employee'}>-- Elegir Empleado --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.dependency.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
