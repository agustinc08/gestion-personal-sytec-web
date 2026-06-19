import { ActivityType, ProjectDifficulty, ProjectStatus } from '../types';

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  vigente: 'Vigente',
  pendiente: 'Pendiente',
  en_desarrollo: 'En desarrollo',
  completado: 'Completado',
  terminado: 'Terminado',
  pausado: 'Pausado',
  en_revision: 'En revisión',
  listo_git: 'Listo para Git',
  rama_dev: 'En rama dev',
  listo_docker: 'Listo para Docker',
  dockerizado: 'Dockerizado',
  deployado: 'Deployado',
  necesita_rehacer: 'Necesita rehacer',
  necesita_rediseno: 'Necesita rediseño',
  archivado: 'Archivado',
  ACTIVE: 'Vigente',
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En desarrollo',
  COMPLETED: 'Completado',
  FINISHED: 'Terminado',
  PAUSED: 'Pausado',
  IN_REVIEW: 'En revisión',
  READY_FOR_GIT: 'Listo para Git',
  IN_DEV_BRANCH: 'En rama dev',
  READY_FOR_DOCKER: 'Listo para Docker',
  DOCKERIZED: 'Dockerizado',
  DEPLOYED: 'Deployado',
  NEEDS_REWORK: 'Necesita rehacer',
  NEEDS_REDESIGN: 'Necesita rediseño',
  ARCHIVED: 'Archivado',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType | string, string> = {
  PROJECT: 'Proyecto',
  SUPPORT: 'Soporte',
  MAINTENANCE: 'Mantenimiento',
  DEPLOY: 'Deploy',
  MEETING: 'Reunión',
  DOCUMENTATION: 'Documentación',
  OTHER: 'Otro',
};

export const DEPLOY_ENVIRONMENT_LABELS: Record<string, string> = {
  LOCAL: 'Local',
  DEV: 'Desarrollo',
  TEST: 'Prueba',
  PROD: 'Producción',
};

export const DEPLOY_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  SUCCESS: 'Correcto',
  FAILED: 'Falló',
  ROLLED_BACK: 'Revertido',
};

export const LICENSE_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobada',
  rechazada: 'Rechazada',
  rechazado: 'Rechazada',
  cancelado: 'Cancelada',
};

export const STAT_COLUMN_LABELS: Record<string, string> = {
  employeeName: 'Empleado',
  assignedProjects: 'Proyectos asignados',
  updates: 'Avances',
  supportUpdates: 'Soportes',
  hours: 'Horas',
  projectName: 'Proyecto',
  status: 'Estado',
  difficulty: 'Dificultad',
  label: 'Tipo',
  count: 'Cantidad',
  mode: 'Modalidad',
  month: 'Mes',
  supports: 'Soportes',
  deploys: 'Deploys',
};

export function projectStatusLabel(value?: ProjectStatus | string) {
  return value ? PROJECT_STATUS_LABELS[value] || value : '-';
}

export function difficultyLabel(value?: ProjectDifficulty | string) {
  return value ? DIFFICULTY_LABELS[value] || value : '-';
}

export function activityTypeLabel(value?: ActivityType | string) {
  return value ? ACTIVITY_TYPE_LABELS[value] || value : '-';
}

export function deploymentEnvironmentLabel(value?: string) {
  return value ? DEPLOY_ENVIRONMENT_LABELS[value] || value : '-';
}

export function deploymentStatusLabel(value?: string) {
  return value ? DEPLOY_STATUS_LABELS[value] || value : '-';
}

export function licenseStatusLabel(value?: string) {
  return value ? LICENSE_STATUS_LABELS[value] || value : '-';
}

export function statColumnLabel(value: string) {
  return STAT_COLUMN_LABELS[value] || value;
}
