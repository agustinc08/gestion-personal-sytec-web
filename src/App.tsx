import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, LogOut, RefreshCw, User } from 'lucide-react';
import { employeesApi } from './api/employees.api';
import { licensesApi } from './api/licenses.api';
import { licenseArticlesApi } from './api/licenseArticles.api';
import { projectsApi } from './api/projects.api';
import { strikeApi } from './api/strike.api';
import { worklogsApi } from './api/worklogs.api';
import { authApi } from './api/auth.api';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import LoginScreen from './components/LoginScreen';
import NotificationBell from './components/NotificationBell';
import { DEPENDENCIES, INITIAL_STRIKE_CONFIG, LAWS_ARTICLES_RULES } from './data/mockData';
import { Employee, LicenseArticle, LicenseRequest, LicenseRule, Project, ProjectUpdate, StrikeConfig, WorkLog } from './types';

function SessionAvatar({ src, name }: { src?: string; name: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [src]);

  if (!src || imageFailed) {
    return (
      <div className="w-10 h-10 bg-rose-700/85 rounded-xl text-white shadow-inner flex items-center justify-center shrink-0">
        <User className="w-5 h-5 text-white" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Foto de perfil de ${name}`}
      className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700 shadow-inner shrink-0"
      onError={() => setImageFailed(true)}
    />
  );
}

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [licenseRequests, setLicenseRequests] = useState<LicenseRequest[]>([]);
  const [licenseRules, setLicenseRules] = useState<LicenseRule[]>(LAWS_ARTICLES_RULES);
  const [licenseArticles, setLicenseArticles] = useState<LicenseArticle[]>([]);
  const [strikeConfig, setStrikeConfig] = useState<StrikeConfig>(INITIAL_STRIKE_CONFIG);
  const [dependencies] = useState<string[]>(DEPENDENCIES);
  const [remindedEmpIds, setRemindedEmpIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshData = async (user = currentUser) => {
    if (!user) return;
    const isAdmin = user.role === 'ADMIN';
    const [employeeRows, projectRows, licenseRows, workLogRows, rules, articleRows, strike] = await Promise.all([
      isAdmin ? employeesApi.all() : employeesApi.me().then((me) => [me]),
      isAdmin ? projectsApi.all() : projectsApi.my(),
      isAdmin ? licensesApi.all() : licensesApi.my(),
      isAdmin ? worklogsApi.all() : worklogsApi.my(),
      licensesApi.rules().catch(() => LAWS_ARTICLES_RULES),
      licensesApi.rules().then(() => licenseArticlesApi.all(isAdmin)).catch(() => []),
      strikeApi.config(),
    ]);
    setEmployees(employeeRows);
    setProjects(projectRows);
    setLicenseRequests(licenseRows);
    setWorkLogs(workLogRows);
    setLicenseRules(rules);
    setLicenseArticles(articleRows);
    setStrikeConfig(strike);
  };

  useEffect(() => {
    async function bootstrap() {
      try {
        const user = await authApi.me();
        setCurrentUser(user);
        await refreshData(user);
      } catch {
        authApi.logout();
      } finally {
        setInitialFetchDone(true);
      }
    }
    bootstrap();
  }, []);

  const processedEmployees = useMemo(() => {
    return employees.map((emp) => {
      let guardias = 0;
      let taken = 0;
      licenseRequests.forEach((req) => {
        if (req.employeeId === emp.id && req.status === 'aprobado') {
          const days = Math.max(1, Math.round((+new Date(req.endDate) - +new Date(req.startDate)) / 86400000) + 1);
          if (req.article === 'Guardia en Feria') guardias += days;
          if (req.article === 'Art. 14') taken += days;
        }
      });
      return { ...emp, guardiasDone: guardias, licenseDaysTaken: taken, totalLicenseDays: emp.totalLicenseDays || 0 };
    });
  }, [employees, licenseRequests]);

  const currentEmployee = processedEmployees.find((e) => e.id === currentUser?.employeeId) || processedEmployees[0] || null;
  const currentRole = currentUser?.role === 'ADMIN' ? 'admin' : 'employee';

  const handleLogin = async (cuil: string, password: string) => {
    const session = await authApi.login(cuil, password);
    setCurrentUser(session.user);
    await refreshData(session.user);
    return session.user;
  };

  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    const saved = updatedEmp.id === currentUser?.employeeId && currentUser?.role !== 'ADMIN'
      ? await employeesApi.updateMe(updatedEmp)
      : await employeesApi.update(updatedEmp.id, updatedEmp);
    setEmployees((prev) => prev.map((emp) => (emp.id === saved.id ? saved : emp)));
    return saved;
  };

  const handleAddWorkLog = async (newLogData: Omit<WorkLog, 'id'>) => {
    const saved = await worklogsApi.create(newLogData);
    setWorkLogs((prev) => [saved, ...prev]);
    return saved;
  };

  const handleAddLicenseRequest = async (newReqData: Omit<LicenseRequest, 'id' | 'status' | 'dateRequested'>) => {
    const saved = await licensesApi.create(newReqData);
    setLicenseRequests((prev) => [saved, ...prev]);
  };

  const handleAddProject = async (newProjData: Omit<Project, 'id' | 'status'>) => {
    const saved = await projectsApi.create(newProjData);
    setProjects((prev) => [...prev, saved]);
  };

  const handleUpdateProject = async (updatedProj: Project) => {
    const payload = {
      name: updatedProj.name,
      description: updatedProj.description,
      requesterDependency: updatedProj.requesterDependency,
      assignedEmployeeIds: updatedProj.assignedEmployeeIds,
      status: updatedProj.status,
      ownerId: updatedProj.ownerId,
      year: updatedProj.year,
      difficulty: updatedProj.difficulty,
      deadline: updatedProj.deadline,
      repositoryApiUrl: updatedProj.repositoryApiUrl,
      repositoryWebUrl: updatedProj.repositoryWebUrl,
      branch: updatedProj.branch,
      techStack: updatedProj.techStack,
      notes: updatedProj.notes,
      needsRedesign: updatedProj.needsRedesign,
      needsRework: updatedProj.needsRework,
    };
    const saved = await projectsApi.update(updatedProj.id, payload);
    setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    return saved;
  };

  const handleAddProjectUpdate = async (projectId: string, update: string | (Partial<ProjectUpdate> & { content: string })) => {
    const payload = typeof update === 'string' ? { content: update } : update;
    const saved = await projectsApi.addUpdate(projectId, {
      ...payload,
      authorName: currentUser?.role === 'ADMIN' ? 'Administración' : currentEmployee?.name || 'Empleado',
    });
    setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    return saved;
  };

  const handleAddDeployment = async (projectId: string, payload: any) => {
    const deployment = await projectsApi.addDeployment(projectId, payload);
    setProjects((prev) => prev.map((project) => (
      project.id === projectId
        ? { ...project, deployments: [deployment, ...(project.deployments || [])] }
        : project
    )));
    return deployment;
  };

  const handleAddManualLicense = async (reqData: Omit<LicenseRequest, 'id' | 'status' | 'dateRequested'> & { status: 'pendiente' | 'aprobado' }) => {
    const saved = await licensesApi.create(reqData);
    setLicenseRequests((prev) => [saved, ...prev]);
  };

  const handleAddEmployee = async (empData: any) => {
    const saved = await employeesApi.create(empData);
    setEmployees((prev) => [...prev, saved]);
  };

  const handleApproveRejectRequest = async (reqId: string, targetStatus: 'aprobado' | 'rechazado') => {
    const saved = targetStatus === 'aprobado' ? await licensesApi.approve(reqId) : await licensesApi.reject(reqId);
    setLicenseRequests((prev) => prev.map((req) => (req.id === saved.id ? saved : req)));
  };

  const handleUpdateLicenseRequest = async (updatedReq: LicenseRequest) => {
    const saved = await licensesApi.update(updatedReq.id, updatedReq);
    setLicenseRequests((prev) => prev.map((req) => (req.id === saved.id ? saved : req)));
  };

  const handleDeleteLicenseRequest = async (id: string) => {
    await licensesApi.remove(id);
    setLicenseRequests((prev) => prev.filter((req) => req.id !== id));
  };

  const handleClearLicenses = async () => {
    await licensesApi.clear();
    setLicenseRequests([]);
  };

  const handleCreateLicenseArticle = async (payload: Partial<LicenseArticle>) => {
    const saved = await licenseArticlesApi.create(payload);
    setLicenseArticles((prev) => [...prev, saved]);
    return saved;
  };

  const handleUpdateLicenseArticle = async (id: string, payload: Partial<LicenseArticle>) => {
    const saved = await licenseArticlesApi.update(id, payload);
    setLicenseArticles((prev) => prev.map((article) => (article.id === saved.id ? saved : article)));
    return saved;
  };

  const handleUploadLicenseTemplate = async (id: string, file: File) => {
    const saved = await licenseArticlesApi.uploadTemplate(id, file);
    setLicenseArticles((prev) => prev.map((article) => (article.id === saved.id ? saved : article)));
    return saved;
  };

  const handleAddLicenseArticleField = async (articleId: string, payload: any) => {
    const saved = await licenseArticlesApi.addField(articleId, payload);
    setLicenseArticles((prev) => prev.map((article) => (
      article.id === articleId ? { ...article, fields: [...(article.fields || []), saved] } : article
    )));
    return saved;
  };

  const handleGenerateLicensePdf = async (licenseId: string, values: Record<string, string>) => {
    const blob = await licenseArticlesApi.renderLicensePdf(licenseId, values);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    return url;
  };

  const handleGenerateArticlePdf = async (articleId: string, values: Record<string, string>) => {
    const blob = await licenseArticlesApi.renderArticlePdf(articleId, values);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    return url;
  };

  const handleDeleteEmployee = async (id: string) => {
    await employeesApi.remove(id);
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  };

  const handleUpdateAvatar = async (employeeId: string, avatarUrl: string | File) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;
    const saved = avatarUrl instanceof File
      ? (employeeId === currentUser?.employeeId && currentUser?.role !== 'ADMIN'
        ? await employeesApi.uploadMyAvatar(avatarUrl)
        : await employeesApi.uploadAvatar(employeeId, avatarUrl))
      : await handleUpdateEmployee({ ...emp, avatar: avatarUrl });
    setEmployees((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
    return saved;
  };

  const handleResetGuardias = async (employeeId: string) => {
    const saved = await employeesApi.resetGuardias(employeeId);
    setEmployees((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
    await refreshData();
    return saved;
  };

  const handleUpdateStrikeConfig = async (newConfig: StrikeConfig) => {
    const saved = await strikeApi.updateConfig(newConfig);
    setStrikeConfig(saved);
  };

  const handleSwapStrikeDutyOrders = async (empIdA: string, empIdB: string) => {
    const empA = employees.find((e) => e.id === empIdA);
    const empB = employees.find((e) => e.id === empIdB);
    if (!empA || !empB) return;
    const [savedA, savedB] = await Promise.all([
      employeesApi.update(empA.id, { ...empA, strikeDutyOrder: empB.strikeDutyOrder }),
      employeesApi.update(empB.id, { ...empB, strikeDutyOrder: empA.strikeDutyOrder }),
    ]);
    setEmployees((prev) => prev.map((emp) => (emp.id === savedA.id ? savedA : emp.id === savedB.id ? savedB : emp)));
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setEmployees([]);
    setProjects([]);
    setWorkLogs([]);
    setLicenseRequests([]);
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    await authApi.changePassword(currentPassword, newPassword);
  };

  if (!initialFetchDone) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center selection:bg-slate-800">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 max-w-sm w-full shadow-2xl flex flex-col items-center gap-6 animate-fade-in">
          <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
          <div>
            <h1 className="text-sm font-black tracking-wider text-slate-300 uppercase mb-1">Conexión del Servidor</h1>
            <p className="text-xs text-slate-400">Sincronizando API y base de datos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || !currentEmployee) {
    return <LoginScreen onLogin={handleLogin} loadError={loadError} setLoadError={setLoadError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-slate-800 selection:text-white pb-12">
      <div className="bg-slate-900 text-white p-3.5 sm:px-8 border-b border-slate-850 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SessionAvatar src={currentEmployee.avatar} name={currentEmployee.name} />
            <div className="text-center sm:text-left">
              <h1 className="text-sm font-black tracking-tight flex flex-wrap items-center justify-center sm:justify-start gap-2">
                Sesión iniciada: <span className="text-indigo-300 font-bold">{currentEmployee.name}</span>
                <span className={`font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${currentEmployee.isAdmin ? 'bg-red-500/25 border-red-500/30 text-rose-300' : 'bg-emerald-500/25 border-emerald-500/30 text-emerald-300'}`}>
                  {currentEmployee.isAdmin ? 'Prosecretaría Administrativa / Dirección' : `Agente: ${currentEmployee.position || 'Oficial'}`}
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5 sm:mt-0">CUIL de Acceso: <span className="font-mono">{currentEmployee.cuil}</span> | Dependencia: {currentEmployee.dependency}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell refreshKey={currentUser?.id} />
            <button onClick={handleLogout} className="px-4 py-2 bg-slate-800 hover:bg-rose-700 hover:text-white text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm border border-slate-700">
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-gray-200 py-6 px-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 p-2.5 rounded-2xl text-white shadow-md"><Briefcase className="w-6 h-6" /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Área de Desarrollo</h1>
              <span className="text-xs text-slate-500 font-medium font-sans">Poder Judicial de la Nación - Secretaría de Informática - Oficina de Sistemas y Tecnología (SyTec)</span>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-lg flex items-center gap-2 border bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold text-xs font-mono">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>API PostgreSQL Sincronizada</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 w-full">
        {currentRole === 'admin' ? (
          <AdminDashboard
            employees={processedEmployees}
            workLogs={workLogs}
            projects={projects}
            licenseRequests={licenseRequests}
            licenseRules={licenseRules}
            licenseArticles={licenseArticles}
            dependencies={dependencies}
            strikeConfig={strikeConfig}
            currentAdmin={currentEmployee}
            onUpdateStrikeConfig={handleUpdateStrikeConfig}
            onApproveRejectRequest={handleApproveRejectRequest}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onAddProjectUpdate={handleAddProjectUpdate}
            onAddDeployment={handleAddDeployment}
            onAddManualLicense={handleAddManualLicense}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onUpdateAvatar={handleUpdateAvatar}
            onSwapStrikeDutyOrders={handleSwapStrikeDutyOrders}
            onDeleteEmployee={handleDeleteEmployee}
            onUpdateLicenseRequest={handleUpdateLicenseRequest}
            onDeleteLicenseRequest={handleDeleteLicenseRequest}
            onClearLicenses={handleClearLicenses}
            onResetGuardias={handleResetGuardias}
            onCreateLicenseArticle={handleCreateLicenseArticle}
            onUpdateLicenseArticle={handleUpdateLicenseArticle}
            onUploadLicenseTemplate={handleUploadLicenseTemplate}
            onAddLicenseArticleField={handleAddLicenseArticleField}
            onGenerateLicensePdf={handleGenerateLicensePdf}
            onGenerateArticlePdf={handleGenerateArticlePdf}
            remindedEmpIds={remindedEmpIds}
            setRemindedEmpIds={setRemindedEmpIds}
          />
        ) : (
          <EmployeeDashboard
            employee={currentEmployee}
            employees={processedEmployees}
            workLogs={workLogs}
            projects={projects}
            licenseRequests={licenseRequests}
            licenseRules={licenseRules}
            strikeConfig={strikeConfig}
            onAddWorkLog={handleAddWorkLog}
            onUpdateProject={handleUpdateProject}
            onAddProjectUpdate={handleAddProjectUpdate}
            onAddLicenseRequest={handleAddLicenseRequest}
            onUpdateAvatar={handleUpdateAvatar}
            onUpdateEmployee={handleUpdateEmployee}
            onChangePassword={handleChangePassword}
            remindedEmpIds={remindedEmpIds}
          />
        )}
      </main>
      <footer className="text-center text-xs text-gray-400 mt-12 py-6 border-t font-mono">
        <p>2026 Poder Judicial de la Nación - Secretaría de Informática - Oficina de Sistemas y Tecnología (SyTec).</p>
        <p className="text-[10px] text-gray-300 mt-1">Persistencia PostgreSQL mediante API NestJS.</p>
      </footer>
    </div>
  );
}
