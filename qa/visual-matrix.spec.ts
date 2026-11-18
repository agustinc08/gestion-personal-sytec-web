import { expect, test, type Page } from '@playwright/test';

const widths = [390, 430, 768, 1024, 1366, 1920];
const roles = ['ADMIN', 'EMPLOYEE'] as const;
const themes = ['light', 'dark'] as const;

const employees = Array.from({ length: 32 }, (_, index) => ({
  id: `employee-${index + 1}`,
  name: index === 0 ? 'Agente QA Remoto' : `Agente QA ${index + 1}`,
  email: `qa${index + 1}@example.test`,
  avatar: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
  dependency: 'Área de Desarrollo',
  dependencyId: 'dependency-1',
  position: index === 0 ? 'Analista' : 'Oficial',
  guardiasDone: 2,
  totalLicenseDays: 30,
  licenseDaysTaken: 3,
  remoteDaysAssigned: ['Lunes', 'Miércoles'],
  strikeDutyOrder: index + 1,
  cuil: `20${String(index + 1).padStart(8, '0')}1`,
  mustChangePassword: false,
  isAdmin: index === 0,
}));

const projects = Array.from({ length: 30 }, (_, index) => ({
  id: `project-${index + 1}`,
  name: index === 0 ? 'Portal de Gestión Interna' : `Proyecto QA ${index + 1}`,
  description: 'Implementación y mantenimiento de servicios internos.',
  requesterDependency: 'Área de Desarrollo',
  assignedEmployeeIds: ['employee-1'],
  status: index === 1 ? 'FINALIZADO' : 'EN_PROGRESO',
  ownerId: 'employee-1',
  ownerName: employees[0].name,
  year: 2026,
  deadline: '2026-12-20',
  updates: [],
  deployments: [],
}));

const workLogs = Array.from({ length: 30 }, (_, index) => ({
  id: `worklog-${index + 1}`,
  employeeId: 'employee-1',
  projectId: 'project-1',
  projectName: projects[0].name,
  title: index % 2 ? 'Revisión técnica' : 'Carga de desarrollo',
  description: 'Fixture local para control visual.',
  date: '2026-11-17',
  mode: index % 2 ? 'presencial' : 'remoto',
  activityType: 'PROJECT',
  hours: 6,
  entryTime: '08:00',
  exitTime: '14:00',
}));

const licenses = Array.from({ length: 30 }, (_, index) => ({
  id: `license-${index + 1}`,
  employeeId: 'employee-1',
  article: 'Art. 14',
  startDate: '2026-12-01',
  endDate: '2026-12-05',
  reason: 'Licencia anual',
  status: index === 0 ? 'pendiente' : 'aprobado',
  dateRequested: '2026-11-17',
}));

const pageResponse = (items: unknown[], url: URL) => {
  const page = Number(url.searchParams.get('page') || 1);
  const pageSize = Number(url.searchParams.get('pageSize') || 25);
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: items.length, totalPages: Math.max(1, Math.ceil(items.length / pageSize)) };
};

async function installApiFixtures(page: Page, role: typeof roles[number], mustChangePassword = false) {
  const roleEmployees = employees.map((employee, index) => ({ ...employee, isAdmin: role === 'ADMIN' && index === 0 }));
  await page.route(/^http:\/\/(?!127\.0\.0\.1:4173|127\.0\.0\.1:49999).*/, (route) => route.abort());
  await page.route('http://127.0.0.1:49999/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/+/, '');
    const user = { id: 'user-qa', employeeId: 'employee-1', role, mustChangePassword, cuil: employees[0].cuil };
    if (path === 'auth/me' && !request.headers().authorization) {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) });
      return;
    }
    let body: any = [];
    if (path === 'auth/login') body = { accessToken: 'qa-token', user };
    else if (path === 'auth/me') body = { user };
    else if (path === 'employees/me') body = roleEmployees[0];
    else if (path === 'employees') {
      const query = (url.searchParams.get('q') || '').toLowerCase();
      const filtered = query ? roleEmployees.filter((employee) => `${employee.name} ${employee.cuil} ${employee.email} ${employee.dependency}`.toLowerCase().includes(query)) : roleEmployees;
      body = url.searchParams.has('page') ? pageResponse(filtered, url) : filtered;
    }
    else if (path === 'projects/my') body = projects.slice(0, 5);
    else if (path === 'projects') body = url.searchParams.has('page') ? pageResponse(projects, url) : projects;
    else if (path === 'work-logs/attendance') body = url.searchParams.has('page') ? pageResponse([], url) : [];
    else if (path === 'work-logs/my') body = workLogs.slice(0, 5);
    else if (path === 'work-logs') body = url.searchParams.has('page') ? pageResponse(workLogs, url) : workLogs;
    else if (path === 'licenses/my') body = licenses.slice(0, 5);
    else if (path === 'licenses') body = url.searchParams.has('page') ? pageResponse(licenses, url) : licenses;
    else if (path === 'secondary-work-items') body = url.searchParams.has('page') ? pageResponse([], url) : [];
    else if (path === 'licenses/rules') body = [];
    else if (path === 'strikes/config') body = { nextDate: '', nextCoverEmployeeId: '', lastDate: '', lastCoverEmployeeId: '', notes: '' };
    else if (path === 'dependencies') body = [{ id: 'dependency-1', name: 'Área de Desarrollo' }];
    else if (path === 'announcements/active') body = [];
    else if (path === 'license-articles') body = [];
    else if (path === 'statistics/admin' || path === 'statistics/me') body = {
      summary: { totalProjects: 0, finishedProjects: 0, inProgressProjects: 0, deployedProjects: 0, overdueProjects: 0, totalUpdates: 0, supportUpdates: 0, deploys: 0, totalHours: 0 },
      byEmployee: [], byProject: [], byActivityType: [], byWorkMode: [], byMonth: [], byStatus: [], byDifficulty: [],
    };
    else if (path === 'dashboard/admin-summary') body = {
      employeesActive: employees.length, dependenciesActive: 1, workLogsToday: 1, workLogsPendingToday: 1,
      pendingLicenses: 1, approvedLicensesMonth: 0, activeProjects: 1, overdueProjects: 0, upcomingProjects: 1,
      latestWorkLogsByEmployee: [], technologies: [], recentAudit: [], nextStrikeDuty: null,
    };
    else if (path === 'dashboard/admin-worklog-calendar') body = { days: [], items: [] };
    else body = [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

test('login and mandatory password change screens render with isolated fixtures', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installApiFixtures(page, 'EMPLOYEE', true);
  await page.addInitScript(() => localStorage.setItem('gestion-sytec-theme', 'light'));
  await page.goto('/gestion-personal-sytec/');
  await expect(page.getByLabel(/CUIL del Agente/i)).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('login-390.png'), fullPage: true });
  await page.getByLabel(/CUIL del Agente/i).fill('20-00000001-1');
  await page.getByLabel('Contraseña').fill('qa-password');
  await page.getByRole('button', { name: 'Ingresar al Sistema' }).click();
  await expect(page.getByRole('heading', { name: 'Actualizá tu contraseña' })).toBeVisible();
  await expect(page.getByLabel('Contraseña actual')).toBeVisible();
  await expect(page.getByLabel('Nueva contraseña')).toBeVisible();
  await expectNoHorizontalOverflow(page, 390);
  await page.screenshot({ path: testInfo.outputPath('required-password-390.png'), fullPage: true });
});

async function login(page: Page, role: typeof roles[number], theme: typeof themes[number]) {
  await installApiFixtures(page, role);
  await page.addInitScript((initialTheme) => localStorage.setItem('gestion-sytec-theme', initialTheme), theme);
  await page.goto('/gestion-personal-sytec/');
  await page.getByLabel(/CUIL del Agente/i).fill('20-00000001-1');
  await page.getByLabel('Contraseña').fill('qa-password');
  await page.getByRole('button', { name: 'Ingresar al Sistema' }).click();
  await expect(page.getByText('Sesión iniciada:', { exact: false })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(250);
}

async function expectNoHorizontalOverflow(page: Page, width: number) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow, `horizontal document overflow at ${width}px`).toBe(false);
}

const luminance = (rgb: string) => {
  const channels = rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
};

async function expectDarkPendingAlertContrast(page: Page) {
  const colors = await page.locator('.employee-worklog-alert p').evaluate((paragraph) => {
    const alert = paragraph.closest('.employee-worklog-alert')!;
    return { foreground: getComputedStyle(paragraph).color, background: getComputedStyle(alert).backgroundColor };
  });
  const values = [luminance(colors.foreground), luminance(colors.background)].sort((a, b) => b - a);
  expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
}

async function expectDarkLicenseSummaryContrast(page: Page) {
  const colors = await page.locator('.employee-license-summary h3').evaluate((heading) => ({
    foreground: getComputedStyle(heading).color,
    background: getComputedStyle(heading.closest('.employee-license-summary')!).backgroundColor,
  }));
  const values = [luminance(colors.foreground), luminance(colors.background)].sort((a, b) => b - a);
  expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
}

for (const role of roles) {
  for (const theme of themes) {
    for (const width of widths) {
      test(`${role} ${theme} ${width}px: core navigation renders without horizontal overflow`, async ({ page }, testInfo) => {
        page.on('pageerror', (error) => console.log(`PAGEERROR ${role} ${theme} ${width}: ${error.stack}`));
        await page.setViewportSize({ width, height: 900 });
        await login(page, role, theme);
        expect(await page.locator('html').getAttribute('data-theme')).toBe(theme);
        await expectNoHorizontalOverflow(page, width);
        if (role === 'EMPLOYEE' && theme === 'dark') await expectDarkPendingAlertContrast(page);

        const sections = role === 'ADMIN'
          ? ['Panel ejecutivo', 'Empleados', 'Asistencia & Licencias', 'Proyectos', 'Estadísticas', 'Guardias de Paro', 'Administración de Usuarios', 'Dependencias']
          : ['Parte Diario', 'Mis proyectos', 'Mis estadísticas', 'Solicitar Licencia', 'Mi Perfil'];
        for (const label of sections) {
          const button = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
          await button.click();
          await page.waitForTimeout(100);
          await expectNoHorizontalOverflow(page, width);
          await expect(page.locator('main')).toBeVisible();
        }

        if (role === 'ADMIN') {
          await page.getByRole('button', { name: /Empleados \(32\)/i }).click();
          const search = page.getByLabel('Buscar empleados');
          await search.fill('Agente QA Remoto');
          await page.getByText('Agente QA Remoto', { exact: true }).first().click();
          await page.getByRole('button', { name: 'Editar Datos' }).click();
          await expect(page.getByRole('button', { name: 'Guardar Perfil' })).toBeVisible();
          await page.getByRole('button', { name: /Panel ejecutivo/i }).click();
          await page.getByRole('button', { name: 'Calendario', exact: true }).click();
          await page.getByRole('button', { name: 'Auditoría', exact: true }).click();
          await page.getByRole('button', { name: 'Exportaciones', exact: true }).click();
          await page.getByRole('button', { name: 'Configuración', exact: true }).click();
          await page.getByRole('button', { name: /Empleados \(32\)/i }).click();
          await search.fill('no existe');
          await expect(page.getByText('No se encontraron empleados para estos filtros.')).toBeVisible();
        } else {
          await page.getByRole('button', { name: /Parte Diario/i }).click();
          await page.getByRole('button', { name: 'Ver calendario' }).click();
          await page.getByRole('button', { name: /Mi Perfil/i }).click();
          if (theme === 'dark') await expectDarkLicenseSummaryContrast(page);
        }
        await expectNoHorizontalOverflow(page, width);
        await page.screenshot({ path: testInfo.outputPath(`${role.toLowerCase()}-${theme}-${width}.png`), fullPage: true });
      });
    }
  }
}
