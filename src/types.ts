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
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  mode: 'presencial' | 'remoto' | 'licencia';
}

export interface ProjectUpdate {
  id: string;
  authorName: string;
  date: string; // YYYY-MM-DD HH:mm
  content: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  requesterDependency: string; // Dependencia que lo solicita
  assignedEmployeeIds: string[]; // Empleados asignados
  status: 'vigente' | 'completado' | 'pausado';
  updates?: ProjectUpdate[];
}

export interface LicenseRequest {
  id: string;
  employeeId: string;
  article: string;
  startDate: string;
  endDate: string;
  reason: string;
  certificateName?: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  dateRequested: string;
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
