import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    HiPlus,
    HiOutlineLightningBolt,
    HiOutlineSearch,
    HiOutlineViewGrid,
    HiOutlineViewList,
    HiOutlineChevronRight,
    HiOutlineClock,
    HiOutlineOfficeBuilding,
    HiOutlineTrash
} from 'react-icons/hi';
import AppLayout from '../components/layout/AppLayout';
import { workflowsApi, organizationsApi } from '../api';
import useUIStore from '../store/uiStore';
import { canCreateWorkflow, isOrgAdmin } from '../utils/orgPermissions';
import { formatDistanceToNow } from 'date-fns';

export default function WorkflowsListPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const addToast = useUIStore((s) => s.addToast);
    const activeOrganizationId = useUIStore((s) => s.activeOrganizationId);

    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortBy, setSortBy] = useState('updated');
    const [workflowForm, setWorkflowForm] = useState({ name: '', description: '' });

    // Fetch Organization for breadcrumbs/permissions
    const { data: organization } = useQuery({
        queryKey: ['organizations', activeOrganizationId],
        queryFn: () => organizationsApi.getById(activeOrganizationId),
        enabled: !!activeOrganizationId,
    });

    // Fetch Workflows
    const { data: workflows, isLoading } = useQuery({
        queryKey: ['workflows', activeOrganizationId],
        queryFn: () => workflowsApi.listByOrganization(activeOrganizationId),
        enabled: !!activeOrganizationId,
    });

    // Create workflow mutation
    const createWorkflowMutation = useMutation({
        mutationFn: (data) => workflowsApi.create(activeOrganizationId, data),
        onSuccess: (newWorkflow) => {
            queryClient.invalidateQueries({ queryKey: ['workflows', activeOrganizationId] });
            setShowCreateModal(false);
            setWorkflowForm({ name: '', description: '' });
            addToast('Workflow created successfully', 'success');
            navigate(`/workflows/${activeOrganizationId}/${newWorkflow.id}`);
        },
        onError: (err) => addToast(err.response?.data?.message || 'Failed to create workflow', 'error'),
    });

    const deleteWorkflowMutation = useMutation({
        mutationFn: (workflowId) => workflowsApi.delete(workflowId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows', activeOrganizationId] });
            addToast('Workflow deleted', 'success');
        },
        onError: (err) => addToast(err.response?.data?.message || 'Failed to delete workflow', 'error'),
    });

    const filteredWorkflows = workflows?.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedWorkflows = filteredWorkflows?.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'updated') return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        return 0;
    });

    const handleCreateWorkflow = (e) => {
        e.preventDefault();
        createWorkflowMutation.mutate(workflowForm);
    };

    const handleDeleteWorkflow = (workflowId) => {
        if (window.confirm('Delete this workflow? Projects using it may be affected.')) {
            deleteWorkflowMutation.mutate(workflowId);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Never';
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
        } catch (e) {
            return 'Invalid date';
        }
    };

    return (
        <AppLayout title="Workflows">
            <div className="projects-list-view">
                <nav className="breadcrumb-nav">
                    <Link to="/dashboard" className="breadcrumb-link">
                        <HiOutlineOfficeBuilding />
                        Organizations
                    </Link>
                    <HiOutlineChevronRight className="breadcrumb-separator" />
                    <span className="breadcrumb-current">{organization?.name || 'Loading...'}</span>
                </nav>

                <div className="projects-header">
                    <div>
                        <h1 className="projects-title">Workflows</h1>
                        <p className="projects-subtitle">
                            {sortedWorkflows?.length || 0} {sortedWorkflows?.length === 1 ? 'workflow' : 'workflows'} defined
                        </p>
                    </div>
                    {organization && canCreateWorkflow(organization.role) && (
                        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                            <HiPlus />
                            Create Workflow
                        </button>
                    )}
                </div>

                {sortedWorkflows && sortedWorkflows.length > 0 && (
                    <div className="projects-toolbar">
                        <div className="projects-search">
                            <HiOutlineSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search workflows..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <select
                            className="projects-sort"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="updated">Recently Updated</option>
                            <option value="created">Recently Created</option>
                            <option value="name">Name (A-Z)</option>
                        </select>

                        <div className="view-toggle">
                            <button
                                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <HiOutlineViewGrid />
                            </button>
                            <button
                                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                <HiOutlineViewList />
                            </button>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="loading-center">
                        <div className="spinner spinner-lg" />
                    </div>
                ) : !sortedWorkflows || sortedWorkflows.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon"><HiOutlineLightningBolt /></div>
                        <h3>{searchQuery ? 'No workflows found' : 'No workflows yet'}</h3>
                        <p>{searchQuery ? 'Try a different search term' : 'Define your first workflow to standardize processes'}</p>
                        {organization && canCreateWorkflow(organization.role) && !searchQuery && (
                            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                                <HiPlus /> Create Workflow
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={`projects-${viewMode}`}>
                        {sortedWorkflows.map((workflow) => (
                            <div
                                key={workflow.id}
                                className={`project-${viewMode}-item`}
                                onClick={() => navigate(`/workflows/${activeOrganizationId}/${workflow.id}`)}
                            >
                                <div className="project-item-icon bg-primary/10 text-primary">
                                    <HiOutlineLightningBolt />
                                </div>

                                <div className="project-item-content">
                                    <h3 className="project-item-name">{workflow.name}</h3>
                                    {workflow.description && (
                                        <p className="project-item-desc">{workflow.description}</p>
                                    )}
                                </div>

                                <div className="project-item-meta">
                                    <span className="project-meta-item">
                                        <HiOutlineClock />
                                        {formatDate(workflow.updatedAt || workflow.createdAt)}
                                    </span>
                                </div>

                                {organization && isOrgAdmin(organization.role) && (
                                    <div className="project-item-actions">
                                        <button
                                            className="btn btn-ghost btn-sm btn-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteWorkflow(workflow.id);
                                            }}
                                            title="Delete Workflow"
                                        >
                                            <HiOutlineTrash />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {showCreateModal && (
                    <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Create Workflow</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowCreateModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleCreateWorkflow}>
                                <div className="input-group mb-4">
                                    <label>Workflow Name</label>
                                    <input
                                        className="input"
                                        value={workflowForm.name}
                                        onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                                        required
                                        minLength={2}
                                        placeholder="e.g. Software Development"
                                        autoFocus
                                    />
                                </div>
                                <div className="input-group mb-4">
                                    <label>Description (Optional)</label>
                                    <textarea
                                        className="input"
                                        value={workflowForm.description}
                                        onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                                        placeholder="Describe the process..."
                                        rows={3}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary w-full"
                                    disabled={createWorkflowMutation.isPending}
                                    style={{ justifyContent: 'center' }}
                                >
                                    {createWorkflowMutation.isPending ? <span className="spinner" /> : 'Create Workflow'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
