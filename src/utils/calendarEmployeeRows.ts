export type CalendarEmployeeDay = {
  employeeId: string;
  employeeName: string;
  dependency?: string;
  date: string;
  status: string;
  workLogLoaded: boolean;
  workLogPending: boolean;
  collision: boolean;
  licenseArticle?: string;
};

const statusLabels: Record<string, string> = {
  LEAVE: 'Licencia aprobada',
  STRIKE: 'Paro',
  WEEKEND: 'Fin de semana',
  REMOTE: 'Remoto',
  PRESENTIAL: 'Presencial',
  UNKNOWN: 'Sin evidencia histórica',
};

export function buildCalendarEmployeeRows(employeeDays: CalendarEmployeeDay[], workLogs: any[], selectedDate: string, employeeId = 'all') {
  const logs = new Map(workLogs.filter((log) => log.date === selectedDate).map((log) => [log.employeeId, log]));
  return employeeDays.filter((day) => day.date === selectedDate && (employeeId === 'all' || day.employeeId === employeeId)).map((day) => {
    const log: any = logs.get(day.employeeId);
    const calendarPart = day.workLogLoaded ? 'Parte cargado' : day.workLogPending ? 'Parte pendiente' : 'No requiere parte';
    const collisionText = day.collision ? `Colisión: ${statusLabels[day.status] || statusLabels.UNKNOWN} + parte registrado.` : '';
    return {
      ...(log || {}),
      id: log?.id || `status-${day.employeeId}-${selectedDate}`,
      employeeId: day.employeeId,
      employeeName: day.employeeName,
      dependency: day.dependency,
      title: log?.title || (day.licenseArticle ? `Licencia: ${day.licenseArticle}` : calendarPart),
      calendarStatus: day.status,
      calendarPart,
      collisionText,
    };
  });
}

export { statusLabels as calendarStatusLabels };
