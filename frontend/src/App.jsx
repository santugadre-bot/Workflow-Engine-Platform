import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import useUIStore from './store/uiStore';

// ─── Eagerly loaded (tiny, always needed) ─────────────────────────────────────
import CommandPalette from './components/layout/CommandPalette';
import GlobalModalManager from './components/modals/GlobalModalManager';

// ─── Lazily loaded pages (code-split per route) ───────────────────────────────
// Auth & public — small, but still lazy to keep the initial bundle tight
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

const InboxPage = lazy(() => import('./pages/InboxPage'));

// Core app pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectsListPage = lazy(() => import('./pages/ProjectsListPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MyTasksPage = lazy(() => import('./pages/MyTasksPage'));
const ActivityLogPage = lazy(() => import('./pages/ActivityLogPage'));



// Project workspace
const ProjectLayout = lazy(() => import('./components/project/ProjectLayout'));
const ProjectOverviewPage = lazy(() => import('./pages/ProjectOverviewPage'));
const ProjectBoardView = lazy(() => import('./pages/ProjectBoardView'));
const ProjectBacklogView = lazy(() => import('./pages/ProjectBacklogView'));
const ProjectAnalyticsPage = lazy(() => import('./pages/ProjectAnalyticsPage'));
const ProjectAutomationPage = lazy(() => import('./pages/ProjectAutomationPage'));
const ProjectSettingsPage = lazy(() => import('./pages/ProjectSettingsPage'));
const ProjectMembersPage = lazy(() => import('./pages/ProjectMembersPage'));
const ProjectTasksListPage = lazy(() => import('./pages/ProjectTasksListPage'));


// Organization pages
const OrganizationMembersPage = lazy(() => import('./pages/OrganizationMembersPage'));
const OrganizationSettingsPage = lazy(() => import('./pages/OrganizationSettingsPage'));
const ApprovalCenterPage = lazy(() => import('./pages/ApprovalCenterPage'));
const AnalyticsDashboardPage = lazy(() => import('./pages/OrganizationAnalyticsPage'));
const RoleAccessControlPage = lazy(() => import('./pages/RoleAccessControlPage'));

// Workflow pages
const WorkflowsListPage = lazy(() => import('./pages/WorkflowsListPage'));
const WorkflowBuilderPage = lazy(() => import('./pages/WorkflowBuilderPage'));
const ProjectWorkflowPage = lazy(() => import('./pages/ProjectWorkflowPage'));

// ─── Route-level loading fallback ─────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="loading-center">
      <div className="spinner" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const toasts = useUIStore((s) => s.toasts);
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/projects/:organizationId"
            element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>}
          />

          {/* Unified Project Workspace */}
          <Route path="/projects/:organizationId/:projectId" element={<ProtectedRoute><ProjectLayout /></ProtectedRoute>}>
            <Route index element={<ProjectOverviewPage />} />
            <Route path="overview" element={<ProjectOverviewPage />} />
            <Route path="board/:taskId?" element={<ProjectBoardView />} />
            <Route path="backlog/:taskId?" element={<ProjectBacklogView />} />
            <Route path="issue/:taskId" element={<ProjectBoardView />} />
            <Route path="analytics" element={<ProjectAnalyticsPage />} />
            <Route path="workflow" element={<ProjectWorkflowPage />} />
            <Route path="automation" element={<ProjectAutomationPage />} />
            <Route path="team" element={<ProjectMembersPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
            <Route path="tasks" element={<ProjectTasksListPage />} />

          </Route>

          <Route
            path="/workflows/:organizationId"
            element={<ProtectedRoute><WorkflowsListPage /></ProtectedRoute>}
          />
          <Route
            path="/workflows/:organizationId/:workflowId"
            element={<ProtectedRoute><WorkflowBuilderPage /></ProtectedRoute>}
          />
          <Route
            path="/organizations/:organizationId/members"
            element={<ProtectedRoute><OrganizationMembersPage /></ProtectedRoute>}
          />
          <Route
            path="/organizations/:organizationId/approvals"
            element={<ProtectedRoute><ApprovalCenterPage /></ProtectedRoute>}
          />
          <Route
            path="/organizations/:organizationId/analytics"
            element={<ProtectedRoute><AnalyticsDashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/organizations/:organizationId/tasks/my"
            element={<ProtectedRoute><MyTasksPage /></ProtectedRoute>}
          />
          <Route
            path="/activity/:organizationId"
            element={<ProtectedRoute><ActivityLogPage /></ProtectedRoute>}
          />
          <Route
            path="/inbox"
            element={<ProtectedRoute><InboxPage /></ProtectedRoute>}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
          />
          <Route
            path="/organizations/:organizationId/settings"
            element={<ProtectedRoute><OrganizationSettingsPage /></ProtectedRoute>}
          />
          <Route
            path="/organizations/:organizationId/access-control"
            element={<ProtectedRoute><RoleAccessControlPage /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Global Toast Container */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
          ))}
        </div>
      )}
      <CommandPalette />
      <GlobalModalManager />
    </>
  );
}

export default App;
