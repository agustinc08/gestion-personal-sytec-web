import React, { useEffect, useState } from 'react';
import { statisticsApi } from '../api/statistics.api';
import { Dependency, Employee, WorkLog, Project, ProjectUpdate, LicenseRequest, LicenseRule, StrikeConfig, LicenseArticle, ActivityType, StatisticsResponse } from '../types';
import { activityTypeLabel, deploymentEnvironmentLabel, deploymentStatusLabel, difficultyLabel, licenseStatusLabel, projectStatusLabel, statColumnLabel } from '../utils/labels';
import { 
  Users, Calendar, Briefcase, Plus, Check, X, FileText, 
  User, ShieldAlert, Award, AlertCircle, FilePlus, ChevronRight, Settings, ArrowRight, Trash2, Key, ArrowUpDown,
  ArrowLeft, History, MessageSquare, Send, BarChart3, Upload
} from 'lucide-react';
import ProjectComments from './ProjectComments';
import { Pagination, usePagination } from './Pagination';
import DependencyAdmin from './DependencyAdmin';
import AdminV2Panel from './AdminV2Panel';
import AnnouncementAdmin from './AnnouncementAdmin';

interface AdminDashboardProps {
  employees: Employee[];
  workLogs: WorkLog[];
  projects: Project[];
  licenseRequests: LicenseRequest[];
  licenseRules: LicenseRule[];
  licenseArticles: LicenseArticle[];
  dependencies: Dependency[];
  onCreateDependency: (payload: Partial<Dependency> & { name: string }) => Promise<void>;
  onUpdateDependency: (id: string, payload: Partial<Dependency>) => Promise<void>;
  onRemoveDependency: (id: string) => Promise<void>;
  strikeConfig: StrikeConfig;
  currentAdmin: Employee;
  onUpdateStrikeConfig: (config: StrikeConfig) => void;
  onApproveRejectRequest: (id: string, status: 'aprobado' | 'rechazado') => any;
  onAddProject: (proj: Omit<Project, 'id' | 'status'>) => any;
  onUpdateProject?: (proj: Project) => Promise<Project> | void;
  onDeleteProject: (id: string) => Promise<void>;
  onAddProjectUpdate?: (projectId: string, update: string | (Partial<ProjectUpdate> & { content: string })) => Promise<Project> | void;
  onAddDeployment?: (projectId: string, payload: any) => Promise<any> | void;
  onAddManualLicense: (req: Omit<LicenseRequest, 'id' | 'status' | 'dateRequested'> & { status: 'pendiente' | 'aprobado' }) => any;
  onAddEmployee: (emp: any) => any;
  onUpdateEmployee: (emp: Employee) => Promise<Employee> | void;
  onUpdateAvatar?: (employeeId: string, avatar: string | File) => Promise<Employee> | void;
  onSwapStrikeDutyOrders?: (empIdA: string, empIdB: string) => void;
  onDeleteEmployee?: (id: string) => void;
  onUpdateLicenseRequest: (req: LicenseRequest) => Promise<void> | void;
  onDeleteLicenseRequest: (id: string) => Promise<void> | void;
  onClearLicenses?: () => Promise<void> | void;
  onResetGuardias?: (id: string) => Promise<Employee> | void;
  onAdjustCompensatoryDays?: (id: string, days: number) => Promise<Employee> | void;
  onCreateLicenseArticle?: (payload: Partial<LicenseArticle>) => Promise<LicenseArticle> | void;
  onUpdateLicenseArticle?: (id: string, payload: Partial<LicenseArticle>) => Promise<LicenseArticle> | void;
  onUploadLicenseTemplate?: (id: string, file: File) => Promise<LicenseArticle> | void;
  onAddLicenseArticleField?: (articleId: string, payload: any) => Promise<any> | void;
  onGenerateLicensePdf?: (licenseId: string, values: Record<string, string>) => Promise<string> | void;
  onGenerateArticlePdf?: (articleId: string, values: Record<string, string>) => Promise<string> | void;
  remindedEmpIds: string[];
  setRemindedEmpIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function AdminDashboard({
  employees,
  workLogs,
  projects,
  licenseRequests,
  licenseRules,
  licenseArticles,
  dependencies,
  onCreateDependency,
  onUpdateDependency,
  onRemoveDependency,
  strikeConfig,
  currentAdmin,
  onUpdateStrikeConfig,
  onApproveRejectRequest,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddProjectUpdate,
  onAddDeployment,
  onAddManualLicense,
  onAddEmployee,
  onUpdateEmployee,
  onUpdateAvatar,
  onSwapStrikeDutyOrders,
  onDeleteEmployee,
  onUpdateLicenseRequest,
  onDeleteLicenseRequest,
  onClearLicenses,
  onResetGuardias,
  onAdjustCompensatoryDays,
  onCreateLicenseArticle,
  onUpdateLicenseArticle,
  onUploadLicenseTemplate,
  onAddLicenseArticleField,
  onGenerateLicensePdf,
  onGenerateArticlePdf,
  remindedEmpIds,
  setRemindedEmpIds,
}: AdminDashboardProps) {
  const initialAdminTab = () => {
    const section = new URLSearchParams(window.location.search).get('seccion');
    const map: Record<string, 'v2' | 'announcements' | 'employees' | 'attendance' | 'projects' | 'statistics' | 'strikes' | 'settings' | 'dependencies' | 'profile'> = {
      empleados: 'employees',
      asistencia: 'attendance',
      comunicados: 'announcements',
      guardias: 'strikes',
      proyectos: 'projects',
      licencias: 'attendance',
      dependencias: 'dependencies',
      'parte-diario': 'attendance',
      estadisticas: 'statistics',
      perfil: 'profile',
    };
    return section && map[section] ? map[section] : 'v2';
  };
  const [adminTab, setAdminTab] = useState<'v2' | 'announcements' | 'employees' | 'attendance' | 'projects' | 'statistics' | 'strikes' | 'settings' | 'dependencies' | 'profile'>(initialAdminTab);
  useEffect(() => {
    const onNavigate = (event: Event) => {
      const section = (event as CustomEvent<{ section?: string }>).detail?.section;
      const map: Record<string, typeof adminTab> = {
        empleados: 'employees',
        asistencia: 'attendance',
        comunicados: 'announcements',
        guardias: 'strikes',
        proyectos: 'projects',
        licencias: 'attendance',
        dependencias: 'dependencies',
        'parte-diario': 'attendance',
        estadisticas: 'statistics',
        perfil: 'profile',
      };
      if (section && map[section]) setAdminTab(map[section]);
    };
    window.addEventListener('sytec:navigate', onNavigate);
    return () => window.removeEventListener('sytec:navigate', onNavigate);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const nonAdminEmployees = employees.filter(e => !e.isAdmin);
  const agentsWithoutLog = nonAdminEmployees.filter(emp => {
    return !workLogs.some(log => log.employeeId === emp.id && log.date === todayStr);
  });
  const projectStats = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7 = new Date(today.getTime() + 7 * 86400000);
    const in15 = new Date(today.getTime() + 15 * 86400000);
    const byStatus = (status: Project['status']) => projects.filter((p) => p.status === status).length;
    const deadlineDate = (project: Project) => project.deadline ? new Date(`${project.deadline}T00:00:00`) : null;
    return {
      total: projects.length,
      inProgress: byStatus('en_desarrollo'),
      readyGit: byStatus('listo_git'),
      readyDocker: byStatus('listo_docker'),
      deployed: byStatus('deployado'),
      finished: projects.filter((p) => p.status === 'completado' || p.status === 'terminado').length,
      redesign: projects.filter((p) => p.needsRedesign || p.status === 'necesita_rediseno').length,
      rework: projects.filter((p) => p.needsRework || p.status === 'necesita_rehacer').length,
      overdue: projects.filter((p) => { const d = deadlineDate(p); return d && d < today; }).length,
      dueToday: projects.filter((p) => { const d = deadlineDate(p); return d && d.getTime() === today.getTime(); }).length,
      dueThisWeek: projects.filter((p) => { const d = deadlineDate(p); return d && d >= today && d <= in7; }).length,
      dueIn15: projects.filter((p) => { const d = deadlineDate(p); return d && d > in7 && d <= in15; }).length,
      withoutDeadline: projects.filter((p) => !p.deadline).length,
      withoutOwner: projects.filter((p) => !p.ownerId).length,
    };
  }, [projects]);

  const activityLabels: Record<ActivityType, string> = {
    PROJECT: 'Proyecto',
    SUPPORT: 'Soporte',
    MAINTENANCE: 'Mantenimiento',
    DEPLOY: 'Deploy',
    MEETING: 'Reunión',
    DOCUMENTATION: 'Documentación',
    OTHER: 'Otro',
  };
  const splitTechStack = (value?: string) => (value || '').split(/[,;/|]+/).map((item) => item.trim()).filter(Boolean);
  const compactTechStack = (value?: string) => splitTechStack(value).slice(0, 4);
  const compensatoryText = (days: number) => days === 0 ? 'Sin días compensatorios acumulados' : days === 1 ? '1 día disponible' : `${days} días disponibles`;
  const workLogTimeText = (log: WorkLog) => (log.entryTime || log.exitTime) ? `Horario: ${log.entryTime || '--:--'} a ${log.exitTime || '--:--'}` : '';

  // Selected employee detail state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(employees[0]?.id || null);
  const [employeeDependencyFilter, setEmployeeDependencyFilter] = useState('todas');

  // Selected project for detail view state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectTimelinePage, setProjectTimelinePage] = useState(1);
  useEffect(() => setProjectTimelinePage(1), [selectedProjectId]);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [newUpdateTitle, setNewUpdateTitle] = useState('');
  const [newUpdateStatus, setNewUpdateStatus] = useState('');
  const [newUpdateBlockers, setNewUpdateBlockers] = useState('');
  const [newUpdateNextStep, setNewUpdateNextStep] = useState('');
  const [newUpdateHours, setNewUpdateHours] = useState('');
  const [newUpdateActivityType, setNewUpdateActivityType] = useState<ActivityType>('PROJECT');

  // New project state
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDependency, setProjDependency] = useState(dependencies[0]?.name || '');
  const [projAssignedIds, setProjAssignedIds] = useState<string[]>([]);
  const [projYear, setProjYear] = useState(new Date().getFullYear());
  const [projDifficulty, setProjDifficulty] = useState<Project['difficulty']>('MEDIUM');
  const [projDeadline, setProjDeadline] = useState('');
  const [projTechStack, setProjTechStack] = useState('');
  const [projOwnerId, setProjOwnerId] = useState('');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectYearFilter, setProjectYearFilter] = useState('todos');
  const [projectDifficultyFilter, setProjectDifficultyFilter] = useState('todos');
  const [projectStatusFilter, setProjectStatusFilter] = useState('todos');
  const [projectOwnerFilter, setProjectOwnerFilter] = useState('todos');
  const [projectDeadlineFilter, setProjectDeadlineFilter] = useState('todos');
  const [projectRedesignFilter, setProjectRedesignFilter] = useState('todos');
  const [projectReworkFilter, setProjectReworkFilter] = useState('todos');
  const [statsYear, setStatsYear] = useState(String(new Date().getFullYear()));
  const [statsMonth, setStatsMonth] = useState('todos');
  const [statsEmployeeId, setStatsEmployeeId] = useState('todos');
  const [statsProjectId, setStatsProjectId] = useState('todos');
  const [statsActivityType, setStatsActivityType] = useState('todos');
  const [statsProjectStatus, setStatsProjectStatus] = useState('todos');
  const [statsDifficulty, setStatsDifficulty] = useState('todos');
  const [statsFrom, setStatsFrom] = useState('');
  const [statsTo, setStatsTo] = useState('');
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [adminWorkLogYear, setAdminWorkLogYear] = useState(String(new Date().getFullYear()));
  const [adminWorkLogMonth, setAdminWorkLogMonth] = useState(String(new Date().getMonth() + 1));
  const [adminWorkLogEmployeeId, setAdminWorkLogEmployeeId] = useState('todos');
  const [adminWorkLogMode, setAdminWorkLogMode] = useState('todos');
  const [adminWorkLogActivityType, setAdminWorkLogActivityType] = useState('todos');
  const [adminWorkLogProjectId, setAdminWorkLogProjectId] = useState('todos');

  useEffect(() => {
    if (adminTab !== 'statistics') return;
    setStatsLoading(true);
    setStatsError('');
    statisticsApi.admin({
      year: statsYear,
      month: statsMonth,
      employeeId: statsEmployeeId,
      projectId: statsProjectId,
      activityType: statsActivityType,
      projectStatus: statsProjectStatus,
      difficulty: statsDifficulty,
      from: statsFrom,
      to: statsTo,
    })
      .then(setStatistics)
      .catch((error: any) => {
        const status = error?.response?.status;
        setStatsError(status === 403 ? 'No tenés permisos para ver estas estadísticas.' : 'No se pudieron cargar las estadísticas.');
      })
      .finally(() => setStatsLoading(false));
  }, [adminTab, statsYear, statsMonth, statsEmployeeId, statsProjectId, statsActivityType, statsProjectStatus, statsDifficulty, statsFrom, statsTo]);

  const [deployEnvironment, setDeployEnvironment] = useState('DEV');
  const [deployStatus, setDeployStatus] = useState('SUCCESS');
  const [deployApiCommit, setDeployApiCommit] = useState('');
  const [deployWebCommit, setDeployWebCommit] = useState('');
  const [deployServer, setDeployServer] = useState('');
  const [deployNotes, setDeployNotes] = useState('');

  // Manual license registry state
  const [manualEmpId, setManualEmpId] = useState(employees[0]?.id || '');
  const [manualArticle, setManualArticle] = useState(licenseRules[0]?.article || '');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualApprovedImmediately, setManualApprovedImmediately] = useState<boolean>(true);
  const [articleCode, setArticleCode] = useState('ART_34');
  const [articleTitle, setArticleTitle] = useState('Artículo 34');
  const [articleDescription, setArticleDescription] = useState('');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editingArticleCode, setEditingArticleCode] = useState('');
  const [editingArticleTitle, setEditingArticleTitle] = useState('');
  const [editingArticleDescription, setEditingArticleDescription] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [fieldKey, setFieldKey] = useState('fullName');
  const [fieldLabel, setFieldLabel] = useState('Nombre completo');
  const [fieldType, setFieldType] = useState('TEXT');
  const [fieldPage, setFieldPage] = useState(1);
  const [fieldX, setFieldX] = useState(80);
  const [fieldY, setFieldY] = useState(700);
  const [fieldFontSize, setFieldFontSize] = useState(10);
  const [fieldRequired, setFieldRequired] = useState(false);

  // New employee state
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPosition, setNewEmpPosition] = useState('');
  const [newEmpCuil, setNewEmpCuil] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [newEmpDependency, setNewEmpDependency] = useState(dependencies[0]?.id || '');
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
  const [editLicenseStatus, setEditLicenseStatus] = useState<LicenseRequest['status']>('pendiente');

  // States for Admin's Self Profile
  const [adminProfileName, setAdminProfileName] = useState(currentAdmin.name);
  const [adminProfileFirstName, setAdminProfileFirstName] = useState(currentAdmin.name.trim().split(/\s+/)[0] || '');
  const [adminProfileLastName, setAdminProfileLastName] = useState(currentAdmin.name.trim().split(/\s+/).slice(1).join(' '));
  const [adminProfileEmail, setAdminProfileEmail] = useState(currentAdmin.email);
  const [adminProfilePassword, setAdminProfilePassword] = useState('');
  const [adminProfileAvatar, setAdminProfileAvatar] = useState(currentAdmin.avatar || '');

  // States for general license list searching and filtering
  const [licenseSearchQuery, setLicenseSearchQuery] = useState('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('todos');

  React.useEffect(() => {
    if (currentAdmin) {
      setAdminProfileName(currentAdmin.name);
      setAdminProfileEmail(currentAdmin.email);
      setAdminProfilePassword('');
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
    
        Promise.resolve(onUpdateLicenseRequest({
      ...lic,
      article: editLicenseArticle,
      startDate: editLicenseStart,
      endDate: editLicenseEnd,
      reason: editLicenseReason,
      status: editLicenseStatus,
    }))
      .then(() => {
        setEditingLicenseId(null);
        triggerAlert('success', 'Licencia modificada correctamente.');
      })
      .catch(() => triggerAlert('error', 'No se pudo modificar la licencia.'));};

  const startEditingProfile = (emp: Employee) => {
    setEditName(emp.name);
    setEditEmail(emp.email);
    setEditCuil(emp.cuil || '');
    setEditPassword(emp.password || '');
    setEditDependency(emp.dependencyId || '');
    setEditPosition(emp.position || '');
    setEditTotalLicenseDays(emp.totalLicenseDays);
    setEditRemoteDays(emp.remoteDaysAssigned || []);
    setEditStrikeDutyOrder(emp.strikeDutyOrder || -1);
    setIsEditingProfile(true);
  };

  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    if (!editName.trim() || !editEmail.trim() || !editCuil.trim()) {
      triggerAlert('error', 'Por favor, completá Nombre, Email y CUIL. La clave solo se completa si querés cambiarla.');
      return;
    }

    onUpdateEmployee({
      ...selectedEmp,
      name: editName,
      email: editEmail,
      cuil: editCuil,
      ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
      dependencyId: editDependency,
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
    return emp.totalLicenseDays - emp.licenseDaysTaken;
  };

  // Detail panel for a selected employee
  const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
  const selectedEmpLogs = selectedEmp 
    ? workLogs.filter(log => log.employeeId === selectedEmp.id).sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5)
    : [];
  const selectedEmpLicenses = selectedEmp 
    ? licenseRequests.filter(req => req.employeeId === selectedEmp.id).sort((a,b) => b.dateRequested.localeCompare(a.dateRequested))
    : [];
  const adminFilteredWorkLogs = workLogs.filter((log) => (
    String(new Date(`${log.date}T00:00:00`).getFullYear()) === adminWorkLogYear &&
    String(new Date(`${log.date}T00:00:00`).getMonth() + 1) === adminWorkLogMonth &&
    (adminWorkLogEmployeeId === 'todos' || log.employeeId === adminWorkLogEmployeeId) &&
    (adminWorkLogMode === 'todos' || log.mode === adminWorkLogMode) &&
    (adminWorkLogActivityType === 'todos' || log.activityType === adminWorkLogActivityType) &&
    (adminWorkLogProjectId === 'todos' || log.projectId === adminWorkLogProjectId)
  )).sort((a, b) => b.date.localeCompare(a.date));
  const adminFilteredProjects = projects.filter((proj) => (
    (projectYearFilter === 'todos' || String(proj.year) === projectYearFilter) &&
    (projectDifficultyFilter === 'todos' || proj.difficulty === projectDifficultyFilter) &&
    (projectStatusFilter === 'todos' || proj.status === projectStatusFilter) &&
    (projectOwnerFilter === 'todos' || (projectOwnerFilter === 'sin_responsable' ? !proj.ownerId : proj.ownerId === projectOwnerFilter)) &&
    (projectDeadlineFilter === 'todos' || proj.deadlineStatus === projectDeadlineFilter) &&
    (projectRedesignFilter === 'todos' || String(!!proj.needsRedesign || proj.status === 'necesita_rediseno') === projectRedesignFilter) &&
    (projectReworkFilter === 'todos' || String(!!proj.needsRework || proj.status === 'necesita_rehacer') === projectReworkFilter)
  ));
  const adminFilteredLicenses = licenseRequests.filter((req) => {
    const sender = employees.find((employee) => employee.id === req.employeeId);
    const query = licenseSearchQuery.toLowerCase();
    const queryMatch = !!sender && (sender.name.toLowerCase().includes(query) || sender.dependency.toLowerCase().includes(query)) || req.article.toLowerCase().includes(query) || req.reason.toLowerCase().includes(query);
    return queryMatch && (licenseStatusFilter === 'todos' || req.status === licenseStatusFilter);
  }).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const filteredEmployees = employees.filter((employee) => employeeDependencyFilter === 'todas' || employee.dependencyId === employeeDependencyFilter);
  const employeePagination = usePagination(filteredEmployees, [employeeDependencyFilter]);
  const userPagination = usePagination(employees);
  const workLogPagination = usePagination(adminFilteredWorkLogs, [adminWorkLogYear, adminWorkLogMonth, adminWorkLogEmployeeId, adminWorkLogMode, adminWorkLogActivityType, adminWorkLogProjectId]);
  const projectPagination = usePagination(adminFilteredProjects, [projectYearFilter, projectDifficultyFilter, projectStatusFilter, projectOwnerFilter, projectDeadlineFilter, projectRedesignFilter, projectReworkFilter]);
  const licensePagination = usePagination(adminFilteredLicenses, [licenseSearchQuery, licenseStatusFilter]);

  const resetProjectForm = () => {
    setProjName('');
    setProjDesc('');
    setProjDependency(dependencies[0]?.name || '');
    setProjAssignedIds([]);
    setProjYear(new Date().getFullYear());
    setProjDifficulty('MEDIUM');
    setProjDeadline('');
    setProjTechStack('');
    setProjOwnerId('');
  };

  const handleCancelCreateProject = () => {
    resetProjectForm();
    setIsCreateProjectOpen(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !projDesc.trim()) {
      triggerAlert('error', 'Por favor, completa el nombre y la descripción del proyecto.');
      return;
    }
    if (projAssignedIds.length === 0) {
      triggerAlert('error', 'Por favor, asigna al menos un empleado al proyecto.');
      return;
    }

    setIsCreatingProject(true);
    try {
      await Promise.resolve(onAddProject({
        name: projName,
        description: projDesc,
        requesterDependency: projDependency,
        assignedEmployeeIds: projAssignedIds,
        ownerId: projOwnerId || projAssignedIds[0],
        year: projYear,
        difficulty: projDifficulty,
        deadline: projDeadline,
        techStack: projTechStack,
      }));

      resetProjectForm();
      setIsCreateProjectOpen(false);
      triggerAlert('success', 'Proyecto creado con éxito. Ahora los empleados pueden registrar avances vinculados.');
    } catch {
      triggerAlert('error', 'No se pudo crear el proyecto. Revisá los datos e intentá nuevamente.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleAddProjectUpdateByAdmin = (projectId: string) => {
    if (!newUpdateText.trim()) {
      triggerAlert('error', 'Por favor, escribe el contenido de la actualización.');
      return;
    }
    if (!onAddProjectUpdate) return;
    Promise.resolve(onAddProjectUpdate(projectId, {
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
        triggerAlert('success', 'Actualización de proyecto registrada con éxito.');
      })
      .catch(() => triggerAlert('error', 'No se pudo registrar la actualización del proyecto.'));
  };

  const handleSaveProjectDetails = (e: React.FormEvent<HTMLFormElement>, project: Project) => {
    e.preventDefault();
    if (!onUpdateProject) return;
    const form = new FormData(e.currentTarget);
    const assignedEmployeeIds = form.getAll('assignedEmployeeIds').map(String).filter(Boolean);
    const updatedProject: Project = {
      ...project,
      name: String(form.get('name') || '').trim(),
      description: String(form.get('description') || ''),
      requesterDependency: String(form.get('requesterDependency') || ''),
      status: String(form.get('status') || project.status) as Project['status'],
      year: Number(form.get('year') || new Date().getFullYear()),
      difficulty: String(form.get('difficulty') || 'MEDIUM') as Project['difficulty'],
      deadline: String(form.get('deadline') || ''),
      ownerId: String(form.get('ownerId') || ''),
      assignedEmployeeIds,
      repositoryWebUrl: String(form.get('repositoryWebUrl') || ''),
      repositoryApiUrl: String(form.get('repositoryApiUrl') || ''),
      branch: String(form.get('branch') || ''),
      techStack: String(form.get('techStack') || ''),
      notes: String(form.get('notes') || ''),
      needsRedesign: form.get('needsRedesign') === 'on',
      needsRework: form.get('needsRework') === 'on',
    };
    if (!updatedProject.name) {
      triggerAlert('error', 'El proyecto necesita nombre.');
      return;
    }
    Promise.resolve(onUpdateProject(updatedProject))
      .then(() => {
        setIsEditingProject(false);
        triggerAlert('success', 'Proyecto actualizado correctamente.');
      })
      .catch(() => triggerAlert('error', 'No se pudo actualizar el proyecto.'));
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
      articleId: licenseArticles.find((article) => article.title === manualArticle || article.code === manualArticle)?.id,
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

  const handleCreateLicenseArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateLicenseArticle || !articleCode.trim() || !articleTitle.trim()) return;
    Promise.resolve(onCreateLicenseArticle({ code: articleCode, title: articleTitle, description: articleDescription, isActive: true }))
      .then((article: any) => {
        setSelectedArticleId(article?.id || '');
        setArticleCode('');
        setArticleTitle('');
        setArticleDescription('');
        triggerAlert('success', 'Artículo de licencia creado.');
      })
      .catch(() => triggerAlert('error', 'No se pudo crear el artículo.'));
  };

  const startEditLicenseArticle = (article: LicenseArticle) => {
    setEditingArticleId(article.id);
    setEditingArticleCode(article.code);
    setEditingArticleTitle(article.title);
    setEditingArticleDescription(article.description || '');
  };

  const handleSaveLicenseArticle = (article: LicenseArticle) => {
    if (!onUpdateLicenseArticle || !editingArticleCode.trim() || !editingArticleTitle.trim()) {
      triggerAlert('error', 'Completa codigo y nombre del artículo.');
      return;
    }
    Promise.resolve(onUpdateLicenseArticle(article.id, {
      code: editingArticleCode.trim(),
      title: editingArticleTitle.trim(),
      description: editingArticleDescription,
      isActive: article.isActive,
    }))
      .then(() => {
        setEditingArticleId(null);
        triggerAlert('success', 'Artículo actualizado.');
      })
      .catch(() => triggerAlert('error', 'No se pudo actualizar el artículo.'));
  };

  const handleAddLicenseField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticleId || !onAddLicenseArticleField) return;
    Promise.resolve(onAddLicenseArticleField(selectedArticleId, {
      key: fieldKey,
      label: fieldLabel,
      type: fieldType,
      page: fieldPage,
      x: fieldX,
      y: fieldY,
      fontSize: fieldFontSize,
      required: fieldRequired,
    }))
      .then(() => triggerAlert('success', 'Campo de PDF agregado.'))
      .catch(() => triggerAlert('error', 'No se pudo agregar el campo.'));
  };

  const handleGenerateLicensePdf = (req: LicenseRequest) => {
    if (!onGenerateLicensePdf) return;
    const sender = employees.find(e => e.id === req.employeeId);
    const [firstName, ...lastParts] = (sender?.name || '').split(' ');
    const days = Math.max(1, Math.round((+new Date(req.endDate) - +new Date(req.startDate)) / 86400000) + 1);
    const defaults: Record<string, string> = {
      employeeName: firstName || '',
      employeeLastName: lastParts.join(' '),
      fullName: sender?.name || '',
      cuil: sender?.cuil || '',
      position: sender?.position || '',
      dependency: sender?.dependency || '',
      startDate: req.startDate,
      endDate: req.endDate,
      days: String(days),
      article: req.article,
      notes: req.reason,
    };
    const editableValues = { ...defaults };
    const fields: Array<[string, string]> = [
      ['fullName', 'Nombre completo'],
      ['employeeName', 'Nombre'],
      ['employeeLastName', 'Apellido'],
      ['cuil', 'CUIL'],
      ['position', 'Cargo'],
      ['dependency', 'Dependencia'],
      ['startDate', 'Fecha inicio'],
      ['endDate', 'Fecha fin'],
      ['days', 'Dias'],
      ['article', 'Artículo'],
      ['notes', 'Notas'],
    ];
    for (const [key, label] of fields) {
      const value = window.prompt(`${label} editable para imprimir:`, editableValues[key] || '');
      if (value === null) return;
      editableValues[key] = value;
    }
    Promise.resolve(onGenerateLicensePdf(req.id, editableValues))
      .then(() => triggerAlert('success', 'PDF generado. Se abrio en una nueva pestaña.'))
      .catch(() => triggerAlert('error', 'No se pudo generar el PDF. Verifica que la licencia tenga artículo y plantilla.'));
  };

  const handleTestArticlePdf = (article: LicenseArticle) => {
    if (!onGenerateArticlePdf) return;
    const values: Record<string, string> = {};
    const fields = article.fields && article.fields.length > 0
      ? article.fields
      : [
          { key: 'fullName', label: 'Nombre completo' },
          { key: 'cuil', label: 'CUIL' },
          { key: 'startDate', label: 'Fecha inicio' },
          { key: 'endDate', label: 'Fecha fin' },
          { key: 'days', label: 'Dias' },
        ];
    for (const field of fields) {
      const value = window.prompt(`Valor de prueba para ${field.label}:`, field.key === 'days' ? '1' : '');
      if (value === null) return;
      values[field.key] = value;
    }
    Promise.resolve(onGenerateArticlePdf(article.id, values))
      .then(() => triggerAlert('success', 'PDF de prueba generado.'))
      .catch(() => triggerAlert('error', 'No se pudo generar la prueba. Verifica plantilla y campos.'));
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
      dependencyId: newEmpDependency,
      dependency: dependencies.find((dependency) => dependency.id === newEmpDependency)?.name || 'Sin dependencia',
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

  const handleSaveAdminSelfProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${adminProfileFirstName} ${adminProfileLastName}`.trim();
    if (!fullName || !adminProfileEmail.trim()) {
      triggerAlert('error', 'Por favor, completa los campos de Nombre y Correo.');
      return;
    }

    try {
      await Promise.resolve(onUpdateEmployee({
        ...currentAdmin,
        name: fullName,
        email: adminProfileEmail,
        avatar: adminProfileAvatar,
        ...(adminProfilePassword.trim() ? { password: adminProfilePassword.trim() } : {}),
      }));
      setAdminProfilePassword('');
      triggerAlert('success', 'Perfil actualizado correctamente');
    } catch {
      triggerAlert('error', 'No se pudo actualizar el perfil');
    }
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
            <p className="font-semibold text-sm">{alertMsg.type === 'success' ? 'Operación exitosa' : 'Atención'}</p>
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
                     Control de Parte Diario Pendiente
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
                          {hasReminded ? 'Recordado' : 'Notificar'}
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
      <div className="flex flex-wrap border-b border-gray-200 mb-8 gap-x-2 gap-y-1">
        <button onClick={() => setAdminTab('v2')} className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 ${adminTab === 'v2' ? 'border-red-600 text-red-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-900'}`}><BarChart3 className="h-4 w-4" /> Panel ejecutivo</button>
        <button onClick={() => setAdminTab('announcements')} className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 ${adminTab === 'announcements' ? 'border-red-600 text-red-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-900'}`}><MessageSquare className="h-4 w-4" /> Comunicados</button>
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
          Proyectos ({projects.length})
        </button>
        <button
          onClick={() => setAdminTab('statistics')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            adminTab === 'statistics'
              ? 'border-red-600 text-red-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Estadísticas
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
          onClick={() => setAdminTab('dependencies')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${adminTab === 'dependencies' ? 'border-red-600 text-red-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          <Users className="w-4 h-4 text-indigo-500" /> Dependencias
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
          Mi Perfil
        </button>
      </div>

      {/* Main Admin Contents */}
      <div className="grid grid-cols-1 gap-8">
        {adminTab === 'v2' && <AdminV2Panel />}
        {adminTab === 'announcements' && <AnnouncementAdmin employees={employees} dependencies={dependencies} />}
        {/* TAB 1: EMPLEADOS - List and Detail split */}
        {adminTab === 'employees' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Employee cards list */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-900">Listado de Plantilla</h3>
                <select value={employeeDependencyFilter} onChange={(event) => setEmployeeDependencyFilter(event.target.value)} className="rounded-xl border bg-white px-3 py-2 text-xs">
                  <option value="todas">Todas las dependencias</option>
                  {dependencies.map((dependency) => <option key={dependency.id} value={dependency.id}>{dependency.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                {employeePagination.rows.map((emp) => {
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
                          <span className="block text-[9px] uppercase font-bold text-slate-400">Compensatorios</span>
                          <strong className="text-indigo-600 font-bold text-xs">{emp.guardiasDone ? `${emp.guardiasDone} días` : 'Sin saldo'}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination {...employeePagination} />
            </div>

            {/* Right Col: Selected Employee detailed info, logs and licenses */}
            <div className="lg:col-span-6">
              {selectedEmp ? (
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-6">
                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfileEdit} className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-3 mb-1">
                        <div>
                          <span className="text-xs font-black text-red-700 uppercase tracking-widest block"> Gestión de Agente</span>
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
                            <option value="">Sin dependencia asignada</option>
                            {dependencies.filter((dependency) => dependency.isActive).map((dependency) => (
                              <option key={dependency.id} value={dependency.id}>{dependency.name}</option>
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
                          <div className="relative">
                            <img
                              src={selectedEmp.avatar}
                              alt={selectedEmp.name}
                              className="w-16 h-16 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                            {onUpdateAvatar && (
                              <label className="absolute -bottom-2 -right-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2 py-1 text-[9px] font-bold cursor-pointer shadow">
                                Foto
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    Promise.resolve(onUpdateAvatar(selectedEmp.id, file))
                                      .then(() => triggerAlert('success', 'Foto de perfil actualizada.'))
                                      .catch(() => triggerAlert('error', 'No se pudo actualizar la foto de perfil.'));
                                  }}
                                />
                              </label>
                            )}
                          </div>
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
                                                <div className="rounded-xl bg-white p-3 text-left border border-indigo-100">
                          <span className="text-[9px] uppercase text-gray-400 font-bold block">Días compensatorios por guardia</span>
                          <span className="mt-1 block text-[10px] font-bold text-slate-500">Saldo actual</span>
                          <strong className="block text-lg font-black text-indigo-700">{selectedEmp.guardiasDone} días</strong>
                          <span className="mt-1 block text-[10px] font-semibold text-slate-500">{compensatoryText(selectedEmp.guardiasDone)}</span>
                          {onAdjustCompensatoryDays && (
                            <button
                              type="button"
                              onClick={() => {
                                const value = window.prompt('Saldo compensatorio del agente:', String(selectedEmp.guardiasDone));
                                if (value === null) return; const days = Number(value);
                                if (!Number.isInteger(days) || days < 0) { triggerAlert('error', 'Ingresá una cantidad válida de días.'); return; }
                                if (!window.confirm('¿Seguro que querés ajustar los días compensatorios de este agente? Esta acción quedará registrada en auditoría.')) return;
                                Promise.resolve(onAdjustCompensatoryDays(selectedEmp.id, days)).then(() => triggerAlert('success', 'Saldo compensatorio actualizado.')).catch(() => triggerAlert('error', 'No se pudo ajustar el saldo.'));
                              }}
                              className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100"
                            >
                              Ajustar saldo
                            </button>
                          )}
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-gray-400 font-bold block">Días de licencia tomados</span>
                          <span className="text-md font-bold font-mono text-amber-600">-{selectedEmp.licenseDaysTaken}d</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-gray-400 font-bold block">Saldo de licencia</span>
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
                              <span className="uppercase font-bold text-slate-700">{{
                                presencial: 'Presencial',
                                remoto: 'Remoto',
                                mixto: 'Mixto',
                                licencia: 'Licencia',
                              }[log.mode] || log.mode}</span>
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
                                      {licenseStatusLabel(lic.status)}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <button
                                        type="button"
                                        onClick={() => startEditingLicense(lic)}
                                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                                      >
                                        Modificar
                                      </button>
                                      {lic.articleId && (
                                        <>
                                          <span className="text-[10px] text-slate-300 select-none">|</span>
                                          <button
                                            type="button"
                                            onClick={() => handleGenerateLicensePdf(lic)}
                                            className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                                          >
                                            PDF
                                          </button>
                                        </>
                                      )}
                                      <span className="text-[10px] text-slate-300 select-none">|</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setConfirmDialog({
                                            message: `¿Estás seguro/a de que deseas eliminar este registro de licencia (${lic.article})? Esta acción reajustará el saldo consumido del agente de forma reactiva.`,
                                            confirmText: 'Eliminar Licencia',
                                            onConfirm: () => {
                                              Promise.resolve(onDeleteLicenseRequest(lic.id))
                                                .then(() => triggerAlert('success', 'Se ha eliminado el registro de licencia del sistema.'))
                                                .catch(() => triggerAlert('error', 'No se pudo eliminar la licencia.'));
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
          <div className="space-y-6">
            {/* Left Col: Pending license requests & general list */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Artículos de licencia y plantillas PDF
                </h3>
                <form onSubmit={handleCreateLicenseArticle} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
                  <input value={articleCode} onChange={(e) => setArticleCode(e.target.value)} placeholder="ART_34" className="text-xs border rounded-xl px-3 py-2" />
                  <input value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} placeholder="Artículo 34" className="text-xs border rounded-xl px-3 py-2" />
                  <input value={articleDescription} onChange={(e) => setArticleDescription(e.target.value)} placeholder="Descripción" className="text-xs border rounded-xl px-3 py-2" />
                  <button type="submit" className="bg-slate-900 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-3 py-2">Crear artículo</button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {licenseArticles.map((article) => (
                    <div key={article.id} className="border border-slate-150 rounded-xl p-3 bg-slate-50/60">
                      <div className="flex items-start justify-between gap-2">
                        {editingArticleId === article.id ? (
                          <div className="grid grid-cols-1 gap-2 flex-1">
                            <input value={editingArticleCode} onChange={(e) => setEditingArticleCode(e.target.value)} className="text-[10px] border rounded-lg px-2 py-1 font-mono" />
                            <input value={editingArticleTitle} onChange={(e) => setEditingArticleTitle(e.target.value)} className="text-xs border rounded-lg px-2 py-1 font-bold" />
                            <textarea value={editingArticleDescription} onChange={(e) => setEditingArticleDescription(e.target.value)} rows={2} className="text-[10px] border rounded-lg px-2 py-1" />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => handleSaveLicenseArticle(article)} className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded-lg font-bold">Guardar</button>
                              <button type="button" onClick={() => setEditingArticleId(null)} className="text-[10px] bg-white border px-2 py-1 rounded-lg font-bold">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-black text-slate-900">{article.title}</p>
                            <p className="text-[10px] font-mono text-slate-500">{article.code}</p>
                            {article.description && <p className="text-[10px] text-slate-600 mt-1">{article.description}</p>}
                            <p className="text-[10px] text-slate-500 mt-1">{article.templatePdfName ? `PDF: ${article.templatePdfName}` : 'Sin plantilla PDF'}</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => onUpdateLicenseArticle && Promise.resolve(onUpdateLicenseArticle(article.id, { isActive: !article.isActive })).catch(() => triggerAlert('error', 'No se pudo actualizar el artículo.'))}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg ${article.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                        >
                          {article.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" onClick={() => startEditLicenseArticle(article)} className="text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-bold">Editar</button>
                        <label className="text-[10px] bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-bold cursor-pointer">
                          Subir plantilla PDF
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file || !onUploadLicenseTemplate) return;
                              if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
                                triggerAlert('error', 'La plantilla debe ser un archivo PDF.');
                                e.currentTarget.value = '';
                                return;
                              }
                              Promise.resolve(onUploadLicenseTemplate(article.id, file))
                                .then(() => triggerAlert('success', 'Plantilla PDF cargada.'))
                                .catch(() => triggerAlert('error', 'No se pudo subir la plantilla PDF.'));
                            }}
                          />
                        </label>
                        <span className="self-center text-[10px] text-slate-500">Formatos permitidos: PDF</span>
                        <button type="button" onClick={() => setSelectedArticleId(article.id)} className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-lg font-bold">Configurar campos</button>
                        <button type="button" onClick={() => handleTestArticlePdf(article)} className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded-lg font-bold">Generar prueba</button>
                      </div>
                      {selectedArticleId === article.id && (
                        <form onSubmit={handleAddLicenseField} className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
                          <input value={fieldKey} onChange={(e) => setFieldKey(e.target.value)} placeholder="key" className="text-[10px] border rounded-lg px-2 py-1" />
                          <input value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} placeholder="Etiqueta" className="text-[10px] border rounded-lg px-2 py-1" />
                          <select value={fieldType} onChange={(e) => setFieldType(e.target.value)} className="text-[10px] border rounded-lg px-2 py-1">
                            <option value="TEXT">Texto</option>
                            <option value="DATE">Fecha</option>
                            <option value="NUMBER">Número</option>
                            <option value="MULTILINE">Multilínea</option>
                          </select>
                          <input type="number" value={fieldPage} onChange={(e) => setFieldPage(Number(e.target.value))} placeholder="Página" className="text-[10px] border rounded-lg px-2 py-1" />
                          <input type="number" value={fieldX} onChange={(e) => setFieldX(Number(e.target.value))} placeholder="X" className="text-[10px] border rounded-lg px-2 py-1" />
                          <input type="number" value={fieldY} onChange={(e) => setFieldY(Number(e.target.value))} placeholder="Y" className="text-[10px] border rounded-lg px-2 py-1" />
                          <input type="number" value={fieldFontSize} onChange={(e) => setFieldFontSize(Number(e.target.value))} placeholder="Fuente" className="text-[10px] border rounded-lg px-2 py-1" />
                          <label className="text-[10px] flex items-center gap-1"><input type="checkbox" checked={fieldRequired} onChange={(e) => setFieldRequired(e.target.checked)} /> Requerido</label>
                          <button type="submit" className="col-span-2 bg-slate-900 text-white rounded-lg px-2 py-1 text-[10px] font-bold">Agregar campo</button>
                          <p className="col-span-2 text-[10px] text-slate-500">Coordenadas: origen abajo a la izquierda del PDF. Ajustar X/Y hasta ubicar el texto.</p>
                          {(article.fields || []).map((field) => (
                            <span key={field.id} className="text-[10px] bg-white border rounded px-2 py-1">{field.label}: p{field.page} x{field.x} y{field.y}</span>
                          ))}
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </div>

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
                                   Certificado Adjunto: <span className="font-bold underline text-indigo-700">{req.certificateName}</span>
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
                    {onClearLicenses && licenseRequests.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setConfirmDialog({
                          message: '¿Eliminar todos los registros de licencias visibles? Esta accion persiste en PostgreSQL.',
                          confirmText: 'Limpiar Licencias',
                          onConfirm: () => {
                            Promise.resolve(onClearLicenses())
                              .then(() => triggerAlert('success', 'Licencias limpiadas correctamente.'))
                              .catch(() => triggerAlert('error', 'No se pudieron limpiar las licencias.'));
                          }
                        })}
                        className="text-[10px] bg-red-50 text-red-700 border border-red-150 px-2.5 py-0.5 rounded-full font-bold"
                      >
                        Limpiar
                      </button>
                    )}
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
                      <option value="pendiente">Pendientes</option>
                      <option value="aprobado">Aprobadas</option>
                      <option value="rechazado">Rechazadas</option>
                    </select>
                  </div>
                </div>

                {/* Listado de Solicitudes */}
                <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                  {licensePagination.total === 0 ? (
                      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs italic font-sans animate-fade-in">
                        No se encontraron registros de licencias que coincidan con los filtros aplicados.
                      </div>
                    ) : (
                      licensePagination.rows.map((req) => {
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
                                           Certificado: <span className="underline">{req.certificateName}</span>
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
                                      {licenseStatusLabel(req.status)}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => startEditingLicense(req)}
                                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                                      >
                                        Modificar
                                      </button>
                                      {req.articleId && (
                                        <>
                                          <span className="text-[10px] text-slate-300 select-none">|</span>
                                          <button
                                            type="button"
                                            onClick={() => handleGenerateLicensePdf(req)}
                                            className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                                          >
                                            PDF
                                          </button>
                                        </>
                                      )}
                                      <span className="text-[10px] text-slate-300 select-none">|</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setConfirmDialog({
                                            message: `¿Estás seguro/a de que deseas eliminar este registro de licencia (${req.article}) de ${sender?.name || 'este agente'}? Esta acción reajustará el saldo consumido del agente de forma reactiva.`,
                                            confirmText: 'Eliminar Licencia',
                                            onConfirm: () => {
                                              Promise.resolve(onDeleteLicenseRequest(req.id))
                                                .then(() => triggerAlert('success', `Se ha eliminado el registro de licencia de ${sender?.name}.`))
                                                .catch(() => triggerAlert('error', 'No se pudo eliminar la licencia.'));
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
                <Pagination {...licensePagination} />
              </div>

              {/* Box 2: Chronological general logs list of attendance */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4 flex items-center justify-between">
                  <span>Listado de Asistencia y Partes Recientes</span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Fichadas</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  <input type="number" value={adminWorkLogYear} onChange={(e) => setAdminWorkLogYear(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2" placeholder="Año" />
                  <select value={adminWorkLogMonth} onChange={(e) => setAdminWorkLogMonth(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white">
                    {Array.from({ length: 12 }, (_, idx) => <option key={idx + 1} value={idx + 1}>{new Date(2026, idx, 1).toLocaleDateString('es-AR', { month: 'long' })}</option>)}
                  </select>
                  <select value={adminWorkLogEmployeeId} onChange={(e) => setAdminWorkLogEmployeeId(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white">
                    <option value="todos">Empleado</option>
                    {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                  <select value={adminWorkLogMode} onChange={(e) => setAdminWorkLogMode(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white">
                    <option value="todos">Modalidad</option>
                    <option value="presencial">Presencial</option>
                    <option value="remoto">Remoto</option>
                    <option value="mixto">Mixto</option>
                    <option value="licencia">Licencia</option>
                  </select>
                  <select value={adminWorkLogActivityType} onChange={(e) => setAdminWorkLogActivityType(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white">
                    <option value="todos">Actividad</option>
                    {Object.entries(activityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                  <select value={adminWorkLogProjectId} onChange={(e) => setAdminWorkLogProjectId(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white">
                    <option value="todos">Proyecto</option>
                    {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {adminFilteredWorkLogs.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">Sin registros para este mes.</div>
                  ) : workLogPagination.rows.map((log) => {
                    const emp = employees.find(e => e.id === log.employeeId);
                    const linkedProject = projects.find((project) => project.id === log.projectId);
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
                            <div className="mt-1 flex flex-wrap gap-1">
                              {linkedProject && <span className="text-[9px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 rounded px-1.5 py-0.5">{linkedProject.name}</span>}
                              {log.activityType && <span className="text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 rounded px-1.5 py-0.5">{activityTypeLabel(log.activityType)}</span>}
                              {log.hours !== undefined && <span className="text-[9px] font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded px-1.5 py-0.5">{log.hours} h</span>}
                              {workLogTimeText(log) && <span className="text-[9px] font-bold bg-blue-50 border border-blue-100 text-blue-700 rounded px-1.5 py-0.5">{workLogTimeText(log)}</span>}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          log.mode === 'presencial' ? 'bg-blue-50 text-blue-700' :
                          log.mode === 'remoto' ? 'bg-amber-50 text-amber-700' :
                          log.mode === 'mixto' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-purple-50 text-purple-700'
                        }`}>
                          {{
                            presencial: 'Presencial',
                            remoto: 'Remoto',
                            mixto: 'Mixto',
                            licencia: 'Licencia',
                          }[log.mode] || log.mode}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Pagination {...workLogPagination} />
              </div>
            </div>

            {/* Right Col: Manual licensing addition */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
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
                    {licenseArticles.filter((article) => article.isActive).map((article) => (
                      <option key={article.id} value={article.title}>
                        {article.title} {article.templatePdfName ? '(con PDF)' : ''}
                      </option>
                    ))}
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
              const associatedLogs = workLogs.filter(w => w.projectId === selectedProj?.id || (w?.title || '').toLowerCase().trim() === (selectedProj?.name || '').toLowerCase().trim());
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
                  {/* Top Action & Back block */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedProjectId(null);
                          setIsEditingProject(false);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-xl border border-gray-200 transition-all text-gray-500 hover:text-gray-900 cursor-pointer"
                        title="Volver al listado"
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
                            {projectStatusLabel(selectedProj.status)}
                          </span>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mt-1">{selectedProj.name}</h4>
                      </div>
                    </div>

                    <div className="flex gap-2 self-start sm:self-auto">
                      <button type="button" onClick={() => setIsEditingProject((current) => !current)} className="bg-slate-900 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all">
                        {isEditingProject ? 'Cancelar edición' : 'Editar proyecto'}
                      </button>
                      <button type="button" onClick={() => {
                        if (!window.confirm('¿Seguro que querés eliminar este proyecto? Esta acción lo ocultará de los listados.')) return;
                        Promise.resolve(onDeleteProject(selectedProj.id)).then(() => { setSelectedProjectId(null); triggerAlert('success', 'Proyecto eliminado correctamente'); }).catch(() => triggerAlert('error', 'No se pudo eliminar el proyecto'));
                      }} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">
                        Eliminar proyecto
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2 bg-white p-4 rounded-2xl border border-gray-150 text-xs">
                    <div><span className="block text-[9px] uppercase font-bold text-gray-400">Año</span><strong>{selectedProj.year || '-'}</strong></div>
                    <div><span className="block text-[9px] uppercase font-bold text-gray-400">Dificultad</span><strong>{difficultyLabel(selectedProj.difficulty)}</strong></div>
                    <div><span className="block text-[9px] uppercase font-bold text-gray-400">Fecha límite</span><strong>{selectedProj.deadline || 'Sin fecha'}</strong></div>
                    <div><span className="block text-[9px] uppercase font-bold text-gray-400">Responsable</span><strong>{selectedProj.ownerName || 'Sin asignar'}</strong></div>
                    <div><span className="block text-[9px] uppercase font-bold text-gray-400">Último deploy</span><strong>{selectedProj.deployments?.[0] ? `${deploymentEnvironmentLabel(selectedProj.deployments[0].environment)} ${deploymentStatusLabel(selectedProj.deployments[0].status)}` : 'Sin deploy'}</strong></div>
                    <div><span className="block text-[9px] uppercase font-bold text-gray-400">Último avance</span><strong>{selectedProj.lastProgressDate ? new Date(selectedProj.lastProgressDate).toLocaleDateString('es-AR') : 'Sin avances'}</strong></div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Resumen del proyecto</h5>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedProj.description || 'Sin descripción cargada.'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedProj.needsRedesign && <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100">Necesita rediseño</span>}
                        {selectedProj.needsRework && <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">Necesita rehacer</span>}
                        {!selectedProj.needsRedesign && !selectedProj.needsRework && <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Sin alertas de revisión</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Repositorio web</span>
                        <strong className="break-all text-slate-700">{selectedProj.repositoryWebUrl || 'Sin cargar'}</strong>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Repositorio API</span>
                        <strong className="break-all text-slate-700">{selectedProj.repositoryApiUrl || 'Sin cargar'}</strong>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Rama actual</span>
                        <strong className="text-slate-700">{selectedProj.branch || 'Sin cargar'}</strong>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Tecnología / Stack</span>
                        <div className="mt-1 flex flex-wrap gap-1.5">{compactTechStack(selectedProj.techStack).length ? compactTechStack(selectedProj.techStack).map((tech) => <span key={tech} className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700">{tech}</span>) : <strong className="text-slate-700">Sin cargar</strong>}</div>
                      </div>
                    </div>
                    {selectedProj.notes && (
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-xs text-amber-900">
                        <span className="block text-[9px] uppercase font-bold text-amber-600 mb-1">Notas</span>
                        {selectedProj.notes}
                      </div>
                    )}
                  </div>

                  {isEditingProject && (
                  <form onSubmit={(e) => handleSaveProjectDetails(e, selectedProj)} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Editar datos del proyecto</h5>
                        <p className="text-[10px] text-slate-500">Permite completar proyectos viejos sin recrearlos.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setIsEditingProject(false)} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold">Cancelar edición</button>
                        <button type="submit" className="bg-slate-900 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-bold">Guardar cambios</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input name="name" defaultValue={selectedProj.name} placeholder="Nombre" className="text-xs border rounded-xl px-3 py-2 md:col-span-2" />
                      <select name="status" defaultValue={selectedProj.status} className="text-xs border rounded-xl px-3 py-2">
                        <option value="vigente">Vigente</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_desarrollo">En desarrollo</option>
                        <option value="en_revision">En revisión</option>
                        <option value="listo_git">Listo Git</option>
                        <option value="rama_dev">Rama dev</option>
                        <option value="listo_docker">Listo Docker</option>
                        <option value="dockerizado">Dockerizado</option>
                        <option value="deployado">Deployado</option>
                        <option value="terminado">Terminado</option>
                        <option value="necesita_rediseno">Necesita rediseño</option>
                        <option value="necesita_rehacer">Necesita rehacer</option>
                        <option value="pausado">Pausado</option>
                        <option value="completado">Completado</option>
                        <option value="archivado">Archivado</option>
                      </select>
                      <textarea name="description" defaultValue={selectedProj.description} placeholder="Descripción" rows={3} className="text-xs border rounded-xl px-3 py-2 md:col-span-3" />
                      <input name="requesterDependency" defaultValue={selectedProj.requesterDependency} placeholder="Dependencia" className="text-xs border rounded-xl px-3 py-2" />
                      <input name="year" type="number" defaultValue={selectedProj.year || new Date().getFullYear()} placeholder="Año" className="text-xs border rounded-xl px-3 py-2" />
                      <select name="difficulty" defaultValue={selectedProj.difficulty || 'MEDIUM'} className="text-xs border rounded-xl px-3 py-2">
                        <option value="LOW">Baja</option>
                        <option value="MEDIUM">Media</option>
                        <option value="HIGH">Alta</option>
                        <option value="CRITICAL">Crítica</option>
                      </select>
                      <input name="deadline" type="date" defaultValue={selectedProj.deadline || ''} className="text-xs border rounded-xl px-3 py-2" />
                      <select name="ownerId" defaultValue={selectedProj.ownerId || ''} className="text-xs border rounded-xl px-3 py-2">
                        <option value="">Sin responsable</option>
                        {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                      </select>
                      <select name="assignedEmployeeIds" multiple defaultValue={selectedProj.assignedEmployeeIds || []} className="text-xs border rounded-xl px-3 py-2 min-h-24">
                        {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                      </select>
                      <input name="repositoryWebUrl" defaultValue={selectedProj.repositoryWebUrl || ''} placeholder="Repo WEB" className="text-xs border rounded-xl px-3 py-2" />
                      <input name="repositoryApiUrl" defaultValue={selectedProj.repositoryApiUrl || ''} placeholder="Repo API" className="text-xs border rounded-xl px-3 py-2" />
                      <input name="branch" defaultValue={selectedProj.branch || ''} placeholder="Rama actual" className="text-xs border rounded-xl px-3 py-2" />
                      <input name="techStack" defaultValue={selectedProj.techStack || ''} placeholder="Stack / tecnología" className="text-xs border rounded-xl px-3 py-2 md:col-span-2" />
                      <textarea name="notes" defaultValue={selectedProj.notes || ''} placeholder="Notas" rows={2} className="text-xs border rounded-xl px-3 py-2 md:col-span-3" />
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-2"><input name="needsRedesign" type="checkbox" defaultChecked={!!selectedProj.needsRedesign} /> Necesita rediseño</label>
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-2"><input name="needsRework" type="checkbox" defaultChecked={!!selectedProj.needsRework} /> Necesita rehacer</label>
                    </div>
                  </form>
                  )}

                  {/* Body Content Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left side actions and team stats */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* Subir Actualización card */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                        <h5 className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" /> Cargar Actualización Oficial
                        </h5>
                        <p className="text-xs text-gray-550 mb-4">
                          Publicá novedades administrativas, prioridades o directivas sobre este proyecto. Se indexará para consulta de toda la oficina en tiempo real.
                        </p>

                        <div className="space-y-4">
                          <input
                            value={newUpdateTitle}
                            onChange={(e) => setNewUpdateTitle(e.target.value)}
                            placeholder="Título del avance"
                            className="w-full text-xs border border-gray-200 rounded-xl p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <div>
                            <textarea
                              rows={4}
                              value={newUpdateText}
                              onChange={(e) => setNewUpdateText(e.target.value)}
                              placeholder="Escribí aquí las nuevas directivas o el estado actual del desarrollo de este proyecto..."
                              className="w-full text-xs border border-gray-200 rounded-xl p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            ></textarea>
                          </div>
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
                            onClick={() => handleAddProjectUpdateByAdmin(selectedProj.id)}
                            className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <Send className="w-3.5 h-3.5" /> Publicar Novedad Directa
                          </button>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                        <h5 className="text-xs font-black text-violet-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" /> Deploys
                        </h5>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <select value={deployEnvironment} onChange={(e) => setDeployEnvironment(e.target.value)} className="text-xs border rounded-lg px-2 py-2">
                            <option value="LOCAL">LOCAL</option>
                            <option value="DEV">DEV</option>
                            <option value="TEST">TEST</option>
                            <option value="PROD">PROD</option>
                          </select>
                          <select value={deployStatus} onChange={(e) => setDeployStatus(e.target.value)} className="text-xs border rounded-lg px-2 py-2">
                            <option value="PENDING">Pendiente</option>
                            <option value="SUCCESS">Correcto</option>
                            <option value="FAILED">Fallido</option>
                            <option value="ROLLED_BACK">Revertido</option>
                          </select>
                          <input value={deployApiCommit} onChange={(e) => setDeployApiCommit(e.target.value)} placeholder="commit API" className="text-xs border rounded-lg px-2 py-2" />
                          <input value={deployWebCommit} onChange={(e) => setDeployWebCommit(e.target.value)} placeholder="commit WEB" className="text-xs border rounded-lg px-2 py-2" />
                          <input value={deployServer} onChange={(e) => setDeployServer(e.target.value)} placeholder="servidor" className="text-xs border rounded-lg px-2 py-2 col-span-2" />
                          <textarea value={deployNotes} onChange={(e) => setDeployNotes(e.target.value)} placeholder="notas" className="text-xs border rounded-lg px-2 py-2 col-span-2" rows={2} />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!onAddDeployment) return;
                            Promise.resolve(onAddDeployment(selectedProj.id, {
                              environment: deployEnvironment,
                              status: deployStatus,
                              apiCommit: deployApiCommit,
                              webCommit: deployWebCommit,
                              server: deployServer,
                              notes: deployNotes,
                            })).then(() => {
                              setDeployApiCommit('');
                              setDeployWebCommit('');
                              setDeployServer('');
                              setDeployNotes('');
                              triggerAlert('success', 'Deploy registrado.');
                            }).catch(() => triggerAlert('error', 'No se pudo registrar el deploy.'));
                          }}
                          className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-2 text-xs font-bold"
                        >
                          Registrar Deploy
                        </button>
                        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                          {(selectedProj.deployments || []).map((deploy) => (
                            <div key={deploy.id} className="text-xs border border-slate-100 rounded-lg p-2 bg-slate-50">
                              <div className="flex justify-between font-bold text-slate-700">
                                <span>{deploymentEnvironmentLabel(deploy.environment)} - {deploymentStatusLabel(deploy.status)}</span>
                                <span>{new Date(deploy.deployedAt).toLocaleDateString('es-AR')}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">{deploy.apiCommit || '-'} / {deploy.webCommit || '-'}</p>
                              {deploy.notes && <p className="text-[10px] text-slate-600 mt-1">{deploy.notes}</p>}
                            </div>
                          ))}
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

                    <div className="lg:col-span-12"><ProjectComments projectId={selectedProj.id} /></div>

                    {/* Right side combined timeline feed */}
                    <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
                      <div className="flex items-center justify-between border-b pb-3.5 mb-5">
                        <div className="flex items-center gap-2">
                          <History className="w-4.5 h-4.5 text-slate-600 animate-pulse" />
                          <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">Historial Integrado de Avances</h5>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold font-mono px-2 py-0.5 rounded">
                          {combinedTimeline.length} actualizaciónes en total
                        </span>
                      </div>

                      {combinedTimeline.length > 10 && <div className="mb-4 flex items-center justify-end gap-2 text-xs"><button type="button" disabled={projectTimelinePage === 1} onClick={() => setProjectTimelinePage((page) => page - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button><strong>Página {projectTimelinePage} de {timelinePages}</strong><button type="button" disabled={projectTimelinePage === timelinePages} onClick={() => setProjectTimelinePage((page) => page + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Siguiente</button></div>}

                      {combinedTimeline.length === 0 ? (
                        <div className="py-12 text-center text-gray-405">
                          <p className="text-xs italic">Este proyecto aún no registra movimientos ni directivas oficiales.</p>
                          <p className="text-[10px] text-gray-400 mt-1">Los avances aparecerán a medida que los agentes reporten partes o el administrador cargue novedades.</p>
                        </div>
                      ) : (
                        <div className="relative border-l border-indigo-100 pl-4 ml-2 space-y-6">
                          {combinedTimeline.slice((projectTimelinePage - 1) * 10, projectTimelinePage * 10).map((item) => {
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

                                  {item.title && <p className="text-xs font-black text-slate-900 mb-1">{item.title}</p>}
                                  <p className={`text-xs text-slate-700 leading-relaxed font-sans`}>
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
              <div className="space-y-6">
                <section className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Resumen de proyectos</h3>
                      <p className="text-[10px] text-slate-500">Estado general, vencimientos y alertas del inventario de sistemas.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                    {[
                      ['Total proyectos', projectStats.total, 'text-slate-800'],
                      ['En desarrollo', projectStats.inProgress, 'text-indigo-700'],
                      ['Listos Git', projectStats.readyGit, 'text-blue-700'],
                      ['Listos Docker', projectStats.readyDocker, 'text-cyan-700'],
                      ['Deployados', projectStats.deployed, 'text-emerald-700'],
                      ['Terminados', projectStats.finished, 'text-slate-700'],
                      ['Rediseño', projectStats.redesign, 'text-fuchsia-700'],
                      ['Rehacer', projectStats.rework, 'text-rose-700'],
                      ['Vencidos', projectStats.overdue, 'text-red-700'],
                      ['Vencen hoy', projectStats.dueToday, 'text-orange-700'],
                      ['Prox. 15 días', projectStats.dueIn15, 'text-amber-700'],
                      ['Sin fecha', projectStats.withoutDeadline, 'text-gray-600'],
                    ].map(([label, value, color]) => (
                      <div key={String(label)} className="bg-slate-50 border border-gray-150 rounded-2xl p-3">
                        <span className="block text-[9px] uppercase font-black text-slate-400 tracking-wide">{label}</span>
                        <strong className={`text-xl font-black font-mono ${color}`}>{value}</strong>
                      </div>
                    ))}
                  </div>
                  {(projectStats.overdue > 0 || projectStats.dueToday > 0 || projectStats.dueThisWeek > 0 || projectStats.withoutOwner > 0 || projectStats.withoutDeadline > 0) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mt-4">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-900 mb-2">Alertas de proyectos</h4>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                        {projectStats.overdue > 0 && <span className="bg-red-100 text-red-800 px-2 py-1 rounded-lg">Vencidos: {projectStats.overdue}</span>}
                        {projectStats.dueToday > 0 && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-lg">Vencen hoy: {projectStats.dueToday}</span>}
                        {projectStats.dueThisWeek > 0 && <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg">Esta semana: {projectStats.dueThisWeek}</span>}
                        {projectStats.dueIn15 > 0 && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg">En 15 días: {projectStats.dueIn15}</span>}
                        {projectStats.withoutOwner > 0 && <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">Sin responsable: {projectStats.withoutOwner}</span>}
                        {projectStats.withoutDeadline > 0 && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">Sin fecha límite: {projectStats.withoutDeadline}</span>}
                      </div>
                    </div>
                  )}
                </section>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form list charging area */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm self-start animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <FilePlus className="w-5 h-5 text-indigo-600" /> Crear Proyecto Vigente
                      </h3>
                      <p className="text-xs text-gray-500 mb-5">
                        Crea un proyecto para que los empleados asignados puedan reportar tareas asociadas mediante coincidencia de título.
                      </p>
                    </div>
                    {!isCreateProjectOpen && (
                      <button
                        type="button"
                        onClick={() => setIsCreateProjectOpen(true)}
                        className="shrink-0 cursor-pointer bg-slate-900 hover:bg-black text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Nuevo proyecto
                      </button>
                    )}
                  </div>

                  {isCreateProjectOpen && (
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
                        {dependencies.filter((dependency) => dependency.isActive).map((dependency) => (
                          <option key={dependency.id} value={dependency.name}>{dependency.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">Año</label>
                        <input
                          type="number"
                          value={projYear}
                          onChange={(e) => setProjYear(Number(e.target.value))}
                          className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-3"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">Dificultad</label>
                        <select
                          value={projDifficulty}
                          onChange={(e) => setProjDifficulty(e.target.value as Project['difficulty'])}
                          className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-3"
                        >
                          <option value="LOW">Baja</option>
                          <option value="MEDIUM">Media</option>
                          <option value="HIGH">Alta</option>
                          <option value="CRITICAL">Crítica</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">Fecha limite</label>
                        <input
                          type="date"
                          value={projDeadline}
                          onChange={(e) => setProjDeadline(e.target.value)}
                          className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-3"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">Responsable</label>
                        <select
                          value={projOwnerId}
                          onChange={(e) => setProjOwnerId(e.target.value)}
                          className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-3"
                        >
                          <option value="">Primer asignado</option>
                          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">Tecnologías usadas</label>
                      <input
                        type="text"
                        value={projTechStack}
                        onChange={(e) => setProjTechStack(e.target.value)}
                        placeholder="React, Vite, NestJS, Prisma, PostgreSQL"
                        className="w-full text-xs bg-white border border-gray-300 rounded-xl px-3 py-3"
                      />
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {splitTechStack(projTechStack).map((tech) => <span key={tech} className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700">{tech}</span>)}
                      </div>
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

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={handleCancelCreateProject}
                        disabled={isCreatingProject}
                        className="flex-1 cursor-pointer bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" /> Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingProject}
                        className="flex-1 cursor-pointer bg-slate-900 hover:bg-black text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" /> {isCreatingProject ? 'Guardando...' : 'Publicar Proyecto Vigente'}
                      </button>
                    </div>
                  </form>
                  )}
                </div>

                {/* List & details of projects with live synced updates */}
                <div className="lg:col-span-7 space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-slate-900">Proyectos de la Organización</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white border border-gray-150 rounded-xl p-3">
                    <select value={projectYearFilter} onChange={(e) => setProjectYearFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2">
                      <option value="todos">Todos los años</option>
                      {Array.from(new Set(projects.map((p) => p.year).filter(Boolean))).map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                    <select value={projectDifficultyFilter} onChange={(e) => setProjectDifficultyFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2">
                      <option value="todos">Todas las dificultades</option>
                      <option value="LOW">Baja</option>
                      <option value="MEDIUM">Media</option>
                      <option value="HIGH">Alta</option>
                      <option value="CRITICAL">Crítica</option>
                    </select>
                    <select value={projectStatusFilter} onChange={(e) => setProjectStatusFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2">
                      <option value="todos">Todos los estados</option>
                      <option value="vigente">Vigente</option>
                      <option value="en_desarrollo">En desarrollo</option>
                      <option value="listo_git">Listo Git</option>
                      <option value="listo_docker">Listo Docker</option>
                      <option value="deployado">Deployado</option>
                      <option value="terminado">Terminado</option>
                      <option value="necesita_rediseno">Necesita rediseño</option>
                      <option value="necesita_rehacer">Necesita rehacer</option>
                      <option value="pausado">Pausado</option>
                      <option value="completado">Completado</option>
                    </select>
                    <select value={projectOwnerFilter} onChange={(e) => setProjectOwnerFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2">
                      <option value="todos">Todos los responsables</option>
                      <option value="sin_responsable">Sin responsable</option>
                      {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                    <select value={projectDeadlineFilter} onChange={(e) => setProjectDeadlineFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2">
                      <option value="todos">Todos los vencimientos</option>
                      <option value="vencido">Vencidos</option>
                      <option value="vence_hoy">Vencen hoy</option>
                      <option value="esta_semana">Esta semana</option>
                      <option value="proximo">Próximos</option>
                      <option value="sin_fecha">Sin fecha</option>
                    </select>
                    <select value={projectRedesignFilter} onChange={(e) => setProjectRedesignFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2">
                      <option value="todos">Rediseno: todos</option>
                      <option value="true">Necesita rediseño</option>
                      <option value="false">No necesita rediseño</option>
                    </select>
                    <select value={projectReworkFilter} onChange={(e) => setProjectReworkFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2">
                      <option value="todos">Rehacer: todos</option>
                      <option value="true">Necesita rehacer</option>
                      <option value="false">No necesita rehacer</option>
                    </select>
                  </div>

                  {projects.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border text-slate-400">
                      <Briefcase className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">No has publicado ningún proyecto aún.</p>
                    </div>
                  ) : (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projectPagination.rows.map((proj) => {
                        const associatedLogs = workLogs.filter(w => w.projectId === proj.id || (w?.title || '').toLowerCase().trim() === (proj?.name || '').toLowerCase().trim());
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
                                  {projectStatusLabel(proj.status)}
                                </span>
                              </div>

                              <h4 className="font-bold text-md text-slate-900 line-clamp-1">{proj.name}</h4>
                              <div className="mt-1 flex flex-wrap gap-1.5 text-[9px] font-bold uppercase">
                                <span className="bg-slate-50 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{proj.year || new Date().getFullYear()}</span>
                                <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">{difficultyLabel(proj.difficulty)}</span>
                                {proj.deadline && <span className="bg-amber-50 border border-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Vence {proj.deadline}</span>}
                                {proj.ownerName && <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{proj.ownerName}</span>}
                              </div>
                              {compactTechStack(proj.techStack).length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{compactTechStack(proj.techStack).slice(0, 3).map((tech) => <span key={tech} className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700">{tech}</span>)}</div>}
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
                                <span className="text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                                  {proj.deployments?.[0] ? `${deploymentEnvironmentLabel(proj.deployments[0].environment)} ${deploymentStatusLabel(proj.deployments[0].status)}` : 'sin deploy'}
                                </span>
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedProjectId(proj.id);
                                  setIsEditingProject(false);
                                }}
                                className="w-full flex items-center justify-center gap-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                Ingresar al proyecto <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Pagination {...projectPagination} />
                    </>
                  )}
                </div>
              </div>
              </div>
            )}
          </div>
        )}

        {adminTab === 'statistics' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" /> Estadísticas de la oficina
                  </h3>
                  <p className="text-xs text-slate-500">Resumen anual/mensual de proyectos, avances, soporte, deploys y horas cargadas.</p>
                </div>
                {statsLoading && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Cargando...</span>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
                <input value={statsYear} onChange={(e) => setStatsYear(e.target.value)} placeholder="Año" className="text-xs border rounded-xl px-3 py-2" />
                <select value={statsMonth} onChange={(e) => setStatsMonth(e.target.value)} className="text-xs border rounded-xl px-3 py-2">
                  <option value="todos">Mes</option>
                  {Array.from({ length: 12 }, (_, idx) => <option key={idx + 1} value={idx + 1}>{idx + 1}</option>)}
                </select>
                <select value={statsEmployeeId} onChange={(e) => setStatsEmployeeId(e.target.value)} className="text-xs border rounded-xl px-3 py-2">
                  <option value="todos">Empleado</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
                <select value={statsProjectId} onChange={(e) => setStatsProjectId(e.target.value)} className="text-xs border rounded-xl px-3 py-2">
                  <option value="todos">Proyecto</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
                <select value={statsActivityType} onChange={(e) => setStatsActivityType(e.target.value)} className="text-xs border rounded-xl px-3 py-2">
                  <option value="todos">Actividad</option>
                  {Object.entries(activityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
                <select value={statsProjectStatus} onChange={(e) => setStatsProjectStatus(e.target.value)} className="text-xs border rounded-xl px-3 py-2">
                  <option value="todos">Estado</option>
                  <option value="en_desarrollo">En desarrollo</option>
                  <option value="listo_git">Listo Git</option>
                  <option value="listo_docker">Listo Docker</option>
                  <option value="deployado">Deployado</option>
                  <option value="terminado">Terminado</option>
                  <option value="completado">Completado</option>
                  <option value="pausado">Pausado</option>
                </select>
                <select value={statsDifficulty} onChange={(e) => setStatsDifficulty(e.target.value)} className="text-xs border rounded-xl px-3 py-2">
                  <option value="todos">Dificultad</option>
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
                <div className="grid grid-cols-2 gap-1">
                  <input type="date" value={statsFrom} onChange={(e) => setStatsFrom(e.target.value)} className="text-[10px] border rounded-xl px-2 py-2" />
                  <input type="date" value={statsTo} onChange={(e) => setStatsTo(e.target.value)} className="text-[10px] border rounded-xl px-2 py-2" />
                </div>
              </div>
            </div>

            {statsError && <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-sm font-bold">{statsError}</div>}
            {!statsError && statistics && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-9 gap-3">
                  {[
                    ['Total proyectos', statistics.summary.totalProjects],
                    ['Terminados', statistics.summary.finishedProjects],
                    ['En desarrollo', statistics.summary.inProgressProjects],
                    ['Deployados', statistics.summary.deployedProjects],
                    ['Vencidos', statistics.summary.overdueProjects],
                    ['Avances', statistics.summary.totalUpdates],
                    ['Soportes', statistics.summary.supportUpdates],
                    ['Deploys', statistics.summary.deploys],
                    ['Horas', statistics.summary.totalHours],
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
                    {[
                      ['Por empleado', statistics.byEmployee, ['employeeName', 'assignedProjects', 'updates', 'supportUpdates', 'hours']],
                      ['Por proyecto', statistics.byProject.map((row) => ({ ...row, status: projectStatusLabel(row.status), difficulty: difficultyLabel(row.difficulty) })), ['projectName', 'status', 'updates', 'supportUpdates', 'hours']],
                      ['Por tipo de actividad', statistics.byActivityType.map((row) => ({ ...row, label: activityLabels[row.activityType] || row.label })), ['label', 'count', 'hours']],
                      ['Por modalidad', (statistics.byWorkMode || []).map((row) => ({ ...row, mode: { ONSITE: 'Presencial', REMOTE: 'Remoto', MIXED: 'Mixto', LICENSE: 'Licencia' }[row.mode] || row.mode })), ['mode', 'count', 'hours']],
                      ['Por mes', statistics.byMonth, ['month', 'updates', 'supports', 'deploys', 'hours']],
                      ['Por estado', statistics.byStatus.map((row) => ({ ...row, status: projectStatusLabel(row.status) })), ['status', 'count']],
                      ['Por dificultad', statistics.byDifficulty.map((row) => ({ ...row, difficulty: difficultyLabel(row.difficulty) })), ['difficulty', 'count']],
                    ].map(([title, rows, columns]) => (
                      <div key={String(title)} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm overflow-hidden">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">{String(title)}</h4>
                        {Array.isArray(rows) && rows.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-[9px] uppercase text-slate-400 border-b">
                                  {(columns as string[]).map((column) => <th key={column} className="py-2 pr-2">{statColumnLabel(column)}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {(rows as any[]).slice(0, 10).map((row, idx) => (
                                  <tr key={idx} className="border-b border-slate-50">
                                    {(columns as string[]).map((column) => <td key={column} className="py-2 pr-2 text-slate-700">{row[column] ?? '-'}</td>)}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Sin datos para estos filtros.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
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
                             Agente Designado por Rotación (Automático)
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
                        Agentes disponibles para sumar
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
        {adminTab === 'dependencies' && (
          <DependencyAdmin dependencies={dependencies} onCreate={onCreateDependency} onUpdate={onUpdateDependency} onRemove={onRemoveDependency} />
        )}

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
                    {userPagination.rows.map((emp) => {
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
                              <span className="text-slate-400 font-semibold tracking-widest text-[10px]">********</span>
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
                <Pagination {...userPagination} />
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
                      <option value="">Sin dependencia asignada</option>
                      {dependencies.filter((dependency) => dependency.isActive).map((dependency) => (
                        <option key={dependency.id} value={dependency.id}>{dependency.name}</option>
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
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-5 pb-6 border-b border-slate-100">
                <div className="relative shrink-0">
                  <img
                    src={adminProfileAvatar || currentAdmin.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentAdmin.name)}&backgroundColor=cbd5e1`}
                    alt={currentAdmin.name}
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white bg-slate-50 shadow-md"
                  />
                  {onUpdateAvatar && (
                    <>
                      <button
                        type="button"
                        onClick={() => document.getElementById('admin-avatar-upload-file')?.click()}
                        className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2 rounded-xl shadow hover:bg-indigo-700 transition-colors"
                        title="Cambiar foto"
                        aria-label="Cambiar foto"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <input
                        type="file"
                        id="admin-avatar-upload-file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            Promise.resolve(onUpdateAvatar(currentAdmin.id, file))
                              .then((saved) => {
                                setAdminProfileAvatar((saved && saved.avatar) || currentAdmin.avatar || '');
                                triggerAlert('success', 'Foto de perfil cambiada correctamente.');
                              })
                              .catch(() => triggerAlert('error', 'No se pudo cambiar la foto de perfil.'));
                          }
                        }}
                      />
                    </>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-900">Mi Perfil</h3>
                  <p className="text-xs text-slate-500 mt-1">Datos personales</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{currentAdmin.name}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded px-2 py-1">Rol: Administrador</span>
                    <span className="bg-slate-50 border border-slate-200 text-slate-700 rounded px-2 py-1">{currentAdmin.dependency || 'Sin dependencia'}</span>
                    {currentAdmin.position && <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded px-2 py-1">{currentAdmin.position}</span>}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveAdminSelfProfile} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Nombre</label>
                    <input
                      type="text"
                      value={adminProfileFirstName}
                      onChange={(e) => { setAdminProfileFirstName(e.target.value); setAdminProfileName(`${e.target.value} ${adminProfileLastName}`.trim()); }}
                      className="w-full text-xs font-semibold border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Apellido</label>
                    <input type="text" value={adminProfileLastName} onChange={(e) => { setAdminProfileLastName(e.target.value); setAdminProfileName(`${adminProfileFirstName} ${e.target.value}`.trim()); }} className="w-full text-xs font-semibold border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={adminProfileEmail}
                      onChange={(e) => setAdminProfileEmail(e.target.value)}
                      className="w-full text-xs font-semibold border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">CUIL</label>
                    <input
                      type="text"
                      value={currentAdmin.cuil || ''}
                      disabled
                      className="w-full text-xs font-mono font-bold bg-slate-100 cursor-not-allowed border border-gray-200 rounded-xl px-3 py-2.5 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dependencia / Área</label>
                    <input
                      type="text"
                      value={currentAdmin.dependency || ''}
                      disabled
                      className="w-full text-xs font-semibold bg-slate-100 cursor-not-allowed border border-gray-200 rounded-xl px-3 py-2.5 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rol</label>
                    <input
                      type="text"
                      value="Administrador"
                      disabled
                      className="w-full text-xs font-semibold bg-slate-100 cursor-not-allowed border border-gray-200 rounded-xl px-3 py-2.5 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-500" /> Nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={adminProfilePassword}
                      onChange={(e) => setAdminProfilePassword(e.target.value)}
                      placeholder="Completar solo si querés cambiarla"
                      className="w-full text-xs font-semibold border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Foto de perfil por URL</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={adminProfileAvatar}
                      onChange={(e) => setAdminProfileAvatar(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 text-xs font-mono border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-700"
                    />
                    <button
                      type="button"
                      onClick={() => setAdminProfileAvatar(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(adminProfileName)}&backgroundColor=cbd5e1`)}
                      className="text-xs font-bold border border-indigo-100 bg-indigo-50 text-indigo-700 rounded-xl px-3 py-2 hover:bg-indigo-100"
                    >
                      Generar iniciales
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 cursor-pointer bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-emerald-400" /> Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
