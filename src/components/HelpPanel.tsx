import React from 'react';
import { X } from 'lucide-react';
const sections = [
  ['Cómo cargar parte diario', 'Ingresá a Parte Diario, completá tarea, descripción, modalidad y proyecto, y guardá.'],
  ['Cómo editar parte diario', 'Usá Editar en el historial o Editar parte de hoy. Guardá los cambios o cancelá la edición.'],
  ['Cómo pedir licencia', 'Abrí Licencias, elegí artículo, fechas y motivo. Luego consultá su estado en la misma pantalla.'],
  ['Cómo crear y comentar proyectos', 'ADMIN crea proyectos. Los agentes asignados pueden abrir el detalle, registrar avances y comentarios internos.'],
  ['Tecnologías y estadísticas', 'El stack actual se informa en cada proyecto y puede consultarse en estadísticas y exportaciones.'],
  ['Dependencias', 'ADMIN administra áreas y asigna empleados. Cada agente ve su dependencia en Mi Perfil.'],
  ['Notificaciones', 'La campana muestra recordatorios; podés marcar una o todas como leídas.'],
  ['Exportar reportes', 'ADMIN abre Panel V2 > Exportaciones y descarga el archivo Excel requerido.'],
];
export default function HelpPanel({ onClose }: { onClose: () => void }) { return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Manual de uso</h2><p className="text-xs text-slate-500">Guía rápida para ADMIN y EMPLOYEE</p></div><button onClick={onClose}><X /></button></div><div className="mt-6 grid gap-3 md:grid-cols-2">{sections.map(([title, detail]) => <article key={title} className="rounded-2xl border bg-slate-50 p-4"><h3 className="text-sm font-bold">{title}</h3><p className="mt-2 text-xs leading-relaxed text-slate-600">{detail}</p></article>)}</div></div></div>; }
