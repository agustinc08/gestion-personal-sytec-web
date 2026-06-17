import React, { useState, useRef } from 'react';
import { Employee, WorkLog, Project, LicenseRequest, LicenseRule, StrikeConfig } from '../types';
import { 
  Calendar, CheckCircle, FileText, User, Briefcase, Plus, Clock, 
  MapPin, ShieldAlert, Upload, Download, CheckCircle2, ChevronRight, AlertCircle, FileSpreadsheet,
  ArrowLeft, History, MessageSquare, Send
} from 'lucide-react';

interface EmployeeDashboardProps {
  employee: Employee;
  employees: Employee[];
  workLogs: WorkLog[];
  projects: Project[];
  licenseRequests: LicenseRequest[];
  licenseRules: LicenseRule[];
  strikeConfig: StrikeConfig;
  onAddWorkLog: (log: Omit<WorkLog, 'id'>) => any;
  onUpdateProject?: (proj: Project) => void;
  onAddLicenseRequest: (req: Omit<LicenseRequest, 'id' | 'status' | 'dateRequested'>) => any;
  onUpdateAvatar: (employeeId: string, avatarUrl: string) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
  remindedEmpIds?: string[];
}

export default function EmployeeDashboard({
  employee,
  employees,
  workLogs,
  projects,
  licenseRequests,
  licenseRules,
  strikeConfig,
  onAddWorkLog,
  onUpdateProject,
  onAddLicenseRequest,
  onUpdateAvatar,
  onUpdateEmployee,
  onChangePassword,
  remindedEmpIds = [],
}: EmployeeDashboardProps) {
  const [activeTab, setActiveTab] = useState<'carga_diaria' | 'proyectos' | 'licencias' | 'perfil'>('carga_diaria');

  // Selected project state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newUpdateText, setNewUpdateText] = useState('');

  // Daily log state
  const [logTitle, setLogTitle] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [logMode, setLogMode] = useState<'presencial' | 'remoto' | 'licencia'>('presencial');
  const [overrideDate, setOverrideDate] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Password change states
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput.length < 4) {
      triggerAlert('error', 'La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      triggerAlert('error', 'La confirmación no coincide con la nueva clave.');
      return;
    }
    try {
      if (onChangePassword) {
        await onChangePassword(currentPasswordInput, newPasswordInput);
      } else {
        await onUpdateEmployee({ ...employee, password: newPasswordInput, mustChangePassword: false });
      }
    } catch {
      triggerAlert('error', 'La contrasena actual ingresada es incorrecta.');
      return;
    }

    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmNewPasswordInput('');
    triggerAlert('success', '¡Excelente! Contraseña actualizada con éxito.');
  };

  // License Request state
  const [licenseArticle, setLicenseArticle] = useState(licenseRules[0]?.article || '');
  const [licenseStart, setLicenseStart] = useState('');
  const [licenseEnd, setLicenseEnd] = useState('');
  const [licenseReason, setLicenseReason] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | { name: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Success messages alerts
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const myWorkLogs = workLogs.filter(log => log.employeeId === employee.id).sort((a,b) => b.date.localeCompare(a.date));
  const myLicenseRequests = licenseRequests.filter(req => req.employeeId === employee.id).sort((a,b) => b.dateRequested.localeCompare(a.dateRequested));

  // Determine projects I'm assigned or those matched by titles
  const myAssignedProjects = projects.filter(p => p.assignedEmployeeIds.includes(employee.id));

  // Find next strike standby employee
  const sortedStrikeDutyList = employees.filter(e => e.strikeDutyOrder > 0).sort((a, b) => a.strikeDutyOrder - b.strikeDutyOrder);
  const currentStrikeNextEmployee = employees.find(e => e.id === strikeConfig.nextCoverEmployeeId) || sortedStrikeDutyList[0];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setAttachedFile({ name: file.name, size: file.size });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAttachedFile({ name: file.name, size: file.size });
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle.trim() || !logDescription.trim()) {
      triggerAlert('error', 'Por favor, completa el título y la descripción del trabajo.');
      return;
    }

    // Call callback to add worklog
    const newLog = onAddWorkLog({
      employeeId: employee.id,
      title: logTitle,
      description: logDescription,
      date: overrideDate ? logDate : new Date().toISOString().split('T')[0],
      mode: logMode,
    });

    // Reset fields
    setLogTitle('');
    setLogDescription('');
    setLogMode('presencial');
    setOverrideDate(false);

    // Check if the title matches a current active project
    const match = projects.find(p => (p.name || '').toLowerCase().trim() === (logTitle || '').toLowerCase().trim());
    if (match) {
      triggerAlert('success', `¡Trabajo diario guardado! Coincidió con el proyecto "${match.name}" y se vinculó automáticamente.`);
    } else {
      triggerAlert('success', '¡Trabajo diario registrado con éxito!');
    }
  };

  const handleLicenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseStart || !licenseEnd || !licenseReason.trim()) {
      triggerAlert('error', 'Por favor, completa las fechas y el motivo de la licencia.');
      return;
    }

    if (new Date(licenseStart) > new Date(licenseEnd)) {
      triggerAlert('error', 'La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    onAddLicenseRequest({
      employeeId: employee.id,
      article: licenseArticle,
      startDate: licenseStart,
      endDate: licenseEnd,
      reason: licenseReason,
      certificateName: attachedFile ? attachedFile.name : undefined,
    });

    setLicenseStart('');
    setLicenseEnd('');
    setLicenseReason('');
    setAttachedFile(null);
    triggerAlert('success', 'Solicitud de licencia enviada a la Administración para aprobación.');
  };

  // Days calculations
  // Días tomados: employee.licenseDaysTaken
  // Días de guardia acumulados que compensan días: employee.guardiasDone
  // Días restantes a tomar: (employee.totalLicenseDays + employee.guardiasDone) - employee.licenseDaysTaken
  const remainingDaysToTake = (employee.totalLicenseDays + employee.guardiasDone) - employee.licenseDaysTaken;

  const todayStr = new Date().toISOString().split('T')[0];
  const hasLogToday = workLogs.some(log => log.employeeId === employee.id && log.date === todayStr);
  const wasReminded = remindedEmpIds.includes(employee.id);

  // Filter licenses by other articles (not Art. 14 / Guardia en Feria)
  const otherLicenses = myLicenseRequests.filter(req => req.article !== 'Art. 14' && req.article !== 'Guardia en Feria');

  // Group other license articles to see totals
  const otherArticlesSummary = otherLicenses.reduce((acc, req) => {
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    if (!acc[req.article]) {
      acc[req.article] = { approvedDays: 0, pendingDays: 0, totalDays: 0, article: req.article, name: '' };
      const rule = licenseRules.find(r => r.article === req.article);
      acc[req.article].name = rule ? rule.name : 'Licencia Especial';
    }
    
    if (req.status === 'aprobado') {
      acc[req.article].approvedDays += days;
    } else if (req.status === 'pendiente') {
      acc[req.article].pendingDays += days;
    }
    acc[req.article].totalDays += days;
    return acc;
  }, {} as Record<string, { approvedDays: number; pendingDays: number; totalDays: number; article: string; name: string }>);

  return (
    <div className="w-full">
      {/* Alert element */}
      {alertMsg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-xl border shadow-xl max-w-md animate-bounce ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
          <div>
            <p className="font-semibold text-sm">{alertMsg.type === 'success' ? 'Operación Exitosa' : 'Atención'}</p>
            <p className="text-xs mt-0.5">{alertMsg.text}</p>
          </div>
        </div>
      )}

      {/* Alerta de Registro Diario Pendiente para el Agente */}
      {!hasLogToday && (
        <div className={`p-5 mb-8 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-5 transition-all ${
          wasReminded 
            ? 'bg-rose-50 border-rose-200 animate-pulse text-rose-900 shadow-rose-100/50' 
            : 'bg-amber-50 border-amber-200 text-amber-900 shadow-amber-100/50'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${wasReminded ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
              <ShieldAlert className="w-6 h-6 flex-shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm font-sans flex items-center gap-1.5">
                  {wasReminded ? '⚠️ Recordatorio Oficial de Administración' : '⚠️ Registro Diario Pendiente'}
                </h4>
                <span className={`text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  wasReminded ? 'bg-rose-150 text-rose-800 border border-rose-250' : 'bg-amber-150 text-amber-800 border border-amber-250'
                }`}>
                  {wasReminded ? 'Atención Urgente' : 'Pendiente Hoy'}
                </span>
              </div>
              <p className="text-xs mt-1.5 leading-relaxed opacity-90 max-w-2xl font-sans text-slate-700">
                {wasReminded 
                  ? `El administrador del sistema ha enviado un recordatorio formal para que registres tu actividad laboral de hoy (${todayStr}). Por favor, completa tu parte diario.`
                  : `Aún no has registrado tu parte de asistencia correspondiente al día de hoy (${todayStr}). Recordá que declarar las actividades diarias es obligatorio.`}
              </p>
            </div>
          </div>
          {activeTab !== 'carga_diaria' && (
            <button
              type="button"
              onClick={() => setActiveTab('carga_diaria')}
              className={`text-xs font-black px-4.5 py-2.5 rounded-xl cursor-pointer transition-all font-sans tracking-tight whitespace-nowrap shadow-xs hover:shadow-${
                wasReminded ? 'rose' : 'amber'
              } ${
                wasReminded 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              Cargar Parte Ahora
            </button>
          )}
        </div>
      )}

      {/* Header Info Employee */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <img 
            src={employee.avatar} 
            alt={employee.name} 
            className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-700 shadow-md"
            referrerPolicy="no-referrer"
          />
          <div className="text-center md:text-left flex-1">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold px-3 py-1 rounded-full">
              {employee.dependency}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-sans tracking-tight mt-2">{employee.name}</h2>
            <p className="text-slate-300 text-sm mt-1">{employee.email}</p>
          </div>
        </div>
      </div>

      {/* Internal Tabs Switcher */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => setActiveTab('carga_diaria')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            activeTab === 'carga_diaria'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Parte Diario ({myWorkLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('proyectos')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            activeTab === 'proyectos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Proyectos Vigentes ({myAssignedProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('licencias')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            activeTab === 'licencias'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Solicitar Licencia ({myLicenseRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('perfil')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            activeTab === 'perfil'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4" />
          Mi Perfil ({employee.dependency})
        </button>
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 gap-8">
        {/* TAB 1: CARGA DIARIA & HISTORIAL */}
        {activeTab === 'carga_diaria' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Input */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm self-start">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> Cargar Trabajo Diario
              </h3>
              
              <form onSubmit={handleLogSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Título o Proyecto
                  </label>
                  <input
                    type="text"
                    value={logTitle}
                    onChange={(e) => setLogTitle(e.target.value)}
                    placeholder="Ej. Digitalización de Expedientes"
                    className="w-full text-sm border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 transition-all"
                  />
                  {/* Suggestions warning for matched projects */}
                  {logTitle?.trim() && (
                    <div className="mt-2">
                      {projects.some(p => (p.name || '').toLowerCase().trim() === (logTitle || '').toLowerCase().trim()) ? (
                        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 p-2 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5" /> 
                          Válido: Se vinculará como actualización automática del proyecto.
                        </p>
                      ) : (
                        <div className="text-xs text-gray-500 bg-slate-50 p-2 rounded-lg space-y-1">
                          <p>Sugerencia de proyectos vigentes:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {projects.map((p, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setLogTitle(p.name)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold"
                              >
                                {p.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Modalidad del Día
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['presencial', 'remoto', 'licencia'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setLogMode(mode)}
                        className={`py-2 px-3 text-xs font-medium rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          logMode === mode
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100'
                            : 'border-gray-200 hover:bg-slate-50 text-gray-700'
                        }`}
                      >
                        <MapPin className={`w-4 h-4 ${
                          mode === 'presencial' ? 'text-blue-500' :
                          mode === 'remoto' ? 'text-amber-500' : 'text-purple-500'
                        }`} />
                        <span className="capitalize">{mode}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Controls */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">Fecha del Reporte</label>
                    <button
                      type="button"
                      onClick={() => {
                        setOverrideDate(!overrideDate);
                        if (overrideDate) setLogDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="text-[10px] font-bold text-indigo-600 uppercase hover:underline"
                    >
                      {overrideDate ? "Fijar a hoy" : "Elegir otro día"}
                    </button>
                  </div>
                  {overrideDate ? (
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full text-xs rounded-lg border border-gray-300 p-2 font-mono"
                    />
                  ) : (
                    <p className="text-xs text-gray-600 font-mono flex items-center gap-1.5 py-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (Hoy)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    ¿Qué hiciste hoy? (Descripción de Tarea)
                  </label>
                  <textarea
                    rows={4}
                    value={logDescription}
                    onChange={(e) => setLogDescription(e.target.value)}
                    placeholder="Describe en detalle las tareas realizadas, problemas resueltos o avances del día..."
                    className="w-full text-sm border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 transition-all font-sans"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Registrar Jornada Laboral
                </button>
              </form>
            </div>

            {/* History of Worklogs */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Historial de Registros</h3>
                <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-1 rounded">
                  {myWorkLogs.length} Entradas
                </span>
              </div>

              {myWorkLogs.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-250">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No has registrado ningún parte de trabajo aún.</p>
                  <p className="text-gray-400 text-xs mt-1">Usa el formulario de la izquierda para registrar tu día.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
                  {myWorkLogs.map((log) => {
                    const isSyncedProject = projects.some(p => (p.name || '').toLowerCase().trim() === (log.title || '').toLowerCase().trim());
                    return (
                      <div 
                        key={log.id} 
                        className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm hover:border-gray-300 transition-all relative group"
                        id={`worklog-card-${log.id}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-semibold font-mono bg-slate-100 px-2 py-0.5 rounded">
                              {log.date}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              log.mode === 'presencial' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              log.mode === 'remoto' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-purple-50 text-purple-700 border border-purple-100'
                            }`}>
                              {log.mode}
                            </span>
                          </div>
                          
                          {isSyncedProject && (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-2 py-0.5 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> Vinculado a Proyecto
                            </span>
                          )}
                        </div>

                        <h4 className="text-md font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {log.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line leading-relaxed">
                          {log.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        {/* TAB 2: PROYECTOS VIGENTES */}
        {activeTab === 'proyectos' && (
          <div className="space-y-6 w-full animate-fade-in text-slate-800">
            {selectedProjectId ? (() => {
              const selectedProj = projects.find(p => p.id === selectedProjectId);
              if (!selectedProj) {
                setSelectedProjectId(null);
                return null;
              }

              const isAssigned = selectedProj.assignedEmployeeIds.includes(employee.id);
              const associatedLogs = workLogs.filter(w => (w?.title || '').toLowerCase().trim() === (selectedProj?.name || '').toLowerCase().trim());
              const adminUpdates = selectedProj.updates || [];

              // Sort combined timeline descending
              const combinedTimeline = [
                ...associatedLogs.map(log => {
                  const emp = employees.find(e => e.id === log.employeeId);
                  return {
                    id: log.id,
                    type: 'employee' as const,
                    date: log.date,
                    authorName: emp ? emp.name : 'Agente',
                    avatar: emp?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=Ag&backgroundColor=cbd5e1`,
                    content: log.description,
                    mode: log.mode
                  };
                }),
                ...adminUpdates.map(upd => ({
                  id: upd.id,
                  type: 'admin' as const,
                  date: upd.date,
                  authorName: upd.authorName,
                  avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Ad&backgroundColor=6366f1`,
                  content: upd.content,
                  mode: undefined
                }))
              ].sort((a, b) => b.date.localeCompare(a.date));

              return (
                <div className="space-y-6 animate-fade-in w-full">
                  {/* Back button and Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedProjectId(null)}
                        className="p-2 hover:bg-slate-100 rounded-xl border border-gray-200 transition-all text-gray-500 hover:text-gray-900 cursor-pointer"
                        title="Volver"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-650 px-2 py-0.5 rounded uppercase tracking-wider">
                            {selectedProj.requesterDependency}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            selectedProj.status === 'vigente' 
                              ? 'bg-emerald-55 text-emerald-800 border border-emerald-100' 
                              : selectedProj.status === 'pausado' 
                              ? 'bg-amber-50 text-amber-800 border border-amber-100'
                              : 'bg-slate-100 text-slate-755'
                          }`}>
                            {selectedProj.status === 'vigente' ? 'Vigente' : selectedProj.status === 'pausado' ? 'Pausado' : 'Completado'}
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mt-1">{selectedProj.name}</h4>
                      </div>
                    </div>

                    {isAssigned && (
                      <span className="self-start sm:self-auto text-[10px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-150 text-indigo-700 px-3 py-1 rounded-full">
                        Tu equipo está asignado a este proyecto
                      </span>
                    )}
                  </div>

                  {/* Columns Detail */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Actions / Details */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* Description */}
                      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                        <div>
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Alcance / Objetivo</h5>
                          <p className="text-xs text-slate-700 leading-relaxed font-sans">{selectedProj.description}</p>
                        </div>

                        {/* Quick Register Action button */}
                        {isAssigned && selectedProj.status === 'vigente' && (
                          <div className="pt-2 border-t border-gray-100">
                            <button
                              onClick={() => {
                                setLogTitle(selectedProj.name);
                                setActiveTab('carga_diaria');
                                setSelectedProjectId(null);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 py-3 px-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                              <Plus className="w-4 h-4" /> Cargar Parte de Trabajo para este Proyecto
                            </button>
                            <p className="text-[10px] text-gray-400 italic text-center mt-2 font-medium">
                              Rellena automáticamente el título para sincronizar tu carga.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Team involved */}
                      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
                        <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-widest border-b pb-2 mb-1">Miembros Asignados</h5>
                        <div className="space-y-2.5">
                          {selectedProj.assignedEmployeeIds.map((empId) => {
                            const emp = employees.find(e => e.id === empId);
                            const isMeObj = empId === employee.id;
                            return (
                              <div key={empId} className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border">
                                <img
                                  src={emp?.avatar}
                                  alt={emp?.name}
                                  className="w-7 h-7 rounded-full border border-white"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <p className="text-xs font-bold text-slate-900">
                                    {emp?.name} {isMeObj && <span className="text-[9px] font-bold text-indigo-600 font-mono">(Vos)</span>}
                                  </p>
                                  <p className="text-[10px] text-indigo-500 font-medium">{emp?.position}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Right Timeline feed of integrated events */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                      <div className="flex items-center justify-between border-b pb-3.5 mb-5">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-slate-600" />
                          <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">Historial Integrado de Avances</h5>
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold font-mono px-2 py-0.5 rounded">
                          {combinedTimeline.length} actualizaciones
                        </span>
                      </div>

                      {combinedTimeline.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 font-sans">
                          <p className="text-xs italic">Aún no se registran partes diarios ni comunicaciones oficiales.</p>
                        </div>
                      ) : (
                        <div className="relative border-l border-indigo-100 pl-4 ml-1.5 space-y-5">
                          {combinedTimeline.map((item) => {
                            const isAdminType = item.type === 'admin';
                            return (
                              <div key={item.id} className="relative">
                                {/* Timeline small nodule */}
                                <span className={`absolute -left-[23px] mt-1.5 w-3 h-3 rounded-full border flex items-center justify-center shadow-xs ${
                                  isAdminType 
                                    ? 'bg-rose-500 border-white' 
                                    : 'bg-indigo-600 border-white'
                                }`} />

                                <div className={`p-4 rounded-xl border transition-all ${
                                  isAdminType
                                    ? 'bg-rose-50/25 border-rose-200'
                                    : 'bg-white border-gray-150 shadow-xs'
                                }`}>
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-1.5">
                                      <img
                                        src={item.avatar}
                                        alt={item.authorName}
                                        className="w-4.5 h-4.5 rounded-full border"
                                        referrerPolicy="no-referrer"
                                      />
                                      <span className="text-xs font-bold text-gray-800">
                                        {item.authorName}
                                      </span>
                                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                        isAdminType 
                                          ? 'bg-rose-100 text-rose-700' 
                                          : 'bg-indigo-100 text-indigo-700'
                                      }`}>
                                        {isAdminType ? 'DIRECCIÓN ADMIN' : 'AVANCE EQUIPO'}
                                      </span>
                                    </div>
                                    <span className="text-[9px] font-mono font-medium text-gray-400">
                                      {item.date}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-750 leading-relaxed font-sans">
                                    {item.content}
                                  </p>

                                  {item.mode && (
                                    <div className="mt-2 text-[9px] text-gray-400 font-mono flex items-center gap-1 bg-slate-50 w-max px-1.5 py-0.5 rounded border border-slate-100">
                                      <span>Modalidad:</span>
                                      <span className="font-bold text-slate-650 uppercase">{item.mode}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })() : (
              <>
                <div className="border bg-amber-50 border-amber-200 p-4 rounded-xl text-xs text-amber-900">
                  <span className="font-bold flex items-center gap-1.5 mb-1 text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Regla de Vinculación Automática
                  </span>
                  Como empleado, siempre que registres un parte de trabajo diario con el **mismo nombre exacto** de un proyecto vigente, tus desarrollos se sincronizarán directamente como avances de proyecto y quedarán documentados para la administración.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.length === 0 ? (
                    <div className="col-span-2 text-center py-12 bg-white rounded-2xl border">
                      <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No hay proyectos activos registrados.</p>
                    </div>
                  ) : (
                    projects.map((proj) => {
                      const isAssigned = proj.assignedEmployeeIds.includes(employee.id);
                      const matchedLogs = workLogs.filter(log => (log.title || '').toLowerCase().trim() === (proj.name || '').toLowerCase().trim());
                      const adminUpdatesCount = proj.updates?.length || 0;
                      
                      return (
                        <div 
                          key={proj.id} 
                          className={`bg-white p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                            isAssigned ? 'border-indigo-300 shadow-sm ring-4 ring-indigo-500/5' : 'border-gray-200'
                          }`}
                          id={`project-card-${proj.id}`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                Solicita: {proj.requesterDependency}
                              </span>
                              <div className="flex items-center gap-2">
                                {isAssigned && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                    Asignado
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                  proj.status === 'vigente' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-50 text-gray-700'
                                }`}>
                                  {proj.status === 'vigente' ? 'Vigente' : proj.status}
                                </span>
                              </div>
                            </div>

                            <h4 className="text-md font-extrabold text-slate-900">{proj.name}</h4>
                            <p className="text-xs text-slate-500 mt-1 lines-2 leading-relaxed h-11 overflow-hidden">{proj.description}</p>
                          </div>

                          {/* Action elements footer */}
                          <div className="mt-5 pt-3 border-t border-gray-105">
                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-3 font-mono">
                              <span className="text-indigo-650 bg-indigo-10s px-1.5 py-0.5 rounded">
                                {matchedLogs.length} partes diarios equipo
                              </span>
                              <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                                {adminUpdatesCount} directas admin
                              </span>
                            </div>

                            <button
                              onClick={() => setSelectedProjectId(proj.id)}
                              className="w-full flex items-center justify-center gap-1 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Ver Historial e Instructivos <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: SOLICITAR LICENCIA */}
        {activeTab === 'licencias' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form to submit license */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm self-start">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Solicitar Licencia
              </h3>

              <form onSubmit={handleLicenseSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Artículo / Ley Reguladora
                  </label>
                  <select
                    value={licenseArticle}
                    onChange={(e) => setLicenseArticle(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-gray-300 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 transition-all cursor-pointer"
                  >
                    {licenseRules.map((rule) => (
                      <option key={rule.id} value={rule.article}>
                        {rule.article} - {rule.name} (Límite: {rule.maxDaysPerYear}d)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1.5 px-1 leading-snug">
                    {licenseRules.find(r => r.article === licenseArticle)?.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-2">Fecha Desde</label>
                    <input
                      type="date"
                      value={licenseStart}
                      onChange={(e) => setLicenseStart(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2.5 font-mono text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-2">Fecha Hasta</label>
                    <input
                      type="date"
                      value={licenseEnd}
                      onChange={(e) => setLicenseEnd(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2.5 font-mono text-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Motivo Descrito
                  </label>
                  <textarea
                    rows={2}
                    value={licenseReason}
                    onChange={(e) => setLicenseReason(e.target.value)}
                    placeholder="Detalla brevemente las razones..."
                    className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 transition-all"
                  ></textarea>
                </div>

                {/* Upload Certificate Widget (supports Drag and Drop as requested) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Adjuntar Certificado de Licencia (Certificado Médico/Examen/etc)
                  </label>
                  
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      dragOver 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : attachedFile 
                          ? 'border-emerald-300 bg-emerald-50/50' 
                          : 'border-gray-200 hover:border-indigo-400 hover:bg-slate-50'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" 
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    />
                    
                    {attachedFile ? (
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-800">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div className="text-left font-mono">
                          <p className="font-semibold truncate max-w-xs">{attachedFile.name}</p>
                          <p className="text-[10px] text-emerald-600">Adjuntado con éxito. Haz clic para cambiarlo.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-medium text-slate-700">Arrastra tu certificado o haz clic para subirlo</p>
                        <p className="text-[10px] text-slate-400 font-mono">Soporta PDF, JPG, PNG de hasta 5MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer bg-slate-900 hover:bg-black text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Enviar Solicitud
                </button>
              </form>
            </div>

            {/* List of current status */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Estado de mis Solicitudes</h3>

              {myLicenseRequests.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No has realizado ninguna solicitud de licencia aún.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myLicenseRequests.map((req) => (
                    <div 
                      key={req.id} 
                      className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      id={`license-req-${req.id}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                            {req.article}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">Solicitado el {req.dateRequested}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mt-2">{req.reason}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Desde el <strong className="font-mono text-slate-800">{req.startDate}</strong> al <strong className="font-mono text-slate-800">{req.endDate}</strong>
                        </p>
                        
                        {req.certificateName && (
                          <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                            <Upload className="w-3 h-3" /> Certificado: {req.certificateName}
                          </span>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          req.status === 'pendiente' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          req.status === 'aprobado' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MI PERFIL */}
        {activeTab === 'perfil' && (
          <div className="space-y-8 animate-fade-in">
            {/* Resumen de Días de Feria, Compensatorios y Otras Licencias */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-150 p-6 rounded-3xl border border-gray-200 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-4">
                <div>
                  <h3 className="text-md font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" /> Panel de Control de Licencias y Francos
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Feria judicial compensatorio, guardias acreditadas y otras licencias tramitadas por artículos.</p>
                </div>
                <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-1 rounded-full font-mono">
                  {employee.dependency}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Bloque Izquierdo: Feria Judicial & Compensatorios (Fórmula) */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                    ⚖️ Feria Judicial & Compensatorios (Art. 14)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-xs">
                      <span className="block text-[11px] uppercase tracking-wider text-indigo-600 font-bold pb-2 border-b">Guardias en Feria</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-extrabold text-indigo-600 font-mono">+{employee.guardiasDone}</span>
                        <span className="text-[10px] text-indigo-400 font-bold">d</span>
                      </div>
                      <p className="text-[9px] text-indigo-450 mt-1">Suman compensatorios.</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-gray-150 shadow-xs">
                      <span className="block text-[11px] uppercase tracking-wider text-amber-700 font-bold pb-2 border-b">Licencias Tomadas</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-extrabold text-amber-600 font-mono">-{employee.licenseDaysTaken}</span>
                        <span className="text-[10px] text-amber-500 font-bold">d</span>
                      </div>
                      <p className="text-[9px] text-slate-450 mt-1">Gozados por Art. 14.</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border-emerald-250 shadow-xs ring-2 ring-emerald-50 bg-emerald-50/15">
                      <span className="block text-[11px] uppercase tracking-wider text-emerald-800 font-extrabold pb-2 border-b">Saldo Disponible</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-black text-emerald-600 font-mono">{remainingDaysToTake}</span>
                        <span className="text-[10px] text-emerald-550 font-extrabold">d</span>
                      </div>
                      <p className="text-[9px] text-emerald-700 font-medium mt-1">Feria / Compensatorio disponible.</p>
                    </div>
                  </div>
                </div>

                {/* Bloque Derecho: Registro de los otros artículos solicitados */}
                <div className="lg:col-span-5 space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                      📑 Registro de Otros Artículos
                    </h4>
                    <span className="text-[9.5px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded font-mono">
                      {otherLicenses.length} {otherLicenses.length === 1 ? 'solicitud' : 'solicitudes'}
                    </span>
                  </div>

                  {otherLicenses.length === 0 ? (
                    <div className="text-center py-7 text-slate-400 text-xs italic font-sans">
                      No registras solicitudes por otros artículos.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[145px] overflow-y-auto pr-1">
                      {otherLicenses.map((req) => {
                        const start = new Date(req.startDate);
                        const end = new Date(req.endDate);
                        const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                        return (
                          <div key={req.id} className="bg-slate-50 p-2 text-xs rounded-xl border border-slate-120 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                                  {req.article}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">{req.startDate} al {req.endDate}</span>
                              </div>
                              <p className="text-[10px] text-slate-600 truncate font-medium mt-1 italic">
                                "{req.reason || 'Sin motivo especificado'}"
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="text-[10.5px] font-bold text-slate-800 block font-mono">{days}d</span>
                              <span className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${
                                req.status === 'pendiente' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                req.status === 'aprobado' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' :
                                'bg-rose-50 text-rose-800 border-rose-200'
                              }`}>
                                {req.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Consumo total por artículo */}
                  {Object.keys(otherArticlesSummary).length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resumen de Días Utilizados:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.values(otherArticlesSummary).map((sum) => (
                          <div key={sum.article} className="bg-slate-50 border border-slate-200 rounded-lg py-0.5 px-2 text-[10px] flex items-center gap-1">
                            <span className="font-bold text-indigo-700 font-mono">{sum.article}</span>
                            <span className="text-slate-350">|</span>
                            <span className="font-bold text-slate-700">
                              {sum.approvedDays}d aprobados
                            </span>
                            {sum.pendingDays > 0 && (
                              <span className="text-amber-600 font-medium">
                                ({sum.pendingDays}d pend.)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grid of Profile and cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Column 1: Info & Security */}
              <div className="space-y-6">
                {/* Card 1: Mis Datos Personales & Avatar Uploader */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-md font-bold text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-600" /> Mis Datos Personales
                    </h3>

                    {/* Avatar upload / edit interface */}
                    <div className="flex flex-col items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                      <div className="relative group">
                        <img 
                          src={employee.avatar} 
                          alt={employee.name} 
                          className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md group-hover:opacity-90 transition-opacity"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          onClick={() => document.getElementById('avatar-upload-file')?.click()}
                          className="absolute bottom-1 right-1 bg-indigo-600 text-white p-1.5 rounded-lg shadow hover:bg-indigo-700 transition-colors"
                          title="Subir foto"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-700">Personaliza tu Avatar</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Sube un archivo de imagen o arrástralo aquí</p>
                      </div>

                      {/* Drag-and-drop / selector zone */}
                      <div 
                        onDragOver={(e) => {
                          e.preventDefault();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            const file = e.dataTransfer.files[0];
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  onUpdateAvatar(employee.id, event.target.result as string);
                                  triggerAlert('success', '¡Excelente! Foto de perfil cambiada correctamente.');
                                }
                              };
                              reader.readAsDataURL(file);
                            } else {
                              triggerAlert('error', 'El archivo debe ser una imagen válida (PNG o JPG).');
                            }
                          }
                        }}
                        onClick={() => document.getElementById('avatar-upload-file')?.click()}
                        className="w-full border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-slate-100/50 rounded-xl py-3 px-2 text-center cursor-pointer transition-colors"
                      >
                        <input 
                          type="file" 
                          id="avatar-upload-file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  onUpdateAvatar(employee.id, event.target.result as string);
                                  triggerAlert('success', '¡Excelente! Foto de perfil cambiada correctamente.');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <span className="text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5" /> Seleccionar Imagen Local
                        </span>
                      </div>

                      <div className="w-full border-t border-slate-200/60 pt-3">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 text-center">
                          O pega un enlace (URL)
                        </label>
                        <div className="flex gap-1">
                          <input 
                            type="text" 
                            id="avatar-link-url"
                            placeholder="https://images.unsplash.com/..." 
                            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.currentTarget;
                                if (input.value.trim().startsWith('http')) {
                                  onUpdateAvatar(employee.id, input.value.trim());
                                  triggerAlert('success', '¡Excelente! Foto de perfil actualizada vía URL.');
                                  input.value = '';
                                } else {
                                  triggerAlert('error', 'Por favor, introduce una URL de imagen válida que empiece con http/https.');
                                }
                              }
                            }}
                          />
                          <button 
                            onClick={() => {
                              const input = document.getElementById('avatar-link-url') as HTMLInputElement;
                              if (input && input.value.trim().startsWith('http')) {
                                onUpdateAvatar(employee.id, input.value.trim());
                                triggerAlert('success', '¡Excelente! Foto de perfil actualizada vía URL.');
                                input.value = '';
                              } else {
                                triggerAlert('error', 'Por favor, introduce una URL de imagen válida.');
                              }
                            }}
                            className="bg-slate-800 text-white hover:bg-black font-bold text-[10px] px-2.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Ir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-1">
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Nombre Completo</span>
                      <span className="text-sm font-bold text-gray-800">{employee.name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Correo Electrónico</span>
                      <span className="text-sm font-mono font-bold text-gray-800">{employee.email}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Dependencia Asistente</span>
                      <span className="text-sm font-bold text-gray-850 bg-slate-100 rounded px-2 py-0.5 inline-block mt-1">
                        {employee.dependency}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider mb-1.5">Home Office Asignado</span>
                      <div className="flex flex-wrap gap-1.5">
                        {employee.remoteDaysAssigned && employee.remoteDaysAssigned.length > 0 ? (
                          employee.remoteDaysAssigned.map((day, idx) => (
                            <span key={idx} className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] px-2.5 py-1 rounded-lg font-bold">
                              {day}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">No tienes días asignados (100% Presencial)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 1B: Seguridad de tu Acceso */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                  <h3 className="text-md font-bold text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" /> Seguridad de tu Acceso
                  </h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Contraseña Actual</label>
                      <input
                        type="password"
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs font-semibold border border-gray-300 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Nueva Contraseña</label>
                      <input
                        type="password"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full text-xs font-semibold border border-gray-300 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Confirmar Nueva Contraseña</label>
                      <input
                        type="password"
                        value={confirmNewPasswordInput}
                        onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                        placeholder="Repetir nueva clave"
                        className="w-full text-xs font-semibold border border-gray-300 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full cursor-pointer bg-slate-950 hover:bg-indigo-650 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sm"
                    >
                      Actualizar Contraseña
                    </button>
                  </form>
                </div>
              </div>

              {/* Card 3: Próximo en días de paro (Strike day duty roster) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                <h3 className="text-md font-bold text-red-700 border-b pb-3 mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" /> Guardia de Contingencia (Días de Paro)
                </h3>

                {/* PROXIMO PARO PROGRAMADO POR ADMINISTRACION */}
                {strikeConfig.nextDate && (
                  <div className="bg-red-50 hover:bg-red-50/95 border border-red-200 rounded-xl p-3.5 mb-5 space-y-2.5 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-extrabold text-red-800 uppercase tracking-wider flex items-center gap-1">
                        Paro confirmado
                      </span>
                      <span className="bg-red-650 text-white font-mono font-extrabold text-[9px] px-2.5 py-0.5 rounded-full">
                        {strikeConfig.nextDate}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 leading-normal">
                      <p className="font-sans">
                        Se ha convocado una medida de fuerza para el día <strong className="text-red-900 font-bold">{strikeConfig.nextDate}</strong>. El agente designado para cubrir es:
                      </p>
                      
                      {/* Person detail */}
                      {(() => {
                        const targetEmp = employees.find(e => e.id === strikeConfig.nextCoverEmployeeId);
                        if (!targetEmp) return <p className="text-gray-400 italic mt-1.5 font-sans">No asignado</p>;
                        const isMe = targetEmp.id === employee.id;
                        return (
                          <div className={`mt-2 p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                            isMe ? 'bg-red-600 text-white border-red-700 shadow ring-2 ring-red-200' : 'bg-white border-slate-150'
                          }`}>
                            <img 
                              src={targetEmp.avatar} 
                              alt={targetEmp.name}
                              className="w-8 h-8 rounded-lg object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <span className={`font-bold block text-xs truncate ${isMe ? 'text-white' : 'text-slate-800'}`}>
                                {targetEmp.name} {isMe && '(TÚ)'}
                              </span>
                              <span className={`text-[10px] block truncate ${isMe ? 'text-red-200' : 'text-slate-400'}`}>
                                {targetEmp.position || 'Oficial'}
                              </span>
                            </div>
                            {isMe && (
                              <span className="bg-white text-red-700 font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                                ¡Te Toca!
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {sortedStrikeDutyList.map((emp, idx) => {
                    const isUser = emp.id === employee.id;
                    const isNextActive = emp.id === strikeConfig.nextCoverEmployeeId;
                    const isLastCover = emp.id === strikeConfig.lastCoverEmployeeId;

                    return (
                      <div 
                        key={emp.id} 
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-colors ${
                          isNextActive 
                            ? 'bg-red-50 hover:bg-red-50/90 border-red-200' 
                            : isUser 
                              ? 'bg-indigo-50 hover:bg-indigo-50/90 border-indigo-150' 
                              : isLastCover 
                                ? 'bg-slate-50/60 border-slate-200' 
                                : 'bg-slate-50 hover:bg-slate-50/90 border-slate-100'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isNextActive ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {idx + 1}
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold truncate ${isNextActive ? 'text-red-950 font-black' : isUser ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {emp.name} {isUser && '(Tú)'}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">{emp.position || 'Agente'}</p>
                        </div>

                        <div className="flex flex-col gap-1 items-end">
                          {isNextActive && (
                            <span className="bg-red-100 text-red-750 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                              PRÓXIMA GUARD.
                            </span>
                          )}
                          {isLastCover && (
                            <span className="bg-indigo-100 text-indigo-700 font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                              Último Cubrió
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

