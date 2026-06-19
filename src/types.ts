export interface Employee {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  dependency: string;
  position?: string; // Cargo dclaro por el usuario (e.g., "Oficial Interino")
  guardiasDone: number; // Días de guardia acumulados
  totalLicenseDays: number; // Días iniciales
  licenseDaysTaken: number; // Días ya tomados
  remoteDaysAssigned: string[]; // Días asignados de Home Office (e.g., ["Martes", "Jueves"])
  strikeDutyOrder: number; // Orden de designación para días de paro
  cuil: string; // CUIL o nombre de usuario único
  password?: string; // Input temporal para cambios; la API no devuelve hashes ni claves
  mustChangePassword: boolean; // Obligar a cambiar contraseña en primer acceso
  isAdmin?: boolean; // Bandera para saber si es administrador/directivo
}

export interface WorkLog {
  id: string;
  employeeId: string;
  projectId?: string;
  projectName?: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  mode: 'presencial' | 'remoto' | 'mixto' | 'licencia';
  activityType?: ActivityType;
  hours?: number;
}

export interface ProjectUpdate {
  id: string;
  authorName: string;
  date: string; // YYYY-MM-DD HH:mm
  title?: string;
  description?: string;
  content: string;
  status?: string;
  blockers?: string;
  nextStep?: string;
  hours?: number;
  activityType?: ActivityType;
}

export type ActivityType = 'PROJECT' | 'SUPPORT' | 'MAINTENANCE' | 'DEPLOY' | 'MEETING' | 'DOCUMENTATION' | 'OTHER';

export interface StatisticsResponse {
  summary: {
    totalProjects: number;
    finishedProjects: number;
    inProgressProjects: number;
    deployedProjects: number;
    overdueProjects: number;
    totalUpdates: number;
    supportUpdates: number;
    deploys: number;
    totalHours: number;
  };
  byEmployee: Array<{ employeeId: string; employeeName: string; assignedProjects: number; updates: number; supportUpdates: number; hours: number }>;
  byProject: Array<{ projectId: string; projectName: string; status: string; difficulty: string; updates: number; supportUpdates: number; hours: number; lastProgressDate?: string }>;
  byActivityType: Array<{ activityType: ActivityType; label: string; count: number; hours: number }>;
  byWorkMode?: Array<{ mode: string; count: number; hours: number }>;
  byMonth: Array<{ month: string; updates: number; supports: number; deploys: number; hours: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byDifficulty: Array<{ difficulty: string; count: number }>;
  myProjects?: number;
  overdueProjects?: number;
  upcomingProjects?: number;
}

export type ProjectStatus =
  | 'vigente'
  | 'pendiente'
  | 'en_desarrollo'
  | 'completado'
  | 'terminado'
  | 'pausado'
  | 'en_revision'
  | 'listo_git'
  | 'rama_dev'
  | 'listo_docker'
  | 'dockerizado'
  | 'deployado'
  | 'necesita_rehacer'
  | 'necesita_rediseno'
  | 'archivado';

export type ProjectDifficulty = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Deployment {
  id: string;
  projectId: string;
  environment: 'LOCAL' | 'DEV' | 'TEST' | 'PROD';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  apiCommit?: string;
  webCommit?: string;
  apiRepoUrl?: string;
  webRepoUrl?: string;
  server?: string;
  deployedByName?: string;
  notes?: string;
  deployedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  requesterDependency: string; // Dependencia que lo solicita
  assignedEmployeeIds: string[]; // Empleados asignados
  status: ProjectStatus;
  ownerId?: string;
  ownerName?: string;
  year?: number;
  difficulty?: ProjectDifficulty;
  deadline?: string;
  repositoryApiUrl?: string;
  repositoryWebUrl?: string;
  branch?: string;
  techStack?: string;
  notes?: string;
  needsRedesign?: boolean;
  needsRework?: boolean;
  lastProgressDate?: string;
  lastDeployDate?: string;
  deadlineStatus?: 'en_termino' | 'proximo' | 'esta_semana' | 'vence_hoy' | 'vencido' | 'sin_fecha';
  updatedAt?: string;
  updates?: ProjectUpdate[];
  deployments?: Deployment[];
}

export interface LicenseRequest {
  id: string;
  employeeId: string;
  articleId?: string;
  article: string;
  startDate: string;
  endDate: string;
  reason: string;
  certificateName?: string;
  status: 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado';
  dateRequested: string;
}

export interface LicenseArticleField {
  id: string;
  articleId: string;
  key: string;
  label: string;
  type: 'TEXT' | 'DATE' | 'NUMBER' | 'MULTILINE';
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize: number;
  defaultValue?: string;
  required: boolean;
}

export interface LicenseArticle {
  id: string;
  code: string;
  title: string;
  description?: string;
  isActive: boolean;
  templatePdfPath?: string;
  templatePdfName?: string;
  fields?: LicenseArticleField[];
}

export interface LicenseRule {
  id: string;
  article: string;
  name: string;
  description: string;
  maxDaysPerYear: number;
}

export interface StrikeDutyList {
  employeeId: string;
  order: number;
}

export interface StrikeConfig {
  nextDate: string;
  nextCoverEmployeeId: string;
  lastDate: string;
  lastCoverEmployeeId: string;
  notes?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  readAt?: string;
  createdAt: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  authorUserId: string;
  authorName: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  canDelete: boolean;
}
