import React, { useState } from 'react';
import { Employee, WorkLog, Project, LicenseRequest, LicenseRule, StrikeConfig } from '../types';
import { 
  Users, Calendar, Briefcase, Plus, Check, X, FileText, 
  User, ShieldAlert, Award, AlertCircle, FilePlus, ChevronRight, Settings, ArrowRight, Trash2, Key, ArrowUpDown,
  ArrowLeft, History, MessageSquare, Send
} from 'lucide-react';

interface AdminDashboardProps {
  employees: Employee[];
  workLogs: WorkLog[];
  projects: Project[];
  licenseRequests: LicenseRequest[];
  licenseRules: LicenseRule[];
  dependencies: string[];
  strikeConfig: StrikeConfig;
  currentAdmin: Employee;
  onUpdateStrikeConfig: (config: StrikeConfig) => void;
  onApproveRejectRequest: (id: string, status: 'aprobado' | 'rechazado') => any;
  onAddProject: (proj: Omit<Project, 'id' | 'status'>) => any;
  onUpdateProject?: (proj: Project) => void;
  onAddManualLicense: (req: Omit<LicenseRequest, 'id' | 'status' | 'dateRequested'> & { status: 'pendiente' | 'aprobado' }) => any;
  onAddEmployee: (emp: any) => any;
  onUpdateEmployee: (emp: Employee) => void;
  onSwapStrikeDutyOrders?: (empIdA: string, empIdB: string) => void;
  onDeleteEmployee?: (id: string) => void;
  onUpdateLicenseRequest: (req: LicenseRequest) => void;
  onDeleteLicenseRequest: (id: string) => void;
  remindedEmpIds: string[];
  setRemindedEmpIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function AdminDashboard({
  employees,
  workLogs,
  projects,
  licenseRequests,
  licenseRules,
  dependencies,
  strikeConfig,
  currentAdmin,
  onUpdateStrikeConfig,
  onApproveRejectRequest,
  onAddProject,
  onUpdateProject,
  onAddManualLicense,
  onAddEmployee,
  onUpdateEmployee,
  onSwapStrikeDutyOrders,
  onDeleteEmployee,
  onUpdateLicenseRequest,
  onDeleteLicenseRequest,
  remindedEmpIds,
  setRemindedEmpIds,
}: AdminDashboardProps) {
  const [adminTab, setAdminTab] = useState<'employees' | 'attendance' | 'projects' | 'strikes' | 'settings' | 'profile'>('employees');

  const todayStr = new Date().toISOString().split('T')[0];
  const nonAdminEmployees = employees.filter(e => !e.isAdmin);
  const agentsWithoutLog = nonAdminEmployees.filter(emp => {
    return !workLogs.some(log => log.employeeId === emp.id && log.date === todayStr);
  });

  // Selected employee detail state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(employees[0]?.id || null);

  // Selected project for detail view state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newUpdateText, setNewUpdateText] = useState('');

  // New project state
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDependency, setProjDependency] = useState(dependencies[0] || '');
  const [projAssignedIds, setProjAssignedIds] = useState<string[]>([]);

  // Manual license registry state
  const [manualEmpId, setManualEmpId] = useState(employees[0]?.id || '');
  const [manualArticle, setManualArticle] = useState(licenseRules[0]?.article || '');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualApprovedImmediately, setManualApprovedImmediately] = useState<boolean>(true);

  // New employee state
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPosition, setNewEmpPosition] = useState('');
  const [newEmpCuil, setNewEmpCuil] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [newEmpDependency, setNewEmpDependency] = useState('Oficina de Sistemas y Tecnología (SyTec)');
  const [newEmpTotalDays, setNewEmpTotalDays] = useState(0);
  const [newEmpRemote, setNewEmpRemote] = useState<string[]>([]);

  // States for Editing Employee Profile
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCuil, setEditCuil] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDependency, setEditDependency] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editTotalLicenseDays, setEditTotalLicenseDays] = useState(0);
  const [editRemoteDays, setEditRemoteDays] = useState<string[]>([]);
  const [editStrikeDutyOrder, setEditStrikeDutyOrder] = useState<number>(-1);

  // States for Editing a License Request
  const [editingLicenseId, setEditingLicenseId] = useState<string | null>(null);
  const [editLicenseArticle, setEditLicenseArticle] = useState('');
  const [editLicenseStart, setEditLicenseStart] = useState('');
  const [editLicenseEnd, setEditLicenseEnd] = useState('');
  const [editLicenseReason, setEditLicenseReason] = useState('');
  const [editLicenseStatus, setEditLicenseStatus] = useState<'pendiente' | 'aprobado' | 'rechazado'>('pendiente');

  // States for Admin's Self Profile
  const [adminProfileName, setAdminProfileName] = useState(currentAdmin.name);
  const [adminProfileEmail, setAdminProfileEmail] = useState(currentAdmin.email);
  const [adminProfilePassword, setAdminProfilePassword] = useState(currentAdmin.password);
  const [adminProfileAvatar, setAdminProfileAvatar] = useState(currentAdmin.avatar || '');

  // States for general license list searching and filtering
  const [licenseSearchQuery, setLicenseSearchQuery] = useState('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('todos');

  React.useEffect(() => {
    if (currentAdmin) {
      setAdminProfileName(currentAdmin.name);
      setAdminProfileEmail(currentAdmin.email);
      setAdminProfilePassword(currentAdmin.password);
      setAdminProfileAvatar(currentAdmin.avatar || '');
    }
  }, [currentAdmin]);

  const startEditingLicense = (lic: LicenseRequest) => {
    setEditingLicenseId(lic.id);
    setEditLicenseArticle(lic.article);
    setEditLicenseStart(lic.startDate);
    setEditLicenseEnd(lic.endDate);
    setEditLicenseReason(lic.reason);
    setEditLicenseStatus(lic.status);
  };

  const cancelEditingLicense = () => {
    setEditingLicenseId(null);
  };

  const saveEditedLicense = (lic: LicenseRequest) => {
    if (!editLicenseStart || !editLicenseEnd || !editLicenseReason.trim()) {
      triggerAlert('error', 'Por favor, completa la fecha de inicio, finalización y motivo.');
      return;
    }
    if (new Date(editLicenseStart) > new Date(editLicenseEnd)) {
      triggerAlert('error', 'La fecha de inicio no puede ser posterior a la de finalización.');
      return;
    }
    
    onUpdateLicenseRequest({
      ...lic,
      article: editLicenseArticle,
      startDate: editLicenseStart,
      endDate: editLicenseEnd,
      reason: editLicenseReason,
      status: editLicenseStatus,
    });
    setEditingLicenseId(null);
    triggerAlert('success', '¡Licencia modificada e impactada en los saldos dinámicos con éxito!');
  };

  const startEditingProfile = (emp: Employee) => {
    setEditName(emp.name);
    setEditEmail(emp.email);
    setEditCuil(emp.cuil || '');
    setEditPassword(emp.password || '');
    setEditDependency(emp.dependency);
    setEditPosition(emp.position || '');
    setEditTotalLicenseDays(emp.totalLicenseDays);
    setEditRemoteDays(emp.remoteDaysAssigned || []);
    setEditStrikeDutyOrder(emp.strikeDutyOrder || -1);
    setIsEditingProfile(true);
  };

  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    if (!editName.trim() || !editEmail.trim() || !editCuil.trim() || !editPassword.trim()) {
      triggerAlert('error', 'Por favor, completá todos los campos obligatorios (Nombre, Email, CUIL, Clave).');
      return;
    }

    onUpdateEmployee({
      ...selectedEmp,
      name: editName,
      email: editEmail,
      cuil: editCuil,
      password: editPassword,
      dependency: editDependency,
      position: editPosition,
      totalLicenseDays: editTotalLicenseDays,
      remoteDaysAssigned: editRemoteDays,
      strikeDutyOrder: editStrikeDutyOrder,
    });

    setIsEditingProfile(false);
    triggerAlert('success', `¡Perfil de ${editName} actualizado con éxito en toda la red!`);
  };

  const toggleEditRemoteDay = (day: string) => {
    if (editRemoteDays.includes(day)) {
      setEditRemoteDays(editRemoteDays.filter(d => d !== day));
    } else {
      setEditRemoteDays([...editRemoteDays, day]);
    }
  };

  const formatCuilString = (val: string) => {
    const cleanNum = val.replace(/\D/g, '');
    let formatted = '';
    if (cleanNum.length > 0) {
      formatted += cleanNum.substring(0, 2);
    }
    if (cleanNum.length > 2) {
      formatted += '-' + cleanNum.substring(2, 10);
    }
    if (cleanNum.length > 10) {
      formatted += '-' + cleanNum.substring(10, 11);
    }
    return formatted.substring(0, 13);
  };

  // Strike configuration editing state
  const [strikeNextDate, setStrikeNextDate] = useState<string>(strikeConfig.nextDate || '');
  const [strikeNextCoverId, setStrikeNextCoverId] = useState<string>(strikeConfig.nextCoverEmployeeId || '');
  const [strikeLastDate, setStrikeLastDate] = useState<string>(strikeConfig.lastDate || '');
  const [strikeLastCoverId, setStrikeLastCoverId] = useState<string>(strikeConfig.lastCoverEmployeeId || '');
  const [strikeNotes, setStrikeNotes] = useState<string>(strikeConfig.notes || '');

  // Automatic calculation of the next covering agent sequentially based on strikeLastCoverId
  const computedNextCoverId = React.useMemo(() => {
    const roster = employees
      .filter(e => e.strikeDutyOrder > 0)
      .sort((a, b) => a.strikeDutyOrder - b.strikeDutyOrder);
    
    if (roster.length === 0) return '';
    
    const lastIndex = roster.findIndex(e => e.id === strikeLastCoverId);
    if (lastIndex === -1 || lastIndex === roster.length - 1) {
      return roster[0].id;
    }
    return roster[lastIndex + 1].id;
  }, [strikeLastCoverId, employees]);

  React.useEffect(() => {
    if (computedNextCoverId && computedNextCoverId !== strikeNextCoverId) {
      setStrikeNextCoverId(computedNextCoverId);
    }
  }, [computedNextCoverId, strikeNextCoverId]);

  const handleAddEmployeeToStrikeRoster = (empId: string) => {
    const activeOrders = employees
      .filter(e => e.strikeDutyOrder > 0)
      .map(e => e.strikeDutyOrder);
    const nextOrder = activeOrders.length > 0 ? Math.max(...activeOrders) + 1 : 1;
    
    const empToUpdate = employees.find(e => e.id === empId);
    if (empToUpdate) {
      onUpdateEmployee({
        ...empToUpdate,
        strikeDutyOrder: nextOrder,
      });
      triggerAlert('success', `¡${empToUpdate.name} fue agregado al plantel de guardia de paro con orden #${nextOrder}!`);
    }
  };

  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [swappingSourceEmpId, setSwappingSourceEmpId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
    confirmText?: string;
  } | null>(null);

  const handleSwapOrders = (empIdA: string, empIdB: string) => {
    if (onSwapStrikeDutyOrders) {
      onSwapStrikeDutyOrders(empIdA, empIdB);
      triggerAlert('success', '¡Se completó el intercambio de turnos de guardia!');
    } else {
      const empA = employees.find(e => e.id === empIdA);
      const empB = employees.find(e => e.id === empIdB);
      if (empA && empB) {
        onUpdateEmployee({ ...empA, strikeDutyOrder: empB.strikeDutyOrder });
        onUpdateEmployee({ ...empB, strikeDutyOrder: empA.strikeDutyOrder });
        triggerAlert('success', '¡Turnos intercambiados!');
      }
    }
    setSwappingSourceEmpId(null);
  };

  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Calculations helper for employee remaining license days
  const getRemainingDays = (emp: Employee) => {
    return (emp.totalLicenseDays + emp.guardiasDone) - emp.licenseDaysTaken;
  };

  // Detail panel for a selected employee
  const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
  const selectedEmpLogs = selectedEmp 
    ? workLogs.filter(log => log.employeeId === selectedEmp.id).sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5)
    : [];
  const selectedEmpLicenses = selectedEmp 
    ? licenseRequests.filter(req => req.employeeId === selectedEmp.id).sort((a,b) => b.dateRequested.localeCompare(a.dateRequested))
    : [];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !projDesc.trim()) {
      triggerAlert('error', 'Por favor, completa el nombre y la descripción del proyecto.');
      return;
    }
    if (projAssignedIds.length === 0) {
      triggerAlert('error', 'Por favor, asigna al menos un empleado al proyecto.');
      return;
    }

    onAddProject({
      name: projName,
      description: projDesc,
      requesterDependency: projDependency,
      assignedEmployeeIds: projAssignedIds,
    });

    setProjName('');
    setProjDesc('');
    setProjAssignedIds([]);
    triggerAlert('success', 'Proyecto creado con éxito. Ahora los empleados pueden registrar avances vinculados.');
  };

  const handleAddProjectUpdateByAdmin = (projectId: string) => {
    if (!newUpdateText.trim()) {
      triggerAlert('error', 'Por favor, escribe el contenido de la actualización.');
      return;
    }
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const newUpdate = {
      id: `upd-${Date.now()}`,
      authorName: 'Administración',
      date: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
      content: newUpdateText.trim(),
    };

    const updatedProj: Project = {
      ...proj,
      updates: [...(proj.updates || []), newUpdate],
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProj);
      setNewUpdateText('');
      triggerAlert('success', 'Actualización de proyecto registrada con éxito.');
    }
  };

  const handleChangeProjectStatusObj = (projectId: string, newStatus: 'vigente' | 'completado' | 'pausado') => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const updatedProj: Project = {
      ...proj,
      status: newStatus,
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProj);
      triggerAlert('success', `Estado de proyecto cambiado a "${newStatus.toUpperCase()}".`);
    }
  };

  const handleCreateManualLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStart || !manualEnd || !manualReason.trim()) {
      triggerAlert('error', 'Por favor, completa el rango de fechas y la justificación.');
      return;
    }

    if (new Date(manualStart) > new Date(manualEnd)) {
      triggerAlert('error', 'La fecha de inicio no puede ser posterior a la de finalización.');
      return;
    }

    onAddManualLicense({
      employeeId: manualEmpId,
      article: manualArticle,
      startDate: manualStart,
      endDate: manualEnd,
      reason: manualReason,
      status: manualApprovedImmediately ? 'aprobado' : 'pendiente',
    });

    setManualStart('');
    setManualEnd('');
    setManualReason('');
    triggerAlert('success', manualApprovedImmediately ? 'Licencia registrada y aprobada instantáneamente.' : 'Licencia registrada como pendiente.');
  };

  const handleSaveStrikeConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!strikeNextDate || !strikeLastDate || !strikeLastCoverId) {
      triggerAlert('error', 'Por favor, completa todos los campos requeridos para la guardia de paro.');
      return;
    }

    onUpdateStrikeConfig({
      nextDate: strikeNextDate,
      nextCoverEmployeeId: strikeNextCoverId || computedNextCoverId,
      lastDate: strikeLastDate,
      lastCoverEmployeeId: strikeLastCoverId,
      notes: ''
    });

    triggerAlert('success', '¡Planes del próximo paro y guardia de contingencia sincronizados con éxito!');
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpEmail.trim() || !newEmpCuil.trim() || !newEmpPassword.trim()) {
      triggerAlert('error', 'Por favor completa todos los campos requeridos (Nombre, E-mail, CUIL y Clave Provisoria).');
      return;
    }

    onAddEmployee({
      name: newEmpName,
      email: newEmpEmail,
      dependency: newEmpDependency,
      position: newEmpPosition || 'Oficial',
      totalLicenseDays: newEmpTotalDays,
      licenseDaysTaken: 0,
      guardiasDone: 0,
      remoteDaysAssigned: newEmpRemote,
      cuil: newEmpCuil,
      password: newEmpPassword,
      mustChangePassword: true, // First login will require changing it!
    });

    setNewEmpName('');
    setNewEmpEmail('');
    setNewEmpPosition('');
    setNewEmpCuil('');
    setNewEmpPassword('');
    setNewEmpTotalDays(0);
    setNewEmpRemote([]);
    triggerAlert('success', `Empleado "${newEmpName}" con CUIL ${newEmpCuil} dado de alta con éxito con contraseña temporaria.`);
  };

  const handleSaveAdminSelfProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfileName.trim() || !adminProfileEmail.trim() || !adminProfilePassword.trim()) {
      triggerAlert('error', 'Por favor, completa los campos de Nombre, Correo y Contraseña.');
      return;
    }

    onUpdateEmployee({
      ...currentAdmin,
      name: adminProfileName,
      email: adminProfileEmail,
      password: adminProfilePassword,
      avatar: adminProfileAvatar,
    });

    triggerAlert('success', '¡Tus datos de perfil administrativo se han actualizado correctamente!');
  };

  // Helper toggle day for remote ho creation
  const toggleRemoteDay = (day: string) => {
    if (newEmpRemote.includes(day)) {
      setNewEmpRemote(newEmpRemote.filter(d => d !== day));
    } else {
      setNewEmpRemote([...newEmpRemote, day]);
    }
  };

  const toggleProjectAssigned = (id: string) => {
    if (projAssignedIds.includes(id)) {
      setProjAssignedIds(projAssignedIds.filter(item => item !== id));
    } else {
      setProjAssignedIds([...projAssignedIds, id]);
    }
  };

  // Days list for checkboxes 
  const DAYS_LIST = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  return (
    <div className="w-full">
      {/* Alert element */}
      {alertMsg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-xl border shadow-xl max-w-md animate-bounce ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {alertMsg.type === 'success' ? <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
          <div>
            <p className="font-semibold text-sm">{alertMsg.type === 'success' ? 'Operación Exitosa' : 'Atención'}</p>
            <p className="text-xs mt-0.5">{alertMsg.text}</p>
          </div>
        </div>
      )}

      {/* Reusable non-blocking custom confirmation dialog for embedded Iframe compatibility */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[150] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-fade-in text-slate-900">
            <h3 className="text-sm font-black tracking-wider text-slate-500 uppercase mb-2">Confirmar Acción</h3>
            <p className="text-sm text-slate-600 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer"
              >
                {confirmDialog.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard Area header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <span className="bg-red-50 text-red-700 border border-red-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Consola de Administración Activa
          </span>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-2.5">Panel de Control y Asistencia</h2>
          <p className="text-gray-500 text-sm mt-1">Supervisa fichadas diarias, licencias solicitadas por Ley y avance de proyectos.</p>
        </div>

        <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 w-full md:w-auto">
          <div className="text-center px-4 border-r border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Empleados</span>
            <span className="text-xl font-bold font-mono text-slate-800">{employees.length}</span>
          </div>
          <div className="text-center px-4 border-r border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Proyectos</span>
            <span className="text-xl font-bold font-mono text-indigo-700">{projects.length}</span>
          </div>
          <div className="text-center px-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Lic. Pendientes</span>
            <span className="text-xl font-bold font-mono text-rose-600">
              {licenseRequests.filter(r => r.status === 'pendiente').length}
            </span>
          </div>
        </div>
      </div>

      {/* Alerta de Registro Diario Pendiente para el Administrativo */}
      {agentsWithoutLog.length > 0 && (
        <div className="bg-red-50/80 border border-red-200 p-5 rounded-3xl mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-105 text-red-700 rounded-2xl">
              <ShieldAlert className="w-6 h-6 flex-shrink-0 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-md font-bold text-red-950 font-sans flex items-center gap-2">
                    🚨 Control de Parte Diario Pendiente
                  </h3>
                  <p className="text-xs text-red-800 mt-1">
                    Hay <strong>{agentsWithoutLog.length} de {nonAdminEmployees.length} agentes</strong> que todavía no han cargado su ficha de tareas del día de hoy (<strong>{todayStr}</strong>).
                  </p>
                </div>
                <div className="bg-red-200 text-red-900 border border-red-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest self-start sm:self-center font-mono">
                  ALERTA EN CURSO
                </div>
              </div>

              {/* Individual list of agents with a remind button */}
              <div className="mt-4 pt-4 border-t border-red-200/50">
                <p className="text-[10px] font-bold text-red-900 uppercase tracking-wider mb-2">Agentes pendientes y reanudaciones:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {agentsWithoutLog.map((emp) => {
                    const hasReminded = remindedEmpIds.includes(emp.id);
                    return (
                      <div key={emp.id} className="bg-white/90 p-3 rounded-2xl border border-red-100 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img 
                            src={emp.avatar} 
                            alt={emp.name} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-100 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{emp.name}</p>
                            <p className="text-[10px] text-red-650 font-medium truncate">{emp.dependency}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!hasReminded) {
                              setRemindedEmpIds(prev => [...prev, emp.id]);
                              triggerAlert('success', `Se ha generado y enviado un recordatorio de carga a ${emp.name}.`);
                            }
                          }}
                          disabled={hasReminded}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                            hasReminded
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default font-normal'
                              : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                          }`}
                        >
                          {hasReminded ? '✓ Recordado' : 'Notificar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto scrollbar-none gap-2">
        <button
          onClick={() => setAdminTab('employees')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            adminTab === 'employees'
              ? 'border-red-600 text-red-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Empleados ({employees.length})
        </button>
        <button
          onClick={() => setAdminTab('attendance')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            adminTab === 'attendance'
              ? 'border-red-600 text-red-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Asistencia & Licencias 
          {licenseRequests.some(r => r.status === 'pendiente') && (
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
          )}
        </button>
        <button
          onClick={() => setAdminTab('projects')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            adminTab === 'projects'
              ? 'border-red-600 text-red-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Proyectos Config. ({projects.length})
        </button>
        <button
          onClick={() => setAdminTab('strikes')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            adminTab === 'strikes'
              ? 'border-red-600 text-red-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-500" />
          Guardias de Paro (Medida de Fuerza)
        </button>
        <button
          onClick={() => setAdminTab('settings')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            adminTab === 'settings'
              ? 'border-red-600 text-red-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4 text-indigo-500" />
          Administración de Usuarios
        </button>
        <button
          onClick={() => setAdminTab('profile')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            adminTab === 'profile'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4 text-emerald-500" />
          Mi Perfil ({currentAdmin.name})
        </button>
      </div>

      {/* Main Admin Contents */}
      <div className="grid grid-cols-1 gap-8">
        {/* TAB 1: EMPLEADOS - List and Detail split */}
        {adminTab === 'employees' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Employee cards list */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Listado de Plantilla</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                {employees.map((emp) => {
                  const isSelected = emp.id === selectedEmployeeId;
                  const remaining = getRemainingDays(emp);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-red-50/55 border-red-300 shadow-md ring-2 ring-red-100' 
                          : 'bg-white border-gray-200 hover:border-gray-400 shadow-sm'
                      }`}
                      id={`emp-card-selection-${emp.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <img 
                          src={emp.avatar} 
                          alt={emp.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded inline-block">
                            {emp.dependency}
                          </p>
                          <h4 className="font-bold text-sm text-slate-900 truncate mt-1">{emp.name}</h4>
                          {emp.position && (
                            <p className="text-[10px] text-red-650 font-bold truncate">{emp.position}</p>
                          )}
                          <p className="text-[11px] text-gray-400 font-mono truncate">{emp.email}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-150 grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="block text-[9px] uppercase font-bold text-slate-400">Restan</span>
                          <strong className="text-gray-800 font-mono font-bold text-xs">{remaining} días</strong>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-lg">
                          <span className="block text-[9px] uppercase font-bold text-slate-400">Guardias</span>
                          <strong className="text-indigo-600 font-mono font-bold text-xs">{emp.guardiasDone} d</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Col: Selected Employee detailed info, logs and licenses */}
            <div className="lg:col-span-6">
              {selectedEmp ? (
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-6">
                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfileEdit} className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-3 mb-1">
                        <div>
                          <span className="text-xs font-black text-red-700 uppercase tracking-widest block">🔧 Gestión de Agente</span>
                          <h4 className="text-md font-bold text-slate-800">Modificar Perfil: {selectedEmp.name}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="text-slate-400 hover:text-red-650 cursor-pointer p-1"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Nombre Completo</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Correo Electrónico</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Cargo o Función</label>
                          <input
                            type="text"
                            value={editPosition}
                            onChange={(e) => setEditPosition(e.target.value)}
                            className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none"
                            placeholder="Ej. Oficial de Sistemas"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Dependencia de Adscripción</label>
                          <select
                            value={editDependency}
                            onChange={(e) => setEditDependency(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2.5"
                          >
                            <option value="Oficina de Sistemas y Tecnología (SyTec)">Oficina de Sistemas y Tecnología (SyTec)</option>
                            {dependencies.map((dep, idx) => (
                              <option key={idx} value={dep}>{dep}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">CUIL (Credencial de Acceso)</label>
                          <input
                            type="text"
                            value={editCuil}
                            onChange={(e) => setEditCuil(formatCuilString(e.target.value))}
                            className="w-full text-xs font-semibold font-mono bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Clave de Acceso</label>
                          <input
                            type="text"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Días de Feria del Año (Ordinarios)</label>
                          <input
                            type="number"
                            value={editTotalLicenseDays}
                            onChange={(e) => setEditTotalLicenseDays(Number(e.target.value))}
                            className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5"
                            min={0}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Orden en Guardia (Paros)</label>
                          <input
                            type="number"
                            value={editStrikeDutyOrder}
                            onChange={(e) => setEditStrikeDutyOrder(Number(e.target.value))}
                            className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-2">Home Office asignado (Días)</label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_LIST.map((day) => {
                            const isSelected = editRemoteDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => toggleEditRemoteDay(day)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                  isSelected 
                                    ? 'bg-amber-100 border-amber-350 text-amber-900 font-extrabold' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2.5 pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="cursor-pointer bg-slate-950 hover:bg-red-650 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md"
                        >
                          Guardar Perfil
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Head */}
                      <div className="flex items-start justify-between border-b pb-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={selectedEmp.avatar} 
                            alt={selectedEmp.name} 
                            className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-150">
                              {selectedEmp.dependency}
                            </span>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">{selectedEmp.name}</h3>
                            {selectedEmp.position && (
                              <p className="text-[11px] font-bold text-red-700 bg-red-100/60 px-2 py-0.5 rounded-lg inline-block mt-1">
                                Cargo: {selectedEmp.position}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 font-mono mt-1">{selectedEmp.email}</p>
                            <p className="text-[10px] text-slate-500 font-semibold mt-1">
                              CUIL: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-bold">{selectedEmp.cuil}</span>
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => startEditingProfile(selectedEmp)}
                          className="cursor-pointer bg-slate-950 hover:bg-red-600 text-white font-bold text-[10px] uppercase tracking-wide px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          Editar Datos
                        </button>
                      </div>

                      {/* General specs */}
                      <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                        <div>
                          <span className="text-[9px] uppercase text-gray-400 font-bold block">Acumulados (Guardias +)</span>
                          <span className="text-md font-bold font-mono text-indigo-600">+{selectedEmp.guardiasDone}d</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-gray-400 font-bold block">Tomados (Compensatorios -)</span>
                          <span className="text-md font-bold font-mono text-amber-600">-{selectedEmp.licenseDaysTaken}d</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-gray-400 font-bold block">Saldo Neto</span>
                          <span className="text-md font-bold font-mono text-emerald-600">{getRemainingDays(selectedEmp)}d</span>
                        </div>
                      </div>

                      <div className="space-y-1 bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-xs text-amber-900">
                        <p className="font-semibold text-[11px] uppercase tracking-wide text-amber-800 block">Días de Home office asignados:</p>
                        <div className="flex gap-1.5 mt-1">
                          {selectedEmp.remoteDaysAssigned.length === 0 ? (
                            <span className="italic text-gray-500">100% Presencial</span>
                          ) : (
                            selectedEmp.remoteDaysAssigned.map((d, i) => (
                              <span key={i} className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                {d}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Ultimate WorkLogs (listado corto) as requested */}
                  <div className="border-t pt-5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Últimos Partes Diarios ({selectedEmpLogs.length})</span>
                    </h4>

                    {selectedEmpLogs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No hay registros diarios cargados por este empleado.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedEmpLogs.map((log) => (
                          <div key={log.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                            <div className="flex items-center justify-between font-mono text-[10px] text-gray-400 mb-1">
                              <span>{log.date}</span>
                              <span className="uppercase font-bold text-slate-700">{log.mode}</span>
                            </div>
                            <p className="font-bold text-gray-900">{log.title}</p>
                            <p className="text-slate-600 mt-1 lines-2">{log.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ultimate Licenses (listado completo editable) as requested */}
                  <div className="border-t pt-5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                      Historial de Licencia y Guardias ({selectedEmpLicenses.length})
                    </h4>

                    {selectedEmpLicenses.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No registra solicitudes de licencias en el sistema.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedEmpLicenses.map((lic) => {
                          const isEditingThisLic = editingLicenseId === lic.id;
                          return (
                            <div key={lic.id}>
                              {isEditingThisLic ? (
                                <div className="p-3 bg-indigo-50/45 rounded-xl border border-indigo-200 space-y-3">
                                  <div className="text-[10px] uppercase font-bold text-indigo-805 mb-1 flex justify-between">
                                    <span>Modificando Registro de Licencia</span>
                                    <span className="font-mono text-slate-400 text-[8px]">ID: {lic.id}</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Artículo o Guardia</label>
                                      <select
                                        value={editLicenseArticle}
                                        onChange={(e) => setEditLicenseArticle(e.target.value)}
                                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-slate-800 font-semibold"
                                      >
                                        <option value="Guardia en Feria">Guardia en Feria (Suma días)</option>
                                        {licenseRules.map((rule) => (
                                          <option key={rule.id} value={rule.article}>
                                            {rule.article} - {rule.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Estado de Aprobación</label>
                                      <select
                                        value={editLicenseStatus}
                                        onChange={(e) => setEditLicenseStatus(e.target.value as any)}
                                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-slate-800 font-semibold"
                                      >
                                        <option value="pendiente">Pendiente (Sin impacto)</option>
                                        <option value="aprobado">Aprobado (Impacta saldo)</option>
                                        <option value="rechazado">Rechazado (Rechazada)</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Fecha Desde</label>
                                      <input
                                        type="date"
                                        value={editLicenseStart}
                                        onChange={(e) => setEditLicenseStart(e.target.value)}
                                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-mono"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Fecha Hasta</label>
                                      <input
                                        type="date"
                                        value={editLicenseEnd}
                                        onChange={(e) => setEditLicenseEnd(e.target.value)}
                                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-mono"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Observaciones / Motivo</label>
                                    <textarea
                                      rows={2}
                                      value={editLicenseReason}
                                      onChange={(e) => setEditLicenseReason(e.target.value)}
                                      placeholder="Justificativo o razón..."
                                      className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-slate-800 focus:outline-none"
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2 pt-1 border-t border-indigo-100">
                                    <button
                                      type="button"
                                      onClick={cancelEditingLicense}
                                      className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded font-bold text-slate-650 cursor-pointer"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => saveEditedLicense(lic)}
                                      className="px-3 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer transition-colors"
                                    >
                                      Guardar Licencia
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-2.5 rounded-lg border bg-white hover:bg-slate-50 transition-colors flex justify-between items-start text-xs">
                                  <div className="min-w-0 pr-2">
                                    <span className={`font-bold font-mono text-[10px] px-1.5 py-0.5 rounded mr-1.5 ${
                                      lic.article === 'Guardia en Feria' 
                                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' 
                                        : 'bg-amber-50 border border-amber-200 text-amber-800'
                                    }`}>
                                      {lic.article}
                                    </span>
                                    <span className="text-gray-700 text-[11px] font-bold">
                                      {lic.startDate} al {lic.endDate}
                                    </span>
                                    <p className="text-[10px] text-gray-500 mt-1 italic break-words">"{lic.reason}"</p>
                                  </div>
                                  <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                                      lic.status === 'aprobado' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                      lic.status === 'rechazado' ? 'bg-rose-50 text-rose-800 border-rose-200' : 
                                      'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}>
                                      {lic.status}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <button
                                        type="button"
                                        onClick={() => startEditingLicense(lic)}
                                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                                      >
                                        Modificar
                                      </button>
                                      <span className="text-[10px] text-slate-300 select-none">|</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setConfirmDialog({
                                            message: `¿Estás seguro/a de que deseas eliminar este registro de licencia (${lic.article})? Esta acción reajustará el saldo consumido del agente de forma reactiva.`,
                                            confirmText: 'Eliminar Licencia',
                                            onConfirm: () => {
                                              onDeleteLicenseRequest(lic.id);
                                              triggerAlert('success', `Se ha eliminado el registro de licencia del sistema.`);
                                            }
                                          });
                                        }}
                                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-slate-50 p-12 text-center rounded-2xl border border-dashed border-slate-300">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Selecciona algún empleado de la plantilla para ver su ficha completa.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ASISTENCIA & LICENCIAS */}
        {adminTab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Pending license requests & general list */}
            <div className="lg:col-span-7 space-y-6">
              {/* Box 1: Pending License Requests */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600 animate-pulse" /> Solicitudes de Licencia Pendientes
                </h3>

                {licenseRequests.filter(req => req.status === 'pendiente').length === 0 ? (
                  <div className="text-center py-8">
                    <Check className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm font-semibold">No hay solicitudes de licencias pendientes.</p>
                    <p className="text-gray-400 text-xs mt-1">¡Toda la plantilla está al día!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {licenseRequests.filter(req => req.status === 'pendiente').map((req) => {
                      const sender = employees.find(e => e.id === req.employeeId);
                      return (
                        <div key={req.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm relative">
                          <div className="flex items-start gap-3">
                            <img 
                              src={sender?.avatar} 
                              alt={sender?.name} 
                              className="w-10 h-10 rounded-lg object-cover border"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 rounded px-1.5 py-0.5 uppercase tracking-wider">
                                {req.article}
                              </span>
                              <p className="font-bold text-sm text-gray-900 mt-1">{sender?.name}</p>
                              <p className="text-xs text-gray-600 font-mono mt-0.5">Desde: {req.startDate} hasta: {req.endDate}</p>
                              <p className="text-xs text-slate-500 mt-2 bg-white/70 p-2.5 rounded-lg border border-slate-100 italic">
                                "{req.reason}"
                              </p>

                              {req.certificateName && (
                                <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white/40 p-1 rounded inline-block">
                                  📎 Certificado Adjunto: <span className="font-bold underline text-indigo-700">{req.certificateName}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end mt-4 pt-3 border-t">
                            <button
                              onClick={() => onApproveRejectRequest(req.id, 'rechazado')}
                              className="px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 font-bold rounded-lg border border-rose-200 flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" /> Rechazar
                            </button>
                            <button
                              onClick={() => {
                                onApproveRejectRequest(req.id, 'aprobado');
                                triggerAlert('success', `Solicitud de ${sender?.name} aprobada con éxito.`);
                              }}
                              className="px-3.5 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Aprobar y Descontar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Box 3: Historial Completo de Licencias Solicitadas */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                <div className="border-b pb-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" /> Registro de Licencias Solicitadas
                    </span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-0.5 rounded-full font-bold">
                      {licenseRequests.length} Registros
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-sans">
                    Control, edición y remoción unificada de todas las licencias del equipo (Aprobadas, Pendientes y Rechazadas).
                  </p>
                </div>

                {/* Filtros de Búsqueda y Estado */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Buscar por agente, artículo o motivo..."
                      value={licenseSearchQuery}
                      onChange={(e) => setLicenseSearchQuery(e.target.value)}
                      className="w-full text-xs h-9 bg-slate-50 border border-gray-300 rounded-xl px-3 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-550 focus:border-indigo-550 placeholder-slate-400"
                    />
                  </div>
                  <div className="sm:w-44">
                    <select
                      value={licenseStatusFilter}
                      onChange={(e) => setLicenseStatusFilter(e.target.value as any)}
                      className="w-full text-xs h-9 bg-white border border-gray-300 rounded-xl px-2.5 text-slate-700 focus:outline-none cursor-pointer font-medium"
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="pendiente">Pendientes ⏳</option>
                      <option value="aprobado">Aprobadas ✅</option>
                      <option value="rechazado">Rechazadas ❌</option>
                    </select>
                  </div>
                </div>

                {/* Listado de Solicitudes */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {licenseRequests
                    .filter((req) => {
                      const sender = employees.find((e) => e.id === req.employeeId);
                      const nameMatch = sender ? sender.name.toLowerCase().includes(licenseSearchQuery.toLowerCase()) : false;
                      const dependencyMatch = sender ? sender.dependency.toLowerCase().includes(licenseSearchQuery.toLowerCase()) : false;
                      const articleMatch = req.article.toLowerCase().includes(licenseSearchQuery.toLowerCase());
                      const reasonMatch = req.reason.toLowerCase().includes(licenseSearchQuery.toLowerCase());
                      const queryMatch = nameMatch || dependencyMatch || articleMatch || reasonMatch;

                      const statusMatch = licenseStatusFilter === 'todos' || req.status === licenseStatusFilter;
                      return queryMatch && statusMatch;
                    })
                    .sort((a, b) => b.startDate.localeCompare(a.startDate))
                    .length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs italic font-sans animate-fade-in">
                        No se encontraron registros de licencias que coincidan con los filtros aplicados.
                      </div>
                    ) : (
                      licenseRequests
                        .filter((req) => {
                          const sender = employees.find((e) => e.id === req.employeeId);
                          const nameMatch = sender ? sender.name.toLowerCase().includes(licenseSearchQuery.toLowerCase()) : false;
                          const dependencyMatch = sender ? sender.dependency.toLowerCase().includes(licenseSearchQuery.toLowerCase()) : false;
                          const articleMatch = req.article.toLowerCase().includes(licenseSearchQuery.toLowerCase());
                          const reasonMatch = req.reason.toLowerCase().includes(licenseSearchQuery.toLowerCase());
                          const queryMatch = nameMatch || dependencyMatch || articleMatch || reasonMatch;

                          const statusMatch = licenseStatusFilter === 'todos' || req.status === licenseStatusFilter;
                          return queryMatch && statusMatch;
                        })
                        .sort((a, b) => b.startDate.localeCompare(a.startDate))
                        .map((req) => {
                          const sender = employees.find((e) => e.id === req.employeeId);
                          const isEditingThisLic = editingLicenseId === req.id;

                          return (
                            <div key={req.id} className="border border-slate-150 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors">
                              {isEditingThisLic ? (
                                <div className="p-4 bg-indigo-50/45 space-y-3">
                                  <div className="text-[10px] uppercase font-bold text-indigo-900 flex justify-between items-center font-sans">
                                    <span>Modificando Registro (Licencia de {sender?.name})</span>
                                    <span className="font-mono text-slate-400 text-[8px]">ID: {req.id}</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                      <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Artículo o Guardia</label>
                                      <select
                                        value={editLicenseArticle}
                                        onChange={(e) => setEditLicenseArticle(e.target.value)}
                                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-slate-800 font-semibold"
                                      >
                                        <option value="Guardia en Feria">Guardia en Feria (Suma días)</option>
                                        {licenseRules.map((rule) => (
                                          <option key={rule.id} value={rule.article}>
                                            {rule.article} - {rule.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Estado de Aprobación</label>
                                      <select
                                        value={editLicenseStatus}
                                        onChange={(e) => setEditLicenseStatus(e.target.value as any)}
                                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-slate-805 font-semibold"
                                      >
                                        <option value="pendiente">Pendiente (Sin impacto)</option>
                                        <option value="aprobado">Aprobado (Impacta saldo)</option>
                                        <option value="rechazado">Rechazado (Rechazada)</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                      <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Fecha Desde</label>
                                      <input
                                        type="date"
                                        value={editLicenseStart}
                                        onChange={(e) => setEditLicenseStart(e.target.value)}
                                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-mono"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Fecha Hasta</label>
                                      <input
                                        type="date"
                                        value={editLicenseEnd}
                                        onChange={(e) => setEditLicenseEnd(e.target.value)}
                                        className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 font-mono"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[8px] font-bold text-gray-500 uppercase mb-1">Observaciones / Motivo</label>
                                    <textarea
                                      rows={2}
                                      value={editLicenseReason}
                                      onChange={(e) => setEditLicenseReason(e.target.value)}
                                      placeholder="Justificativo o razón..."
                                      className="w-full text-xs bg-white border border-slate-300 rounded p-1.5 text-slate-800 focus:outline-none"
                                    />
                                  </div>

                                  <div className="flex justify-end gap-2 pt-1.5 border-t border-indigo-100">
                                    <button
                                      type="button"
                                      onClick={cancelEditingLicense}
                                      className="px-2.5 py-1 text-[10px] bg-slate-150 hover:bg-slate-200 border border-slate-200 rounded font-bold text-slate-650 cursor-pointer"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => saveEditedLicense(req)}
                                      className="px-3 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer transition-colors"
                                    >
                                      Guardar Licencia
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3.5 bg-white hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                                  <div className="min-w-0 flex items-start gap-2.5">
                                    <img
                                      src={sender?.avatar}
                                      alt={sender?.name}
                                      className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="font-bold text-slate-800 truncate">{sender?.name}</p>
                                        <span className={`font-bold font-mono text-[9px] px-1.5 py-0.5 rounded ${
                                          req.article === 'Guardia en Feria' 
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                                            : 'bg-emerald-50 text-emerald-800 border border-emerald-150'
                                        }`}>
                                          {req.article}
                                        </span>
                                      </div>
                                      <p className="text-[10.5px] text-slate-600 font-medium font-mono mt-0.5">
                                        Período: <strong className="text-slate-800">{req.startDate}</strong> al <strong className="text-slate-800">{req.endDate}</strong>
                                      </p>
                                      {req.reason && (
                                        <p className="text-[10px] text-slate-400 truncate max-w-md mt-1 italic">
                                          "{req.reason}"
                                        </p>
                                      )}
                                      {req.certificateName && (
                                        <div className="text-[9px] text-slate-500 mt-1 font-mono">
                                          📎 Certificado: <span className="underline">{req.certificateName}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex sm:flex-col items-end gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0">
                                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                                      req.status === 'aprobado' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                      req.status === 'rechazado' ? 'bg-rose-50 text-rose-800 border-rose-200' : 
                                      'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}>
                                      {req.status}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => startEditingLicense(req)}
                                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                                      >
                                        Modificar
                                      </button>
                                      <span className="text-[10px] text-slate-300 select-none">|</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setConfirmDialog({
                                            message: `¿Estás seguro/a de que deseas eliminar este registro de licencia (${req.article}) de ${sender?.name || 'este agente'}? Esta acción reajustará el saldo consumido del agente de forma reactiva.`,
                                            confirmText: 'Eliminar Licencia',
                                            onConfirm: () => {
                                              onDeleteLicenseRequest(req.id);
                                              triggerAlert('success', `Se ha eliminado el registro de licencia de ${sender?.name}.`);
                                            }
                                          });
                                        }}
                                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                </div>
              </div>

              {/* Box 2: Chronological general logs list of attendance */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4 flex items-center justify-between">
                  <span>Listado de Asistencia y Partes Recientes</span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Fichadas</span>
                </h3>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {workLogs.sort((a,b) => b.date.localeCompare(a.date)).map((log) => {
                    const emp = employees.find(e => e.id === log.employeeId);
                    return (
                      <div key={log.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border text-xs">
                        <div className="flex items-start gap-2.5">
                          <img 
                            src={emp?.avatar} 
                            alt={emp?.name} 
                            className="w-8 h-8 rounded-full object-cover border"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{emp?.name}</p>
                            <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                              {log.date} en {emp?.dependency}
                            </span>
                            <p className="text-slate-600 mt-1">{log.title}</p>
                          </div>
                        </div>

                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          log.mode === 'presencial' ? 'bg-blue-50 text-blue-700' :
                          log.mode === 'remoto' ? 'bg-amber-50 text-amber-700' :
                          'bg-purple-50 text-purple-700'
                        }`}>
                          {log.mode}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Col: Manual licensing addition */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm self-start">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-indigo-600" /> Registrar Licencia Manual
              </h3>
              <p className="text-xs text-gray-500 mb-5">
                Carga una licencia solicitada por un empleado directamente en forma telefónica, presencial u oficio administrativo.
              </p>

              <form onSubmit={handleCreateManualLicense} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">
                    Seleccionar Empleado
                  </label>
                  <select
                    value={manualEmpId}
                    onChange={(e) => setManualEmpId(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-gray-300 rounded-xl px-3 py-3 text-gray-800 focus:outline-none"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} (Restan: {getRemainingDays(emp)}d)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">
                    Artículo / Ley Reguladora
                  </label>
                  <select
                    value={manualArticle}
                    onChange={(e) => setManualArticle(e.target.value)}
                    className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-3 text-gray-800 focus:outline-none"
                  >
                    {licenseRules.map((rule) => (
                      <option key={rule.id} value={rule.article}>
                        {rule.article} - {rule.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-2">Fecha Desde</label>
                    <input
                      type="date"
                      value={manualStart}
                      onChange={(e) => setManualStart(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-2">Fecha Hasta</label>
                    <input
                      type="date"
                      value={manualEnd}
                      onChange={(e) => setManualEnd(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2.5 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">
                    Observaciones / Motivo
                  </label>
                  <textarea
                    rows={2}
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    placeholder="Escribe el justificativo oficial..."
                    className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="manualApprovedImmediately"
                    checked={manualApprovedImmediately}
                    onChange={(e) => setManualApprovedImmediately(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="manualApprovedImmediately" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    Aprobar inmediatamente (Descuenta días)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer bg-red-650 hover:bg-black text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Cargar Licencia Oficial
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: PROYECTOS CONFIG. */}
        {adminTab === 'projects' && (
          <div className="w-full">
            {selectedProjectId ? (() => {
              const selectedProj = projects.find(p => p.id === selectedProjectId);
              if (!selectedProj) {
                setSelectedProjectId(null);
                return null;
              }

              // Get employee/work logs updates for this project
              const associatedLogs = workLogs.filter(w => (w?.title || '').toLowerCase().trim() === (selectedProj?.name || '').toLowerCase().trim());
              const adminUpdates = selectedProj.updates || [];

              // Unify timeline
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
                  {/* Top Action & Back block */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedProjectId(null)}
                        className="p-2 hover:bg-slate-100 rounded-xl border border-gray-200 transition-all text-gray-500 hover:text-gray-900 cursor-pointer"
                        title="Volver al Listado"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider">
                            {selectedProj.requesterDependency}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            selectedProj.status === 'vigente' 
                              ? 'bg-emerald-55 text-emerald-800 border border-emerald-100' 
                              : selectedProj.status === 'pausado' 
                              ? 'bg-amber-50 text-amber-800 border border-amber-100'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {selectedProj.status === 'vigente' ? 'Vigente' : selectedProj.status === 'pausado' ? 'Pausado' : 'Completado'}
                          </span>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mt-1">{selectedProj.name}</h4>
                      </div>
                    </div>

                    {/* Quick status controls */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <label className="text-xs font-bold text-gray-500 uppercase">Estado:</label>
                      <select
                        value={selectedProj.status}
                        onChange={(e) => handleChangeProjectStatusObj(selectedProj.id, e.target.value as any)}
                        className="text-xs font-semibold bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-gray-850 focus:outline-none"
                      >
                        <option value="vigente">Vigente (Activo)</option>
                        <option value="pausado">Pausado</option>
                        <option value="completado">Completado</option>
                      </select>
                    </div>
                  </div>

                  {/* Body Content Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left side actions and team stats */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* Subir Actualizacion card */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                        <h5 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" /> Cargar Actualización Oficial
                        </h5>
                        <p className="text-xs text-gray-550 mb-4">
                          Publicá novedades administrativas, prioridades o directivas sobre este proyecto. Se indexará para consulta de toda la oficina en tiempo real.
                        </p>

                        <div className="space-y-4">
                          <div>
                            <textarea
                              rows={4}
                              value={newUpdateText}
                              onChange={(e) => setNewUpdateText(e.target.value)}
                              placeholder="Escribí aquí las nuevas directivas o el estado actual del desarrollo de este proyecto..."
                              className="w-full text-xs border border-gray-200 rounded-xl p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            ></textarea>
                          </div>
                          
                          <button
                            onClick={() => handleAddProjectUpdateByAdmin(selectedProj.id)}
                            className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <Send className="w-3.5 h-3.5" /> Publicar Novedad Directa
                          </button>
                        </div>
                      </div>

                      {/* Team Card list */}
                      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                        <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wider border-b pb-2">Equipo Asignado</h5>
                        <div className="space-y-3">
                          {selectedProj.assignedEmployeeIds.map((empId) => {
                            const emp = employees.find(e => e.id === empId);
                            return (
                              <div key={empId} className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <img
                                  src={emp?.avatar}
                                  alt={emp?.name}
                                  className="w-8 h-8 rounded-full border shadow-xs"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{emp?.name}</p>
                                  <p className="text-[10px] text-indigo-650 font-semibold">{emp?.dependency}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Brief statistics */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200">
                        <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-3">Métricas del Proyecto</h5>
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-xs">
                            <span className="block text-[9px] uppercase tracking-wide text-gray-400 font-bold mb-1">Partes de Equipo</span>
                            <span className="text-xl font-extrabold text-blue-600 font-mono">{associatedLogs.length}</span>
                          </div>
                          <div className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-xs">
                            <span className="block text-[9px] uppercase tracking-wide text-gray-400 font-bold mb-1">Directas Admin</span>
                            <span className="text-xl font-extrabold text-emerald-600 font-mono">{adminUpdates.length}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-3 font-sans leading-relaxed text-center">
                          Descripción original: <span className="italic">"{selectedProj.description}"</span>
                        </p>
                      </div>

                    </div>

                    {/* Right side combined timeline feed */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                      <div className="flex items-center justify-between border-b pb-3.5 mb-5">
                        <div className="flex items-center gap-2">
                          <History className="w-4.5 h-4.5 text-slate-600 animate-pulse" />
                          <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">Historial Integrado de Avances</h5>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold font-mono px-2 py-0.5 rounded">
                          {combinedTimeline.length} actualizaciones en total
                        </span>
                      </div>

                      {combinedTimeline.length === 0 ? (
                        <div className="py-12 text-center text-gray-405">
                          <p className="text-xs italic">Este proyecto aún no registra movimientos ni directivas oficiales.</p>
                          <p className="text-[10px] text-gray-400 mt-1">Los avances aparecerán a medida que los agentes reporten partes o el administrador cargue novedades.</p>
                        </div>
                      ) : (
                        <div className="relative border-l border-indigo-100 pl-4 ml-2 space-y-6">
                          {combinedTimeline.map((item) => {
                            const isAdminType = item.type === 'admin';
                            return (
                              <div key={item.id} className="relative">
                                {/* Timeline icon/node */}
                                <span className={`absolute -left-[25px] mt-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shadow-xs ${
                                  isAdminType 
                                    ? 'bg-rose-500 border-white' 
                                    : 'bg-indigo-600 border-white'
                                }`} />

                                <div className={`p-4 rounded-xl border transition-all ${
                                  isAdminType
                                    ? 'bg-gradient-to-r from-rose-50/40 to-indigo-50/10 border-rose-200 shadow-xs'
                                    : 'bg-white border-gray-150 shadow-xs'
                                }`}>
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={item.avatar}
                                        alt={item.authorName}
                                        className="w-5 h-5 rounded-full border border-gray-200"
                                        referrerPolicy="no-referrer"
                                      />
                                      <span className="text-xs font-bold text-gray-800">
                                        {item.authorName}
                                      </span>
                                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                        isAdminType 
                                          ? 'bg-rose-100 text-rose-700' 
                                          : 'bg-indigo-100 text-indigo-700'
                                      }`}>
                                        {isAdminType ? 'Actualización Directa Admin' : 'Parte Diario de Equipo'}
                                      </span>
                                    </div>
                                    <span className="text-[9px] font-mono font-medium text-gray-400">
                                      {item.date}
                                    </span>
                                  </div>

                                  <p className={`text-xs text-slate-700 leading-relaxed font-sans`}>
                                    {item.content}
                                  </p>

                                  {item.mode && (
                                    <div className="mt-2 text-[9px] text-gray-405 font-mono flex items-center gap-1 bg-slate-50 w-max px-1.5 py-0.5 rounded border">
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form list charging area */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm self-start animate-fade-in">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FilePlus className="w-5 h-5 text-indigo-600" /> Crear Proyecto Vigente
                  </h3>
                  <p className="text-xs text-gray-500 mb-5">
                    Crea un proyecto para que los empleados asignados puedan reportar tareas asociadas mediante coincidencia de título.
                  </p>

                  <form onSubmit={handleCreateProject} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                        Nombre del Proyecto
                      </label>
                      <input
                        type="text"
                        value={projName}
                        onChange={(e) => setProjName(e.target.value)}
                        placeholder="Ej. Digitalización de Expedientes de SyTec"
                        className="w-full text-xs font-semibold border border-gray-300 rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                        Dependencia Solicitante
                      </label>
                      <select
                        value={projDependency}
                        onChange={(e) => setProjDependency(e.target.value)}
                        className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-3"
                      >
                        {dependencies.map((dep, idx) => (
                          <option key={idx} value={dep}>{dep}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-2">
                        Empleados Asignados
                      </label>
                      <div className="bg-slate-50 border rounded-xl p-3 max-h-36 overflow-y-auto space-y-2">
                        {employees.map((emp) => {
                          const isChecked = projAssignedIds.includes(emp.id);
                          return (
                            <div 
                              key={emp.id} 
                              onClick={() => toggleProjectAssigned(emp.id)}
                              className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 hover:bg-slate-100 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                              />
                              <span>{emp.name} ({emp.dependency})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                        Breve Descripción del Objetivo
                      </label>
                      <textarea
                        rows={3}
                        value={projDesc}
                        onChange={(e) => setProjDesc(e.target.value)}
                        placeholder="Escribe el alcance u objetivos clave..."
                        className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:outline-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full cursor-pointer bg-slate-900 hover:bg-black text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Publicar Proyecto Vigente
                    </button>
                  </form>
                </div>

                {/* List & details of projects with live synced updates */}
                <div className="lg:col-span-7 space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-slate-900">Proyectos de la Organización</h3>

                  {projects.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border text-slate-400">
                      <Briefcase className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No has publicado ningún proyecto aún.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projects.map((proj) => {
                        const associatedLogs = workLogs.filter(w => (w?.title || '').toLowerCase().trim() === (proj?.name || '').toLowerCase().trim());
                        const adminUpdatesCount = proj.updates?.length || 0;
                        return (
                          <div key={proj.id} className="bg-white p-5 rounded-xl border hover:border-indigo-200 transition-all shadow-sm flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  {proj.requesterDependency}
                                </span>
                                <span className={`text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full uppercase ${
                                  proj.status === 'vigente' 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : proj.status === 'pausado' 
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {proj.status}
                                </span>
                              </div>

                              <h4 className="font-bold text-md text-slate-900 line-clamp-1">{proj.name}</h4>
                              <p className="text-xs text-gray-500 mt-1 lines-2 leading-relaxed h-11 overflow-hidden">{proj.description}</p>

                              {/* Team quick indicator */}
                              <div className="mt-3">
                                <span className="text-[9px] text-gray-400 font-bold block uppercase mb-1">Equipo</span>
                                <div className="flex -space-x-1.5 overflow-hidden">
                                  {proj.assignedEmployeeIds.map((empId, idx) => {
                                    const emp = employees.find(e => e.id === empId);
                                    if (!emp) return null;
                                    return (
                                      <img
                                        key={empId}
                                        src={emp.avatar}
                                        alt={emp.name}
                                        className="w-5 h-5 rounded-full border border-white"
                                        referrerPolicy="no-referrer"
                                        title={emp.name}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Clickable footer */}
                            <div className="mt-4 pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-3">
                                <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  {associatedLogs.length} partes diarios
                                </span>
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {adminUpdatesCount} directivas
                                </span>
                              </div>

                              <button
                                onClick={() => setSelectedProjectId(proj.id)}
                                className="w-full flex items-center justify-center gap-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                Ingresar al Proyecto <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: PLANIFICACION DE PAROS Y GUARDIAS */}
        {adminTab === 'strikes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Area: Setup form */}
            <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-gray-150 shadow-sm animate-fade-in">
              <h3 className="text-xl font-bold text-slate-950 mb-2 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-red-600" /> Programación de Paros y Guardias
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-sans leading-relaxed">
                Carga la fecha del próximo paro convocado en el Poder Judicial de la Nación para que se actualice de forma automática en los perfiles de los empleados y se asigne correctamente al agente que debe cubrir la guardia mínima obligatoria.
              </p>

              <form onSubmit={handleSaveStrikeConfig} className="space-y-6">
                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 space-y-4">
                  <span className="text-xs font-bold text-red-800 uppercase tracking-wide block">
                    Próxima Medida de Fuerza (A Convocarse)
                  </span>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-650 uppercase mb-2">
                        Fecha del Próximo Paro
                      </label>
                      <input
                        type="date"
                        value={strikeNextDate}
                        onChange={(e) => setStrikeNextDate(e.target.value)}
                        className="w-full text-xs font-semibold border border-gray-300 rounded-xl px-4 py-2.5 bg-white"
                        required
                      />
                    </div>

                    {(() => {
                      const activeNextAgent = employees.find(e => e.id === (strikeNextCoverId || computedNextCoverId));
                      return (
                        <div className="bg-white p-3.5 rounded-xl border border-red-200/60 text-xs">
                          <span className="block text-[10px] font-extrabold text-red-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            🔄 Agente Designado por Rotación (Automático)
                          </span>
                          {activeNextAgent ? (
                            <div className="flex items-center gap-2.5 mt-1 bg-red-50/40 p-2.5 rounded-xl border border-red-105">
                              <img 
                                src={activeNextAgent.avatar} 
                                alt={activeNextAgent.name} 
                                className="w-7 h-7 rounded-lg object-cover border border-red-150"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block truncate">{activeNextAgent.name}</span>
                                <span className="text-[9.5px] text-slate-400 block truncate">{activeNextAgent.position || 'Agente'}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500 italic block mt-1">No hay agentes en el plantel de guardia de paro para asignar</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-4">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Último Paro Registrado (Historial)
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-650 uppercase mb-2">
                        Fecha del Último Paro
                      </label>
                      <input
                        type="date"
                        value={strikeLastDate}
                        onChange={(e) => setStrikeLastDate(e.target.value)}
                        className="w-full text-xs font-semibold border border-gray-300 rounded-xl px-4 py-2.5 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-650 uppercase mb-2">
                        Quién Cubrió
                      </label>
                      <select
                        value={strikeLastCoverId}
                        onChange={(e) => setStrikeLastCoverId(e.target.value)}
                        className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-2.5"
                        required
                      >
                        <option value="">-- Seleccionar Agente --</option>
                        {employees
                          .filter(e => e.strikeDutyOrder > 0)
                          .map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.position || 'Agente'})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer bg-red-600 hover:bg-black text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Guardar y Sincronizar Guardias
                </button>
              </form>
            </div>

            {/* Right Area: Strike standbys list */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm animate-fade-in">
                <h4 className="text-sm font-bold text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-500" /> Plantel Afectado a Guardia de Paro
                </h4>

                <div className="space-y-3">
                  {employees
                    .filter(e => e.strikeDutyOrder > 0)
                    .sort((a, b) => a.strikeDutyOrder - b.strikeDutyOrder)
                    .map((emp, idx) => {
                      const isNext = emp.id === strikeConfig.nextCoverEmployeeId;
                      const isLastCover = emp.id === strikeConfig.lastCoverEmployeeId;
                      return (
                        <div 
                          key={emp.id}
                          className={`p-3 rounded-xl border flex flex-col gap-2.5 text-xs transition-all ${
                            isNext 
                              ? 'bg-red-50 hover:bg-red-50/90 border-red-200 ring-2 ring-red-100' 
                              : isLastCover 
                                ? 'bg-indigo-50/60 border-indigo-200' 
                                : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isNext ? 'bg-red-600 text-white' : 'bg-slate-300 text-slate-700'
                            }`}>
                              {idx + 1}
                            </span>

                            <img 
                              src={emp.avatar} 
                              alt={emp.name} 
                              className="w-8 h-8 rounded-lg object-cover"
                              referrerPolicy="no-referrer"
                            />

                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-slate-950 block truncate">{emp.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{emp.position || 'Agente'}</span>
                            </div>

                            <div className="flex flex-col gap-1 items-end">
                              {isNext && (
                                <span className="bg-red-100 text-red-700 font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                                  Próxima Guardia
                                </span>
                              )}
                              {isLastCover && (
                                <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                                  Cubrió Último
                                </span>
                              )}
                            </div>
                          </div>

                          {/* INTERCAMBIAR GUI */}
                          <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between gap-2">
                            {swappingSourceEmpId === emp.id ? (
                              <div className="w-full flex items-center gap-1.5 justify-between">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wide">Intercambiar por:</span>
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      const targetId = e.target.value;
                                      if (targetId) {
                                        handleSwapOrders(emp.id, targetId);
                                      }
                                    }}
                                    className="text-[10px] bg-white border border-slate-300 rounded-lg px-2 py-1 max-w-[140px] truncate font-bold text-slate-800"
                                  >
                                    <option value="">-- Seleccionar --</option>
                                    {employees
                                      .filter(other => other.strikeDutyOrder > 0 && other.id !== emp.id)
                                      .sort((a, b) => a.strikeDutyOrder - b.strikeDutyOrder)
                                      .map(other => (
                                        <option key={other.id} value={other.id}>
                                          {other.name}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSwappingSourceEmpId(null)}
                                  className="cursor-pointer text-red-500 hover:text-red-800 text-[9px] font-extrabold uppercase bg-white px-2 py-0.5 rounded-md border border-red-200"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="w-full flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => setSwappingSourceEmpId(emp.id)}
                                  className="cursor-pointer text-slate-500 hover:text-indigo-600 hover:bg-white text-[9px] font-bold px-2 py-1 rounded-lg border border-slate-200 hover:border-indigo-350 transition-all flex items-center gap-1"
                                >
                                  <ArrowUpDown className="w-3 h-3 text-slate-400" /> Intercambiar turno
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* AGENTES FUERA DEL PLANTEL */}
                {(() => {
                  const poolEmployees = employees.filter(e => !e.isAdmin && (e.strikeDutyOrder === undefined || e.strikeDutyOrder <= 0));
                  if (poolEmployees.length === 0) return null;
                  return (
                    <div className="mt-6 pt-6 border-t border-slate-150 space-y-3">
                      <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        ➕ Agentes Disponibles Para Sumar
                      </h5>
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Ingresantes, interinos o agentes que no pertenecen actualmente al plantel de guardia:
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {poolEmployees.map((emp) => (
                          <div key={emp.id} className="p-2.5 rounded-xl border border-slate-150 bg-slate-50/50 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img 
                                src={emp.avatar} 
                                alt={emp.name} 
                                className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 block truncate">{emp.name}</span>
                                <span className="text-[9px] text-slate-400 block truncate">{emp.position || 'Agente'}</span>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleAddEmployeeToStrikeRoster(emp.id)}
                              className="cursor-pointer bg-slate-100 hover:bg-slate-250 text-slate-700 hover:text-indigo-700 text-[10px] font-black px-2.5 py-1.5 rounded-lg border border-slate-205 transition-all flex items-center gap-1 whitespace-nowrap"
                            >
                              <Plus className="w-3 h-3 text-indigo-500" /> Sumar al listado
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-150 text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-750">Último Paro registrado:</span> {strikeConfig.lastDate ? `${strikeConfig.lastDate}` : 'No definido'} cubierto por <strong className="text-slate-800">{employees.find(e => e.id === strikeConfig.lastCoverEmployeeId)?.name || 'Nadie'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USER ADMINISTRATION (SPLIT VIEW WITH USER GRID AND NEW REGISTRATION) */}
        {adminTab === 'settings' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Left Area: Complete user list & credentials management */}
            <div className="xl:col-span-7 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <span className="p-1.5 bg-slate-150 rounded-xl text-indigo-700">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </span>
                  Cuentas de Usuarios Registradas
                </h3>
                <p className="text-xs text-gray-400">
                  Visualizá de forma prolija los usuarios registrados. Podés editar los CUILs directamente, restablecer contraseñas de forma segura sin exponerlas, y cambiar la jerarquía de permisos al instante.
                </p>
              </div>

              {/* Responsive Table of Users with Inline Editing */}
              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-500 uppercase font-bold bg-slate-50">
                      <th className="py-3.5 px-4 font-black">Agente / Cargo</th>
                      <th className="py-3.5 px-4 font-black">CUIL / Usuario</th>
                      <th className="py-3.5 px-4 font-black">Clave de Acceso</th>
                      <th className="py-3.5 px-4 font-black">Nivel de Permisos</th>
                      <th className="py-3.5 px-4 font-black text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp) => {
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Profile with avatar */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={emp.avatar} 
                                alt={emp.name} 
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-slate-50 flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block truncate">{emp.name}</span>
                                <span className="text-[10px] text-red-650 font-bold block truncate mt-0.5">{emp.position || 'Agente'}</span>
                                <span className="text-[9px] text-slate-400 block truncate mt-0.5">{emp.dependency}</span>
                              </div>
                            </div>
                          </td>

                          {/* CUIL (Username) */}
                          <td className="py-4 px-4 font-mono font-bold text-slate-700">
                            <input
                              type="text"
                              value={emp.cuil}
                              onChange={(e) => {
                                onUpdateEmployee({
                                  ...emp,
                                  cuil: formatCuilString(e.target.value)
                                });
                              }}
                              className="w-32 px-2.5 py-1.5 border border-slate-250 rounded-lg font-mono text-[11px] bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 font-bold"
                              placeholder="XX-XXXXXXXX-X"
                            />
                          </td>

                          {/* Editable Password hidden and resetting enabled */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-semibold tracking-widest text-[10px]">••••••••</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newPass = window.prompt(`Establecer nueva contraseña para ${emp.name}:`, "");
                                  if (newPass !== null) {
                                    if (newPass.trim() === "") {
                                      triggerAlert('error', 'La contraseña no puede estar vacía.');
                                      return;
                                    }
                                    onUpdateEmployee({
                                      ...emp,
                                      password: newPass.trim()
                                    });
                                    triggerAlert('success', `Contraseña de ${emp.name} restablecida con éxito.`);
                                  }
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-705 inline-flex items-center gap-1.5 font-bold rounded-lg text-[10px] cursor-pointer transition-colors"
                              >
                                <Key className="w-3.5 h-3.5 text-indigo-600" />
                                Resetear
                              </button>
                            </div>
                          </td>

                          {/* Permission levels (Super / Regular) */}
                          <td className="py-4 px-4">
                            <button
                              type="button"
                              onClick={() => {
                                const newAdminStatus = !emp.isAdmin;
                                onUpdateEmployee({
                                  ...emp,
                                  isAdmin: newAdminStatus
                                });
                                triggerAlert('success', `Jerarquía modificada: ${emp.name} ahora es ${newAdminStatus ? 'Directivo/Admin' : 'Agente Regular'}.`);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[9px] uppercase font-extrabold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                                emp.isAdmin 
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 font-black' 
                                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <ShieldAlert className={`w-3 h-3 ${emp.isAdmin ? 'text-rose-600' : 'text-slate-400'}`} />
                              {emp.isAdmin ? 'Dirección' : 'Agente'}
                            </button>
                          </td>

                          {/* Delete Action with verification */}
                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (emp.name.includes('Julieta Borgna') || emp.id === 'emp-1') {
                                  triggerAlert('error', 'Por seguridad, no se puede eliminar la cuenta de Prosecretaria de Julieta Borgna.');
                                  return;
                                }
                                setConfirmDialog({
                                  message: `¿Estás seguro de que querés eliminar la cuenta de ${emp.name} del sistema? Se perderán todos sus datos y no podrá volver a iniciar sesión.`,
                                  confirmText: 'Eliminar Cuenta',
                                  onConfirm: () => {
                                    if (onDeleteEmployee) {
                                      onDeleteEmployee(emp.id);
                                      triggerAlert('success', `La cuenta de ${emp.name} fue eliminada del sistema.`);
                                    }
                                  }
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer inline-flex"
                              title="Dar de baja agente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Area: NEW EMPLOYEE REGISTRY FORM */}
            <div className="xl:col-span-5 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm self-start space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 rounded-xl text-indigo-700">
                    <Plus className="w-5 h-5 text-indigo-600" />
                  </span>
                  Alta de Nuevo Empleado / Cuenta
                </h3>
                <p className="text-xs text-gray-500">
                  Registrá un nuevo miembro de la dependencia asignando su CUIL provisorio de acceso, cargo reglamentario y modalidad laboral.
                </p>
              </div>

              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Nombre Completo</label>
                    <input
                      type="text"
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                      placeholder="Ej. Juan Ignacio Pérez"
                      className="w-full text-xs font-semibold border border-gray-350 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Correo Electrónico (Oficial)</label>
                    <input
                      type="email"
                      value={newEmpEmail}
                      onChange={(e) => setNewEmpEmail(e.target.value)}
                      placeholder="juan.perez@pjn.gov.ar"
                      className="w-full text-xs font-semibold border border-gray-350 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Cargo o Función</label>
                    <input
                      type="text"
                      value={newEmpPosition}
                      onChange={(e) => setNewEmpPosition(e.target.value)}
                      placeholder="Ej. Escribiente"
                      className="w-full text-xs font-semibold border border-gray-355 rounded-xl px-4 py-2.5 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">CUIL (Credencial Acceso)</label>
                      <input
                        type="text"
                        value={newEmpCuil}
                        onChange={(e) => setNewEmpCuil(formatCuilString(e.target.value))}
                        placeholder="20-XXXXXXXX-9"
                        className="w-full text-xs font-semibold border border-gray-355 rounded-xl px-4 py-2.5 focus:outline-none font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Clave de Acceso</label>
                      <input
                        type="text"
                        value={newEmpPassword}
                        onChange={(e) => setNewEmpPassword(e.target.value)}
                        placeholder="Ej. clave123"
                        className="w-full text-xs font-semibold border border-gray-355 rounded-xl px-4 py-2.5 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Dependencia</label>
                    <select
                      value={newEmpDependency}
                      onChange={(e) => setNewEmpDependency(e.target.value)}
                      className="w-full text-xs bg-white border border-gray-355 rounded-xl px-3 py-2.5"
                    >
                      <option value="Oficina de Sistemas y Tecnología (SyTec)">Oficina de Sistemas y Tecnología (SyTec)</option>
                      {dependencies.map((dep, idx) => (
                        <option key={idx} value={dep}>{dep}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-2">Días Autorizados para Home office</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DAYS_LIST.map((day) => {
                        const isSelected = newEmpRemote.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleRemoteDay(day)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              isSelected 
                                ? 'bg-amber-100 hover:bg-amber-150 border-amber-300 text-amber-800' 
                                : 'bg-slate-50 border-gray-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer bg-slate-950 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4"
                >
                  <Plus className="w-4 h-4" /> Dar de Alta Agente en Sistemas
                </button>
              </form>
            </div>

          </div>
        )}

        {/* TAB 6: PROFILE - Administrador Self Profile (Mi Perfil) */}
        {adminTab === 'profile' && (
          <div className="bg-white p-6 max-w-2xl mx-auto rounded-3xl border border-gray-150 shadow-md space-y-8 animate-fadeIn">
            {/* Cabecera de Ficha de Perfil Personal */}
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-gray-100">
              <div className="relative shrink-0">
                <img
                  src={adminProfileAvatar || "https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=cbd5e1"}
                  alt={currentAdmin.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 bg-slate-50 shadow-md"
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-black text-slate-850">{currentAdmin.name}</h3>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{currentAdmin.position || 'Prosecretario Administrativo'}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  <span className="bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700 px-2 py-0.5 rounded-md">
                    Credencial de Dirección / Prosecretaría
                  </span>
                  <span className="bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 px-2 py-0.5 rounded-md">
                    Sistemas & Sistemas PJN
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario de Configuración Personal */}
            <form onSubmit={handleSaveAdminSelfProfile} className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col gap-3.5">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <User className="w-4 h-4 text-slate-500" /> Información Oficial de Acceso
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">CUIL de Acceso</label>
                    <input
                      type="text"
                      value={currentAdmin.cuil || ''}
                      disabled
                      className="w-full text-xs font-mono font-bold bg-slate-100 cursor-not-allowed border border-gray-200 rounded-xl px-3 py-2 text-slate-500"
                    />
                    <p className="text-[9px] text-gray-400 mt-1 italic">Vínculo institucional permanente, inalterable.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dependencia Oficial</label>
                    <input
                      type="text"
                      value={currentAdmin.dependency || ''}
                      disabled
                      className="w-full text-xs font-semibold bg-slate-100 cursor-not-allowed border border-gray-200 rounded-xl px-3 py-2 text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b pb-1">
                  <Settings className="w-3.5 h-3.5 text-indigo-500" /> Edición de Datos Personales o Clave
                </h4>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={adminProfileName}
                    onChange={(e) => setAdminProfileName(e.target.value)}
                    className="w-full text-xs font-semibold border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Correo Electrónico Institucional</label>
                  <input
                    type="email"
                    value={adminProfileEmail}
                    onChange={(e) => setAdminProfileEmail(e.target.value)}
                    className="w-full text-xs font-semibold border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-505" /> Contraseña de Dirección
                  </label>
                  <input
                    type="text"
                    value={adminProfilePassword}
                    onChange={(e) => setAdminProfilePassword(e.target.value)}
                    placeholder="Escribí tu nueva contraseña administrativa segura"
                    className="w-full text-xs font-semibold border border-amber-300 rounded-xl px-3.5 py-2.5 bg-amber-50/15 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono text-slate-800"
                    required
                  />
                  <p className="text-[10px] text-amber-800/80 mt-1 leading-normal">
                    * Modifica este campo para reestablecer o personalizar tu clave de acceso de Dirección de forma directa.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Foto de Perfil (Dirección Web URL)</label>
                  <input
                    type="url"
                    value={adminProfileAvatar}
                    onChange={(e) => setAdminProfileAvatar(e.target.value)}
                    placeholder="Pegar dirección URL de la imagen en internet (ej: https://unsplash.com/...)"
                    className="w-full text-xs font-mono border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-indigo-700"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[9px] text-gray-400">
                      Podés usar URLs de Unsplash o cualquier servicio de imágenes público para configurar tu foto.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAdminProfileAvatar(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(adminProfileName)}&backgroundColor=cbd5e1`)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold"
                    >
                      Generar Iniciales Oficiales
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 cursor-pointer bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-emerald-400" /> Guardar Cambios de Mi Perfil
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
