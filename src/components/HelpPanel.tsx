import React from 'react';
import { X } from 'lucide-react';
import { APP_NAME, APP_UPDATED_AT, APP_VERSION } from '../config/app';

const sections = [
  ['Cómo cargar parte diario', 'Ingresá a Parte Diario, completá tarea, descripción, modalidad y proyecto, y guardá.'],
  ['Cómo editar parte diario', 'Usá Editar en el historial o Editar parte de hoy. Guardá los cambios o cancelá la edición.'],
  ['Cómo pedir licencia', 'Abrí Licencias, elegí artículo, fechas y motivo. Luego consultá su estado en la misma pantalla.'],
  ['Cómo crear y comentar proyectos', 'ADMIN crea proyectos. Los agentes asignados pueden abrir el detalle, registrar avances y comentarios internos.'],
  ['Tecnologías y estadísticas', 'El stack informado en cada proyecto puede consultarse en estadísticas y exportaciones.'],
  ['Dependencias', 'ADMIN administra áreas y asigna empleados. Cada agente ve su dependencia en Mi Perfil.'],
  ['Notificaciones y comunicados', 'La campana muestra recordatorios. Los comunicados dirigidos a tu rol, dependencia o usuario aparecen al ingresar.'],
  ['Exportar reportes', 'ADMIN abre Panel V2 > Exportaciones y descarga el archivo Excel requerido.'],
];

const changes = [
  'Dependencias y áreas administrables.',
  'Edición de perfil y del parte diario.',
  'Comentarios internos por proyecto.',
  'Notificaciones internas y recordatorios.',
  'Comunicados internos y compensatorios por guardia.',
  'Auditoría de acciones administrativas.',
  'Exportaciones Excel y dashboard ejecutivo ADMIN.',
  'Configuración del sistema y buscador global.',
  'Estadísticas por persona y tecnología.',
  'Mejoras de paginación, experiencia visual y permisos.',
];

export default function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">Manual de uso</h2>
            <p className="text-xs text-slate-500">Guía rápida para ADMIN y EMPLOYEE</p>
            <p className="mt-1 text-[10px] font-bold text-indigo-600">{APP_NAME} {APP_VERSION} · {APP_UPDATED_AT}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar ayuda" className="rounded-lg p-2 hover:bg-slate-100"><X /></button>
        </div>

        <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <h3 className="text-base font-black text-indigo-950">Novedades de la versión 2.0</h3>
          <p className="mt-2 text-xs leading-relaxed text-indigo-900">La versión 2.0 incorpora comunicados internos, auditoría administrativa, exportaciones, dashboard ejecutivo y mejoras de permisos para facilitar la gestión diaria de la Oficina de Sistemas y Tecnología.</p>
          <ul className="mt-4 grid list-inside list-disc gap-2 text-xs text-indigo-950 md:grid-cols-2">
            {changes.map((change) => <li key={change}>{change}</li>)}
          </ul>
        </section>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {sections.map(([title, detail]) => (
            <article key={title} className="rounded-2xl border bg-slate-50 p-4">
              <h3 className="text-sm font-bold">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{detail}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
