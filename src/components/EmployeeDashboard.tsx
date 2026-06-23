import React, { useEffect, useState, useRef } from 'react';
import { statisticsApi } from '../api/statistics.api';
import { Employee, WorkLog, Project, ProjectUpdate, LicenseRequest, LicenseRule, StrikeConfig, ActivityType, StatisticsResponse } from '../types';
import { activityTypeLabel, deploymentEnvironmentLabel, deploymentStatusLabel, difficultyLabel, licenseStatusLabel, projectStatusLabel } from '../utils/labels';
import {
  Calendar, CheckCircle, FileText, User, Briefcase, Plus, Clock, 
  MapPin, ShieldAlert, Upload, Download, CheckCircle2, ChevronRight, AlertCircle, FileSpreadsheet,
  ArrowLeft, History, MessageSquare, Send, BarChart3
} from 'lucide-react';
import ProjectComments from './ProjectComments';
import { Pagination, usePagination } from './Pagination';

interface EmployeeDashboardProps {
  employee: Employee;
  employees: Employee[];
  workLogs: WorkLog[];
  projects: Project[];
  licenseRequests: LicenseRequest[];
  licenseRules: LicenseRule[];
  strikeConfig: StrikeConfig;
  onAddWorkLog: (log: Omit<WorkLog, 'id'>) => Promise<WorkLog> | WorkLog;
  onUpdateWorkLog: (id: string, payload: Partial<WorkLog>) => Promise<WorkLog>;
  onUpdateProject?: (proj: Project) => void;
  onAddProjectUpdate?: (projectId: string, update: string | (Partial<ProjectUpdate> & { content: string })) => Promise<Project> | void;
  onAddLicenseRequest: (req: Omit<LicenseRequest, 'id' | 'status' | 'dateRequested'>) => any;
  onDeleteLicenseRequest: (id: string) => Promise<void>;
  onUpdateAvatar: (employeeId: string, avatarUrl: string | File) => Promise<Employee> | void;
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
  onUpdateWorkLog,
  onUpdateProject,
  onAddProjectUpdate,
  onAddLicenseRequest,
  onDeleteLicenseRequest,
  onUpdateAvatar,
  onUpdateEmployee,
  onChangePassword,
  remindedEmpIds = [],
}: EmployeeDashboardProps) {
  const initialActiveTab = () => {
    const section = new URLSearchParams(window.location.search).get('seccion');
    const map: Record<string, 'carga_diaria' | 'proyectos' | 'statistics' | 'licencias' | 'perfil'> = {
      'parte-diario': 'carga_diaria',
      proyectos: 'proyectos',
      estadisticas: 'statistics',
      licencias: 'licencias',
      perfil: 'perfil',
      empleados: 'perfil',
      comunicados: 'perfil',
      guardias: 'perfil',
      asistencia: 'carga_diaria',
    };
    return section && map[section] ? map[section] : 'carga_diaria';
  };
  const [activeTab, setActiveTab] = useState<'carga_diaria' | 'proyectos' | 'statistics' | 'licencias' | 'perfil'>(initialActiveTab);
  useEffect(() => {
    const onNavigate = (event: Event) => {
      const section = (event as CustomEvent<{ section?: string }>).detail?.section;
      const map: Record<string, typeof activeTab> = {
        'parte-diario': 'carga_diaria',
        proyectos: 'proyectos',
        estadisticas: 'statistics',
        licencias: 'licencias',
        perfil: 'perfil',
        empleados: 'perfil',
        comunicados: 'perfil',
        guardias: 'perfil',
        asistencia: 'carga_diaria',
      };
      if (section && map[section]) setActiveTab(map[section]);
    };
    window.addEventListener('sytec:navigate', onNavigate);
    return () => window.removeEventListener('sytec:navigate', onNavigate);
  }, []);

  // Selected project state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectTimelinePage, setProjectTimelinePage] = useState(1);
  useEffect(() => setProjectTimelinePage(1), [selectedProjectId]);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [newUpdateTitle, setNewUpdateTitle] = useState('');
  const [newUpdateStatus, setNewUpdateStatus] = useState('');
  const [newUpdateBlockers, setNewUpdateBlockers] = useState('');
  const [newUpdateNextStep, setNewUpdateNextStep] = useState('');
  const [newUpdateHours, setNewUpdateHours] = useState('');
  const [newUpdateActivityType, setNewUpdateActivityType] = useState<ActivityType>('PROJECT');
  const [statsYear, setStatsYear] = useState(String(new Date().getFullYear()));
  const [statsMonth, setStatsMonth] = useState('todos');
  const [statsProjectId, setStatsProjectId] = useState('todos');
  const [statsActivityType, setStatsActivityType] = useState('todos');
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const activityLabels: Record<ActivityType, string> = {
    PROJECT: 'Proyecto',
    SUPPORT: 'Soporte',
    MAINTENANCE: 'Mantenimiento',
    DEPLOY: 'Deploy',
    MEETING: 'Reunión',
    DOCUMENTATION: 'Documentación',
    OTHER: 'Otro',
  };

  // Daily log state
  const [logTitle, setLogTitle] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [logMode, setLogMode] = useState<WorkLog['mode']>('presencial');
  const [logProjectId, setLogProjectId] = useState('');
  const [logActivityType, setLogActivityType] = useState<ActivityType>('PROJECT');
  const [logHours, setLogHours] = useState('');
  const [logEntryTime, setLogEntryTime] = useState('');
  const [logExitTime, setLogExitTime] = useState('');
  const [overrideDate, setOverrideDate] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyView, setDailyView] = useState<'list' | 'calendar'>('list');
  const [dailyYear, setDailyYear] = useState(String(new Date().getFullYear()));
  const [dailyMonth, setDailyMonth] = useState(String(new Date().getMonth() + 1));
  const [dailyModeFilter, setDailyModeFilter] = useState('todos');
  const [dailyActivityFilter, setDailyActivityFilter] = useState('todos');
  const [dailyProjectFilter, setDailyProjectFilter] = useState('todos');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSavingWorkLog, setIsSavingWorkLog] = useState(false);
  const [editingWorkLogId, setEditingWorkLogId] = useState<string | null>(null);
  const workLogFormRef = useRef<HTMLDivElement>(null);

  // Password change states
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const initialNameParts = employee.name.trim().split(/\s+/);
  const [profileFirstName, setProfileFirstName] = useState(initialNameParts.shift() || '');
  const [profileLastName, setProfileLastName] = useState(initialNameParts.join(' '));
  const [profileEmail, setProfileEmail] = useState(employee.email || '');
  const [profileEditing, setProfileEditing] = useState(false);

  useEffect(() => {
    if (profileEditing) return;
    const parts = employee.name.trim().split(/\s+/);
    setProfileFirstName(parts.shift() || ''); setProfileLastName(parts.join(' ')); setProfileEmail(employee.email || '');
  }, [employee.name, employee.email, profileEditing]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const fullName = `${profileFirstName} ${profileLastName}`.trim();
    const email = profileEmail.trim();
    if (!fullName || !email) {
      triggerAlert('error', 'No se pudo actualizar el perfil');
      return;
    }
    try {
      await Promise.resolve(onUpdateEmployee({ ...employee, name: fullName, email }));
      setProfileEditing(false); triggerAlert('success', 'Perfil actualizado correctamente');
    } catch { triggerAlert('error', 'No se pudo actualizar el perfil'); }
  };

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
  const modeLabels: Record<string, string> = {
    presencial: 'Presencial',
    remoto: 'Remoto',
    mixto: 'Mixto',
    licencia: 'Licencia',
  };
  const modeBadgeClass = (mode?: string) => (
    mode === 'presencial' ? 'bg-blue-50 text-blue-700 border-blue-100' :
    mode === 'remoto' ? 'bg-amber-50 text-amber-700 border-amber-100' :
    mode === 'mixto' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
    'bg-purple-50 text-purple-700 border-purple-100'
  );
  const formatWorkLogTime = (log: WorkLog) => (log.entryTime || log.exitTime) ? `Horario: ${log.entryTime || '--:--'} a ${log.exitTime || '--:--'}` : '';
  const toLocalDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const dailyFilteredLogs = myWorkLogs.filter((log) => (
    String(new Date(`${log.date}T00:00:00`).getFullYear()) === dailyYear &&
    String(new Date(`${log.date}T00:00:00`).getMonth() + 1) === dailyMonth &&
    (dailyModeFilter === 'todos' || log.mode === dailyModeFilter) &&
    (dailyActivityFilter === 'todos' || log.activityType === dailyActivityFilter) &&
    (dailyProjectFilter === 'todos' || log.projectId === dailyProjectFilter)
  ));
  const dailyPagination = usePagination(dailyFilteredLogs, [dailyYear, dailyMonth, dailyModeFilter, dailyActivityFilter, dailyProjectFilter]);
  const projectPagination = usePagination(myAssignedProjects);
  const licensePagination = usePagination(myLicenseRequests);
  const selectedDayLogs = dailyFilteredLogs.filter((log) => log.date === selectedCalendarDate);
  const calendarYear = Number(dailyYear) || new Date().getFullYear();
  const calendarMonthIndex = (Number(dailyMonth) || new Date().getMonth() + 1) - 1;
  const monthStart = new Date(calendarYear, calendarMonthIndex, 1);
  const monthDays = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const leadingEmptyDays = (monthStart.getDay() + 6) % 7;
  const calendarCells = [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: monthDays }, (_, idx) => new Date(calendarYear, calendarMonthIndex, idx + 1)),
  ];
  const todayIso = new Date().toISOString().split('T')[0];
  const monthTitle = monthStart.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const setCalendarMonth = (year: number, monthIndex: number) => {
    const next = new Date(year, monthIndex, 1);
    setDailyYear(String(next.getFullYear()));
    setDailyMonth(String(next.getMonth() + 1));
    setSelectedCalendarDate(toLocalDateInput(next));
  };
  const openFormForDate = (date: string) => {
    setLogDate(date);
    setOverrideDate(true);
    workLogFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const resetWorkLogForm = () => {
    setEditingWorkLogId(null); setLogTitle(''); setLogDescription(''); setLogMode('presencial'); setLogProjectId(''); setLogActivityType('PROJECT'); setLogHours(''); setLogEntryTime(''); setLogExitTime(''); setOverrideDate(false); setLogDate(new Date().toISOString().split('T')[0]);
  };
  const editWorkLog = (log: WorkLog) => {
    setEditingWorkLogId(log.id); setLogTitle(log.title); setLogDescription(log.description); setLogMode(log.mode); setLogProjectId(log.projectId || ''); setLogActivityType(log.activityType || 'PROJECT'); setLogHours(log.hours === undefined ? '' : String(log.hours)); setLogEntryTime(log.entryTime || ''); setLogExitTime(log.exitTime || ''); setLogDate(log.date); setOverrideDate(true); workLogFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const getDeadlineLabel = (project: Project) => {
    if (!project.deadline) return 'Sin fecha límite';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(`${project.deadline}T00:00:00`);
    const diff = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return `Vencido hace ${Math.abs(diff)} días`;
    if (diff === 0) return 'Vence hoy';
    if (diff === 1) return 'Falta 1 dia';
    return `Faltan ${diff} días`;
  };

  useEffect(() => {
    if (activeTab !== 'statistics') return;
    setStatsLoading(true);
    setStatsError('');
    statisticsApi.me({
      year: statsYear,
      month: statsMonth,
      projectId: statsProjectId,
      activityType: statsActivityType,
    })
      .then(setStatistics)
      .catch((error: any) => {
        const status = error?.response?.status;
        setStatsError(status === 403 ? 'No tenés permisos para ver estas estadísticas.' : 'No se pudieron cargar las estadísticas.');
      })
      .finally(() => setStatsLoading(false));
  }, [activeTab, statsYear, statsMonth, statsProjectId, statsActivityType]);

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

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTitle.trim() || !logDescription.trim()) {
      triggerAlert('error', 'Por favor, completa el título y la descripción del trabajo.');
      return;
    }

    if (logEntryTime && logExitTime && logExitTime < logEntryTime) {
      triggerAlert('error', 'La hora de salida no puede ser anterior a la hora de entrada.');
      return;
    }

    const submittedTitle = logTitle;
    const submittedProjectId = logProjectId;
    const submittedDate = overrideDate ? logDate : new Date().toISOString().split('T')[0];
    setIsSavingWorkLog(true);
    try {
      const payload = {
        employeeId: employee.id,
        projectId: submittedProjectId || undefined,
        title: submittedTitle,
        description: logDescription,
        date: submittedDate,
        mode: logMode,
        activityType: logActivityType,
        hours: logHours ? Number(logHours) : undefined,
        entryTime: logEntryTime || '',
        exitTime: logExitTime || '',
      };
      if (editingWorkLogId) await onUpdateWorkLog(editingWorkLogId, payload);
      else await Promise.resolve(onAddWorkLog(payload));

      const wasEditing = !!editingWorkLogId;
      resetWorkLogForm();
      setSelectedCalendarDate(submittedDate);

      const match = projects.find(p => p.id === submittedProjectId || (p.name || '').toLowerCase().trim() === (submittedTitle || '').toLowerCase().trim());
      if (match) {
        triggerAlert('success', wasEditing ? 'Parte diario actualizado correctamente.' : `Trabajo diario guardado y vinculado al proyecto "${match.name}".`);
      } else {
        triggerAlert('success', wasEditing ? 'Parte diario actualizado correctamente.' : 'Trabajo diario registrado con éxito.');
      }
    } catch (error: any) {
      triggerAlert('error', error?.response?.data?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setIsSavingWorkLog(false);
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
  const remainingDaysToTake = employee.totalLicenseDays - employee.licenseDaysTaken;

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
            <p className="font-semibold text-sm">{alertMsg.type === 'success' ? 'Operación exitosa' : 'Atención'}</p>
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
                  {wasReminded ? 'Atención: Recordatorio Oficial de Administración' : 'Atención: Registro Diario Pendiente'}
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
          Mis proyectos ({myAssignedProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            activeTab === 'statistics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Mis estadísticas
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
            <div ref={workLogFormRef} className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm self-start">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> {editingWorkLogId ? 'Editar parte diario' : 'Cargar Trabajo Diario'}
              </h3>
              {hasLogToday && !editingWorkLogId && <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-800">Ya cargaste tu parte diario de hoy. Podés editarlo. <button type="button" onClick={() => { const today = myWorkLogs.find((log) => log.date === todayStr); if (today) editWorkLog(today); }} className="ml-1 font-bold underline">Editar parte de hoy</button></div>}
              
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
                                onClick={() => {
                                  setLogTitle(p.name);
                                  setLogProjectId(p.id);
                                }}
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
                    Proyecto asociado (opcional)
                  </label>
                  <select
                    value={logProjectId}
                    onChange={(e) => {
                      setLogProjectId(e.target.value);
                      const selected = projects.find((project) => project.id === e.target.value);
                      if (selected && !logTitle.trim()) setLogTitle(selected.name);
                    }}
                    className="w-full text-sm bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 transition-all"
                  >
                    <option value="">Sin proyecto asociado</option>
                    {myAssignedProjects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Tipo de actividad
                    </label>
                    <select
                      value={logActivityType}
                      onChange={(e) => setLogActivityType(e.target.value as ActivityType)}
                      className="w-full text-sm bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 transition-all"
                    >
                      {Object.entries(activityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Horas (opcional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={logHours}
                      onChange={(e) => setLogHours(e.target.value)}
                      placeholder="Ej. 3.5"
                      className="w-full text-sm border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 transition-all"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Horario del día (opcional)</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <label className="text-[10px] font-bold text-slate-600">Entrada
                      <input type="time" value={logEntryTime} onChange={(e) => setLogEntryTime(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-normal" />
                    </label>
                    <label className="text-[10px] font-bold text-slate-600">Salida
                      <input type="time" value={logExitTime} onChange={(e) => setLogExitTime(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-normal" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Modalidad del Día
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['presencial', 'remoto', 'mixto', 'licencia'] as const).map((mode) => (
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
                          mode === 'remoto' ? 'text-amber-500' :
                          mode === 'mixto' ? 'text-emerald-500' : 'text-purple-500'
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

                <div className="flex gap-2">
                  <button type="submit" disabled={isSavingWorkLog} className="flex-1 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition-all shadow-md disabled:opacity-60">
                    {isSavingWorkLog ? 'Guardando...' : editingWorkLogId ? 'Guardar cambios' : 'Registrar Jornada Laboral'}
                  </button>
                  {editingWorkLogId && <button type="button" onClick={resetWorkLogForm} className="rounded-xl border px-4 text-xs font-bold">Cancelar edición</button>}
                </div>
              </form>
            </div>

            {/* History of Worklogs */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Historial de Registros</h3>
                    <p className="text-xs text-slate-500">Lista y calendario usan los mismos partes cargados.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDailyView('list')}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${dailyView === 'list' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Ver lista
                    </button>
                    <button
                      type="button"
                      onClick={() => setDailyView('calendar')}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${dailyView === 'calendar' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Ver calendario
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <input
                    type="number"
                    value={dailyYear}
                    onChange={(e) => setDailyYear(e.target.value)}
                    className="text-xs border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="Año"
                  />
                  <select value={dailyMonth} onChange={(e) => setDailyMonth(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white">
                    {Array.from({ length: 12 }, (_, idx) => <option key={idx + 1} value={idx + 1}>{new Date(2026, idx, 1).toLocaleDateString('es-AR', { month: 'long' })}</option>)}
                  </select>
                  <select value={dailyModeFilter} onChange={(e) => setDailyModeFilter(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white">
                    <option value="todos">Modalidad</option>
                    <option value="presencial">Presencial</option>
                    <option value="remoto">Remoto</option>
                    <option value="mixto">Mixto</option>
                    <option value="licencia">Licencia</option>
                  </select>
                  <select value={dailyActivityFilter} onChange={(e) => setDailyActivityFilter(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white">
                    <option value="todos">Actividad</option>
                    {Object.entries(activityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                  <select value={dailyProjectFilter} onChange={(e) => setDailyProjectFilter(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white">
                    <option value="todos">Proyecto</option>
                    {myAssignedProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </div>
                <span className="inline-flex text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-1 rounded">
                  {dailyFilteredLogs.length} Entradas filtradas
                </span>
              </div>

              {dailyView === 'list' && (dailyFilteredLogs.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-250">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Sin registros para este mes.</p>
                  <p className="text-gray-400 text-xs mt-1">Ajustá los filtros o cargá un parte desde el formulario.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
                  {dailyPagination.rows.map((log) => {
                    const linkedProject = projects.find(p => p.id === log.projectId || (p.name || '').toLowerCase().trim() === (log.title || '').toLowerCase().trim());
                    const isSyncedProject = !!linkedProject;
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
                              log.mode === 'mixto' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                              'bg-purple-50 text-purple-700 border border-purple-100'
                            }`}>
                              {modeLabels[log.mode] || log.mode}
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
                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                          {linkedProject && <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded px-2 py-1">{linkedProject.name}</span>}
                          {log.activityType && <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded px-2 py-1">{activityTypeLabel(log.activityType)}</span>}
                          {log.hours !== undefined && <span className="bg-slate-50 border border-slate-200 text-slate-700 rounded px-2 py-1">{log.hours} h</span>}
                          {formatWorkLogTime(log) && <span className="bg-blue-50 border border-blue-100 text-blue-700 rounded px-2 py-1">{formatWorkLogTime(log)}</span>}
                          <button type="button" onClick={() => editWorkLog(log)} className="ml-auto rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-indigo-700">Editar</button>
                        </div>
                      </div>
                    );
                  })}
                  <Pagination {...dailyPagination} />
                </div>
              ))}

              {dailyView === 'calendar' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                  <div className="xl:col-span-8 bg-white border border-gray-150 rounded-2xl p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <h4 className="text-sm font-black text-slate-900 capitalize">{monthTitle}</h4>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setCalendarMonth(calendarYear, calendarMonthIndex - 1)} className="text-xs font-bold border rounded-xl px-3 py-2 hover:bg-slate-50">Anterior</button>
                        <button type="button" onClick={() => {
                          const today = new Date();
                          setCalendarMonth(today.getFullYear(), today.getMonth());
                          setSelectedCalendarDate(todayIso);
                        }} className="text-xs font-bold border rounded-xl px-3 py-2 hover:bg-slate-50">Hoy</button>
                        <button type="button" onClick={() => setCalendarMonth(calendarYear, calendarMonthIndex + 1)} className="text-xs font-bold border rounded-xl px-3 py-2 hover:bg-slate-50">Siguiente</button>
                      </div>
                    </div>
                    {dailyFilteredLogs.length === 0 && (
                      <div className="mb-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 text-xs text-slate-500">Sin registros para este mes.</div>
                    )}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-slate-400 mb-2">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarCells.map((date, idx) => {
                        if (!date) return <div key={`empty-${idx}`} className="min-h-[76px] rounded-xl bg-slate-50/50" />;
                        const iso = toLocalDateInput(date);
                        const dayLogs = dailyFilteredLogs.filter((log) => log.date === iso);
                        const isSelected = selectedCalendarDate === iso;
                        const isToday = todayIso === iso;
                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => setSelectedCalendarDate(iso)}
                            className={`min-h-[76px] rounded-xl border p-2 text-left transition-all hover:border-indigo-200 ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50' : isToday ? 'border-emerald-300 bg-emerald-50' : 'border-slate-150 bg-white'}`}
                          >
                            <span className={`block text-xs font-black ${isToday ? 'text-emerald-700' : 'text-slate-800'}`}>{date.getDate()}</span>
                            <div className="mt-1 space-y-1">
                              {dayLogs.slice(0, 2).map((log) => (
                                <span key={log.id} className={`block truncate text-[9px] font-bold border rounded px-1 py-0.5 ${modeBadgeClass(log.mode)}`}>
                                  {modeLabels[log.mode] || log.mode}{log.activityType ? ` · ${activityTypeLabel(log.activityType)}` : ''}
                                </span>
                              ))}
                              {dayLogs.length > 2 && <span className="block text-[9px] font-bold text-slate-500">+{dayLogs.length - 2}</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="xl:col-span-4 bg-white border border-gray-150 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Día seleccionado</h4>
                        <p className="text-xs text-slate-500 font-mono">{selectedCalendarDate}</p>
                      </div>
                      <button type="button" onClick={() => openFormForDate(selectedCalendarDate)} className="text-[10px] font-black bg-indigo-600 text-white rounded-xl px-3 py-2 hover:bg-indigo-700">
                        Cargar parte
                      </button>
                    </div>
                    {selectedDayLogs.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center">
                        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Sin registros para este día.</p>
                        <button type="button" onClick={() => openFormForDate(selectedCalendarDate)} className="mt-3 text-xs font-bold text-indigo-600 hover:underline">
                          Cargar parte para este día
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                        {selectedDayLogs.map((log) => {
                          const linkedProject = projects.find(p => p.id === log.projectId || (p.name || '').toLowerCase().trim() === (log.title || '').toLowerCase().trim());
                          return (
                            <div key={log.id} className="border border-slate-150 rounded-xl p-3 text-xs">
                              <div className="flex flex-wrap gap-1 mb-2">
                                <span className={`font-bold border rounded px-2 py-1 ${modeBadgeClass(log.mode)}`}>{modeLabels[log.mode] || log.mode}</span>
                                {log.activityType && <span className="font-bold border border-indigo-100 bg-indigo-50 text-indigo-700 rounded px-2 py-1">{activityTypeLabel(log.activityType)}</span>}
                                {log.hours !== undefined && <span className="font-bold border border-slate-200 bg-slate-50 text-slate-700 rounded px-2 py-1">{log.hours} h</span>}
                              </div>
                              <h5 className="font-black text-slate-900">{log.title}</h5>
                              {linkedProject && <p className="mt-1 font-bold text-emerald-700">{linkedProject.name}</p>}
                              <p className="mt-2 text-slate-600 whitespace-pre-line leading-relaxed">{log.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
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
              const associatedLogs = workLogs.filter(w => w.projectId === selectedProj?.id || (w?.title || '').toLowerCase().trim() === (selectedProj?.name || '').toLowerCase().trim());
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
                    title: log.title,
                    content: log.description,
                    activityType: undefined,
                    blockers: undefined,
                    nextStep: undefined,
                    hours: undefined,
                    progressStatus: undefined,
                    mode: log.mode
                  };
                }),
                ...adminUpdates.map(upd => ({
                  id: upd.id,
                  type: 'admin' as const,
                  date: upd.date,
                  authorName: upd.authorName,
                  avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Ad&backgroundColor=6366f1`,
                  title: upd.title,
                  content: upd.content,
                  activityType: upd.activityType,
                  blockers: upd.blockers,
                  nextStep: upd.nextStep,
                  hours: upd.hours,
                  progressStatus: upd.status,
                  mode: undefined
                }))
              ].sort((a, b) => b.date.localeCompare(a.date));
              const timelinePages = Math.max(1, Math.ceil(combinedTimeline.length / 10));

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
                            {projectStatusLabel(selectedProj.status)}
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

                        {isAssigned && (
                          <div className="pt-3 border-t border-gray-100 space-y-2">
                            <input
                              value={newUpdateTitle}
                              onChange={(e) => setNewUpdateTitle(e.target.value)}
                              placeholder="Titulo del avance"
                              className="w-full text-xs border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <textarea
                              rows={3}
                              value={newUpdateText}
                              onChange={(e) => setNewUpdateText(e.target.value)}
                              placeholder="Cargar avance breve para este proyecto..."
                              className="w-full text-xs border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <select value={newUpdateActivityType} onChange={(e) => setNewUpdateActivityType(e.target.value as ActivityType)} className="text-xs border border-gray-200 rounded-xl p-3">
                                <option value="PROJECT">Proyecto</option>
                                <option value="SUPPORT">Soporte</option>
                                <option value="MAINTENANCE">Mantenimiento</option>
                                <option value="DEPLOY">Deploy</option>
                                <option value="MEETING">Reunión</option>
                                <option value="DOCUMENTATION">Documentación</option>
                                <option value="OTHER">Otro</option>
                              </select>
                              <input value={newUpdateStatus} onChange={(e) => setNewUpdateStatus(e.target.value)} placeholder="Estado del avance" className="text-xs border border-gray-200 rounded-xl p-3" />
                              <input value={newUpdateHours} onChange={(e) => setNewUpdateHours(e.target.value)} type="number" min="0" step="0.25" placeholder="Horas dedicadas" className="text-xs border border-gray-200 rounded-xl p-3" />
                              <input value={newUpdateBlockers} onChange={(e) => setNewUpdateBlockers(e.target.value)} placeholder="Bloqueos / problemas" className="text-xs border border-gray-200 rounded-xl p-3" />
                              <input value={newUpdateNextStep} onChange={(e) => setNewUpdateNextStep(e.target.value)} placeholder="Próximo paso" className="text-xs border border-gray-200 rounded-xl p-3" />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!newUpdateText.trim() || !onAddProjectUpdate) return;
                                Promise.resolve(onAddProjectUpdate(selectedProj.id, {
                                  title: newUpdateTitle.trim(),
                                  description: newUpdateText.trim(),
                                  content: newUpdateText.trim(),
                                  status: newUpdateStatus.trim(),
                                  blockers: newUpdateBlockers.trim(),
                                  nextStep: newUpdateNextStep.trim(),
                                  hours: newUpdateHours ? Number(newUpdateHours) : undefined,
                                  activityType: newUpdateActivityType,
                                }))
                                  .then(() => {
                                    setNewUpdateText('');
                                    setNewUpdateTitle('');
                                    setNewUpdateStatus('');
                                    setNewUpdateBlockers('');
                                    setNewUpdateNextStep('');
                                    setNewUpdateHours('');
                                    setNewUpdateActivityType('PROJECT');
                                    triggerAlert('success', 'Avance registrado en el proyecto.');
                                  })
                                  .catch(() => triggerAlert('error', 'No se pudo registrar el avance.'));
                              }}
                              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-900 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" /> Publicar avance
                            </button>
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

                    <div className="lg:col-span-12"><ProjectComments projectId={selectedProj.id} /></div>

                    {/* Right Timeline feed of integrated events */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                      <div className="flex items-center justify-between border-b pb-3.5 mb-5">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-slate-600" />
                          <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">Historial Integrado de Avances</h5>
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold font-mono px-2 py-0.5 rounded">
                          {combinedTimeline.length} actualizaciónes
                        </span>
                      </div>

                      {combinedTimeline.length > 10 && <div className="mb-4 flex items-center justify-end gap-2 text-xs"><button type="button" disabled={projectTimelinePage === 1} onClick={() => setProjectTimelinePage((page) => page - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button><strong>Página {projectTimelinePage} de {timelinePages}</strong><button type="button" disabled={projectTimelinePage === timelinePages} onClick={() => setProjectTimelinePage((page) => page + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Siguiente</button></div>}

                      {combinedTimeline.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 font-sans">
                          <p className="text-xs italic">Aún no se registran partes diarios ni comunicaciones oficiales.</p>
                        </div>
                      ) : (
                        <div className="relative border-l border-indigo-100 pl-4 ml-1.5 space-y-5">
                          {combinedTimeline.slice((projectTimelinePage - 1) * 10, projectTimelinePage * 10).map((item) => {
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

                                  {item.title && <p className="text-xs font-black text-slate-900 mb-1">{item.title}</p>}
                                  <p className="text-xs text-slate-750 leading-relaxed font-sans">
                                    {item.content}
                                  </p>

                                  {(item.activityType || item.progressStatus || item.blockers || item.nextStep || item.hours !== undefined) && (
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                      {item.activityType && <span className="bg-indigo-50 border border-indigo-100 rounded px-2 py-1"><b>Tipo:</b> {activityTypeLabel(item.activityType)}</span>}
                                      {item.progressStatus && <span className="bg-slate-50 border rounded px-2 py-1"><b>Estado:</b> {item.progressStatus}</span>}
                                      {item.hours !== undefined && <span className="bg-slate-50 border rounded px-2 py-1"><b>Horas:</b> {item.hours}</span>}
                                      {item.blockers && <span className="bg-rose-50 border border-rose-100 rounded px-2 py-1"><b>Bloqueos:</b> {item.blockers}</span>}
                                      {item.nextStep && <span className="bg-indigo-50 border border-indigo-100 rounded px-2 py-1"><b>Próximo:</b> {item.nextStep}</span>}
                                    </div>
                                  )}

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
                  {myAssignedProjects.length === 0 ? (
                    <div className="col-span-2 text-center py-12 bg-white rounded-2xl border">
                      <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No hay proyectos activos registrados.</p>
                    </div>
                  ) : (
                    projectPagination.rows.map((proj) => {
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
                                  {projectStatusLabel(proj.status)}
                                </span>
                              </div>
                            </div>

                            <h4 className="text-md font-extrabold text-slate-900">{proj.name}</h4>
                            <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] uppercase font-bold">
                              <span className="bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{proj.year || '-'}</span>
                              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{difficultyLabel(proj.difficulty)}</span>
                              <span className={`border px-1.5 py-0.5 rounded ${
                                proj.deadlineStatus === 'vencido' ? 'bg-red-50 border-red-100 text-red-700' :
                                proj.deadlineStatus === 'vence_hoy' ? 'bg-orange-50 border-orange-100 text-orange-700' :
                                proj.deadlineStatus === 'sin_fecha' ? 'bg-gray-50 border-gray-100 text-gray-600' :
                                'bg-emerald-50 border-emerald-100 text-emerald-700'
                              }`}>
                                {getDeadlineLabel(proj)}
                              </span>
                              {proj.deployments?.[0] && <span className="bg-violet-50 border border-violet-100 text-violet-700 px-1.5 py-0.5 rounded">{deploymentEnvironmentLabel(proj.deployments[0].environment)} {deploymentStatusLabel(proj.deployments[0].status)}</span>}
                            </div>
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
                <Pagination {...projectPagination} />
              </>
            )}
          </div>
        )}

        {/* TAB 3: SOLICITAR LICENCIA */}
        {activeTab === 'statistics' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" /> Mis estadísticas
                  </h3>
                  <p className="text-xs text-slate-500">Tus proyectos asignados, avances, soporte y horas cargadas.</p>
                </div>
                {statsLoading && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Cargando...</span>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <input value={statsYear} onChange={(e) => setStatsYear(e.target.value)} placeholder="Año" className="text-xs border rounded-xl px-3 py-2" />
                <select value={statsMonth} onChange={(e) => setStatsMonth(e.target.value)} className="text-xs border rounded-xl px-3 py-2">
                  <option value="todos">Mes</option>
                  {Array.from({ length: 12 }, (_, idx) => <option key={idx + 1} value={idx + 1}>{idx + 1}</option>)}
                </select>
                <select value={statsProjectId} onChange={(e) => setStatsProjectId(e.target.value)} className="text-xs border rounded-xl px-3 py-2">
                  <option value="todos">Proyecto</option>
                  {myAssignedProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
                <select value={statsActivityType} onChange={(e) => setStatsActivityType(e.target.value)} className="text-xs border rounded-xl px-3 py-2">
                  <option value="todos">Actividad</option>
                  {Object.entries(activityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
            </div>

            {statsError && <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-sm font-bold">{statsError}</div>}
            {!statsError && statistics && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
                  {[
                    ['Mis proyectos', statistics.myProjects ?? statistics.summary.totalProjects],
                    ['Avances', statistics.summary.totalUpdates],
                    ['Soportes', statistics.summary.supportUpdates],
                    ['Deploys', statistics.summary.deploys],
                    ['Horas', statistics.summary.totalHours],
                    ['Vencidos', statistics.overdueProjects ?? statistics.summary.overdueProjects],
                    ['Prox. vencer', statistics.upcomingProjects ?? 0],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm">
                      <span className="block text-[9px] uppercase font-black text-slate-400">{label}</span>
                      <strong className="text-xl font-black font-mono text-slate-900">{value}</strong>
                    </div>
                  ))}
                </div>

                {statistics.summary.totalProjects === 0 && statistics.summary.totalUpdates === 0 ? (
                  <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-sm text-slate-500">No hay datos para los filtros seleccionados.</div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">Mis proyectos</h4>
                      <div className="space-y-2">
                        {statistics.byProject.slice(0, 10).map((row) => (
                          <div key={row.projectId} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2 text-xs">
                            <span className="font-bold text-slate-800">{row.projectName}</span>
                            <span className="font-mono text-slate-500">{row.updates} avances / {row.hours || 0}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">Por tipo de actividad</h4>
                      <div className="space-y-2">
                        {statistics.byActivityType.filter((row) => row.count || row.hours).map((row) => (
                          <div key={row.activityType} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2 text-xs">
                            <span className="font-bold text-slate-800">{activityLabels[row.activityType] || row.label}</span>
                            <span className="font-mono text-slate-500">{row.count} / {row.hours || 0}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm xl:col-span-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">Por modalidad</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        {(statistics.byWorkMode || []).map((row) => (
                          <div key={row.mode} className="bg-slate-50 border rounded-xl p-3 text-xs">
                            <strong className="block text-slate-900">{{ ONSITE: 'Presencial', REMOTE: 'Remoto', MIXED: 'Mixto', LICENSE: 'Licencia' }[row.mode] || row.mode}</strong>
                            <span className="text-slate-500">{row.count} partes / {row.hours || 0}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm xl:col-span-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">Por mes</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {statistics.byMonth.map((row) => (
                          <div key={row.month} className="bg-slate-50 border rounded-xl p-3 text-xs">
                            <strong className="block text-slate-900">{row.month}</strong>
                            <span className="text-slate-500">Avances {row.updates} - Soportes {row.supports} - Deploys {row.deploys}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

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
                  {licensePagination.rows.map((req) => (
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
                          {licenseStatusLabel(req.status)}
                        </span>
                        {req.status === 'pendiente' && <button type="button" onClick={() => {
                          if (!window.confirm('¿Seguro que querés eliminar esta solicitud de licencia?')) return;
                          onDeleteLicenseRequest(req.id).then(() => triggerAlert('success', 'Solicitud eliminada correctamente')).catch((error: any) => triggerAlert('error', error?.response?.data?.message || 'No tenés permisos para eliminar esta solicitud'));
                        }} className="mt-2 block text-xs font-bold text-rose-600 underline">Eliminar</button>}
                      </div>
                    </div>
                  ))}
                  <Pagination {...licensePagination} />
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
                  <p className="text-xs text-slate-500 mt-0.5">Feria judicial, compensatorios, guardias acreditadas y otras licencias tramitadas por artículos.</p>
                </div>
                <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-3 py-1 rounded-full font-mono">
                  {employee.dependency}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Bloque Izquierdo: Feria Judicial & Compensatorios (Fórmula) */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                     Feria Judicial & Compensatorios (Art. 14)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-xs">
                      <span className="block text-[11px] uppercase tracking-wider text-indigo-600 font-bold pb-2 border-b">Días compensatorios por guardia</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-lg font-extrabold text-indigo-600">{employee.guardiasDone > 0 ? `${employee.guardiasDone} días disponibles` : 'Sin días compensatorios acumulados'}</span>
                      </div>
                      <p className="text-[9px] text-indigo-450 mt-1">Saldo independiente de las licencias comunes.</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-gray-150 shadow-xs">
                      <span className="block text-[11px] uppercase tracking-wider text-amber-700 font-bold pb-2 border-b">Días de licencia tomados</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-extrabold text-amber-600 font-mono">-{employee.licenseDaysTaken}</span>
                        <span className="text-[10px] text-amber-500 font-bold">d</span>
                      </div>
                      <p className="text-[9px] text-slate-450 mt-1">Gozados por Art. 14.</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border-emerald-250 shadow-xs ring-2 ring-emerald-50 bg-emerald-50/15">
                      <span className="block text-[11px] uppercase tracking-wider text-emerald-800 font-extrabold pb-2 border-b">Saldo de licencia común</span>
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
                       Registro de Otros Artículos
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
                                {licenseStatusLabel(req.status)}
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
                              Promise.resolve(onUpdateAvatar(employee.id, file))
                                .then(() => triggerAlert('success', 'Foto de perfil cambiada correctamente.'))
                                .catch(() => triggerAlert('error', 'No se pudo cambiar la foto de perfil.'));
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
                              Promise.resolve(onUpdateAvatar(employee.id, file))
                                .then(() => triggerAlert('success', 'Foto de perfil cambiada correctamente.'))
                                .catch(() => triggerAlert('error', 'No se pudo cambiar la foto de perfil.'));
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

                  <form onSubmit={saveProfile} className="space-y-3 rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between"><strong className="text-sm">Información personal</strong>{!profileEditing && <button type="button" onClick={() => setProfileEditing(true)} className="text-xs font-bold text-indigo-700">Editar</button>}</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Nombre<input disabled={!profileEditing} value={profileFirstName} onChange={(event) => setProfileFirstName(event.target.value)} required className="mt-1 w-full rounded-xl border px-3 py-2 text-xs disabled:bg-slate-100" /></label>
                      <label className="text-[10px] font-bold uppercase text-slate-500">Apellido<input disabled={!profileEditing} value={profileLastName} onChange={(event) => setProfileLastName(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-xs disabled:bg-slate-100" /></label>
                      <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">Email<input type="email" disabled={!profileEditing} value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-xs disabled:bg-slate-100" /></label>
                      <label className="text-[10px] font-bold uppercase text-slate-500">CUIL<input disabled value={employee.cuil} className="mt-1 w-full rounded-xl border bg-slate-100 px-3 py-2 text-xs" /></label>
                      <label className="text-[10px] font-bold uppercase text-slate-500">Rol<input disabled value="Empleado" className="mt-1 w-full rounded-xl border bg-slate-100 px-3 py-2 text-xs" /></label>
                      <label className="text-[10px] font-bold uppercase text-slate-500 sm:col-span-2">Dependencia<input disabled value={employee.dependency} className="mt-1 w-full rounded-xl border bg-slate-100 px-3 py-2 text-xs" /></label>
                    </div>
                    {profileEditing && <div className="flex gap-2"><button className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">Guardar cambios</button><button type="button" onClick={() => setProfileEditing(false)} className="rounded-xl border px-4 py-2 text-xs font-bold">Cancelar</button></div>}
                  </form>

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
                        placeholder="********"
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
