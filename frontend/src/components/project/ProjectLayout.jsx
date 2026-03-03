import { useParams, Outlet, Navigate } from 'react-router-dom';
import { useProject } from '../../api/projects';
import AppLayout from '../layout/AppLayout';

/**
 * ProjectLayout — unified workspace wrapper.
 * 
 * Responsibilities:
 * 1. Extract org/proj IDs from URL.
 * 2. Fetch project data (cached via TanStack Query).
 * 3. Provide context to nested views (Board, Backlog, Settings, etc.).
 * 4. Maintain the consistent shell (Sidebar/Topbar).
 */
export default function ProjectLayout() {
    const { organizationId, projectId } = useParams();

    // Fetch project data (should be cached if coming from ProjectList)
    const { data: project, isLoading, error } = useProject(organizationId, projectId);

    if (isLoading) {
        return (
            <AppLayout fullWidth>
                <div className="flex items-center justify-center h-full">
                    <div className="spinner spinner-lg" />
                </div>
            </AppLayout>
        );
    }

    if (error || !project) {
        return <Navigate to={`/projects/${organizationId}`} replace />;
    }

    return (
        <AppLayout fullWidth>
            {/* 
                Provide project data to all sub-pages (Board, Backlog, etc.) 
                using the Outlet context pattern. This avoids prop drilling.
            */}
            <Outlet context={{ project, organizationId, projectId }} />
        </AppLayout>
    );
}
