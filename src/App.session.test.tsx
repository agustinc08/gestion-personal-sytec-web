import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  login: vi.fn(), me: vi.fn(), changePassword: vi.fn(), logout: vi.fn(),
  employeeMe: vi.fn(), employeeOptions: vi.fn(), projectOptions: vi.fn(),
  secondaryOptions: vi.fn(), licenseMyPage: vi.fn(), licenseRules: vi.fn(),
  dashboardEmployee: vi.fn(), attendance: vi.fn(), strikeConfig: vi.fn(), announcementsActive: vi.fn(),
}));

vi.mock('./api/auth.api', () => ({ authApi: { login: mocks.login, me: mocks.me, changePassword: mocks.changePassword, logout: mocks.logout } }));
vi.mock('./api/client', () => ({ TOKEN_KEY: 'sytec_access_token' }));
vi.mock('./api/employees.api', () => ({ employeesApi: { me: mocks.employeeMe, options: mocks.employeeOptions } }));
vi.mock('./api/projects.api', () => ({ projectsApi: { options: mocks.projectOptions } }));
vi.mock('./api/secondaryWorkItems.api', () => ({ secondaryWorkItemsApi: { options: mocks.secondaryOptions } }));
vi.mock('./api/licenses.api', () => ({ licensesApi: { myPage: mocks.licenseMyPage, rules: mocks.licenseRules } }));
vi.mock('./api/licenseArticles.api', () => ({ licenseArticlesApi: { all: vi.fn() } }));
vi.mock('./api/strike.api', () => ({ strikeApi: { config: mocks.strikeConfig } }));
vi.mock('./api/worklogs.api', () => ({ worklogsApi: { attendance: mocks.attendance } }));
vi.mock('./api/announcements.api', () => ({ announcementsApi: { active: mocks.announcementsActive } }));
vi.mock('./api/dependencies.api', () => ({ dependenciesApi: { all: vi.fn() } }));
vi.mock('./api/v2.api', () => ({ dashboardV2Api: { employeeSummary: mocks.dashboardEmployee } }));
vi.mock('./components/EmployeeDashboard', () => ({ default: () => <div>Employee dashboard loaded</div> }));
vi.mock('./components/AdminDashboard', () => ({ default: () => <div>Admin dashboard loaded</div> }));
vi.mock('./components/NotificationBell', () => ({ default: () => null }));
vi.mock('./components/GlobalSearch', () => ({ default: () => null }));
vi.mock('./components/AnnouncementBanner', () => ({ default: () => null }));
vi.mock('./components/HelpPanel', () => ({ default: () => null }));

import App from './App';

const employee = {
  id: 'employee-1', name: 'Test Employee', email: 'employee@example.test', avatar: '', dependency: 'Sistemas',
  position: 'Analista', cuil: '20123456789', mustChangePassword: false, isAdmin: false,
};
const user = { id: 'user-1', cuil: employee.cuil, email: employee.email, role: 'EMPLOYEE', employeeId: employee.id, mustChangePassword: false };

describe('authenticated bootstrap failures', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.me.mockRejectedValue({ response: { status: 401 } });
    mocks.login.mockImplementation(async (_cuil: string, _password: string) => {
      localStorage.setItem('sytec_access_token', 'valid-token');
      return { accessToken: 'valid-token', user };
    });
    mocks.changePassword.mockResolvedValue({ status: 'success' });
    mocks.logout.mockImplementation(() => localStorage.removeItem('sytec_access_token'));
    mocks.employeeMe.mockResolvedValue(employee);
    mocks.employeeOptions.mockResolvedValue([]);
    mocks.projectOptions.mockRejectedValue({ response: { status: 404, data: { message: 'Proyecto no encontrado' } } });
    mocks.secondaryOptions.mockResolvedValue([]);
    mocks.licenseMyPage.mockResolvedValue({ items: [] });
    mocks.licenseRules.mockResolvedValue([]);
    mocks.dashboardEmployee.mockResolvedValue({ projects: [], recentWorkLogs: [] });
    mocks.attendance.mockResolvedValue([]);
    mocks.strikeConfig.mockResolvedValue({ nextDate: '', nextCoverEmployeeId: '', lastDate: '', lastCoverEmployeeId: '', notes: '' });
    mocks.announcementsActive.mockResolvedValue([]);
  });

  afterEach(cleanup);

  it('keeps the user in-app after mandatory password change and a missing project during the next login bootstrap', async () => {
    const actor = userEvent.setup();
    let loginCount = 0;
    mocks.login.mockImplementation(async () => {
      loginCount += 1;
      localStorage.setItem('sytec_access_token', 'valid-token');
      return { accessToken: 'valid-token', user: loginCount === 1 ? { ...user, mustChangePassword: true } : user };
    });
    mocks.me.mockRejectedValueOnce({ response: { status: 401 } }).mockResolvedValue(user);
    render(<App />);

    await actor.type(await screen.findByLabelText('CUIL del Agente'), employee.cuil);
    await actor.type(screen.getByLabelText('Contraseña'), 'temporary-password');
    await actor.click(screen.getByRole('button', { name: 'Ingresar al Sistema' }));
    await actor.type(await screen.findByLabelText('Contraseña actual'), 'temporary-password');
    await actor.type(screen.getByLabelText('Nueva contraseña'), 'new-password-123');
    await actor.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(await screen.findByText('Employee dashboard loaded')).toBeTruthy();
    expect(mocks.changePassword).toHaveBeenCalledOnce();

    await actor.click(screen.getByRole('button', { name: /Cerrar sesión/ }));
    await actor.type(await screen.findByLabelText('CUIL del Agente'), employee.cuil);
    await actor.type(screen.getByLabelText('Contraseña'), 'new-password-123');
    await actor.click(screen.getByRole('button', { name: 'Ingresar al Sistema' }));

    expect(await screen.findByText('Employee dashboard loaded')).toBeTruthy();
    expect((await screen.findByRole('alert')).textContent).toMatch(/La sesión sigue activa/);
    expect(screen.queryByText('Proyecto no encontrado')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ingresar al Sistema' })).toBeNull();
    expect(localStorage.getItem('sytec_access_token')).toBe('valid-token');
    expect(mocks.login).toHaveBeenCalledTimes(2);
  });

  it('keeps authentication errors on the login screen and does not create a session', async () => {
    const actor = userEvent.setup();
    mocks.login.mockRejectedValue({ response: { status: 401, data: { message: 'Credenciales inválidas' } } });
    render(<App />);
    await actor.type(await screen.findByLabelText('CUIL del Agente'), employee.cuil);
    await actor.type(screen.getByLabelText('Contraseña'), 'wrong-password');
    await actor.click(screen.getByRole('button', { name: 'Ingresar al Sistema' }));
    expect(await screen.findByText('CUIL o contraseña incorrectos.')).toBeTruthy();
    await waitFor(() => expect(localStorage.getItem('sytec_access_token')).toBeNull());
  });

  it('clears the session only when a bootstrap auth failure is confirmed by /auth/me', async () => {
    const actor = userEvent.setup();
    mocks.projectOptions.mockRejectedValue({ response: { status: 401 } });
    mocks.me.mockRejectedValue({ response: { status: 401 } });
    render(<App />);
    await actor.type(await screen.findByLabelText('CUIL del Agente'), employee.cuil);
    await actor.type(screen.getByLabelText('Contraseña'), 'valid-password');
    await actor.click(screen.getByRole('button', { name: 'Ingresar al Sistema' }));
    expect(await screen.findByText('CUIL o contraseña incorrectos.')).toBeTruthy();
    await waitFor(() => expect(localStorage.getItem('sytec_access_token')).toBeNull());
  });

  it('keeps the employee session without a bootstrap warning when personal page requests succeed', async () => {
    const actor = userEvent.setup();
    mocks.projectOptions.mockResolvedValue([]);
    render(<App />);
    await actor.type(await screen.findByLabelText('CUIL del Agente'), employee.cuil);
    await actor.type(screen.getByLabelText('Contraseña'), 'valid-password');
    await actor.click(screen.getByRole('button', { name: 'Ingresar al Sistema' }));

    expect(await screen.findByText('Employee dashboard loaded')).toBeTruthy();
    await waitFor(() => expect(mocks.licenseMyPage).toHaveBeenCalledWith({ page: 1, pageSize: 25 }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(localStorage.getItem('sytec_access_token')).toBe('valid-token');
  });
});
