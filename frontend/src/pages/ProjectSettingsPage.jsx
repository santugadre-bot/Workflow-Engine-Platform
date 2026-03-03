import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useUpdateProject, useDeleteProject, useArchiveProject, downloadProjectExport } from '../api/projects';
import { useWorkflows } from '../api/workflows';
import { useAuth } from '../context/AuthContext';
import useUIStore from '../store/uiStore';
import { HiOutlineSave, HiOutlineTrash, HiOutlineExclamationCircle } from 'react-icons/hi';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import SlaPolicyList from '../components/sla/SlaPolicyList';
import PermissionMatrix from '../components/governance/PermissionMatrix';
import WorkflowSnapshot from '../components/governance/WorkflowSnapshot';
import { canManageSettings } from '../utils/permissions';
import { HiOutlineShieldCheck, HiOutlineAdjustments, HiOutlineScale, HiOutlineExternalLink } from 'react-icons/hi';

export default function ProjectSettingsPage() {
    const { organizationId, projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const addToast = useUIStore((s) => s.addToast);

    const { data: project, isLoading, error } = useProject(organizationId, projectId);
    const { data: workflows } = useWorkflows(organizationId);
    const updateProjectMutation = useUpdateProject(organizationId, projectId);
    const deleteProjectMutation = useDeleteProject(organizationId);
    const archiveProjectMutation = useArchiveProject(organizationId, projectId);

    const [form, setForm] = useState({
        name: '',
        description: '',
        workflowId: '',
        showDueDate: true,
        showStoryPoints: true,
        explicitStatus: 'ACTIVE'
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        if (organizationId === 'undefined' || projectId === 'undefined') {
            navigate('/dashboard', { replace: true });
            return;
        }

        if (project) {
            setForm({
                name: project.name,
                description: project.description || '',
                workflowId: project.workflowId || '',
                showDueDate: project.showDueDate ?? true,
                showStoryPoints: project.showStoryPoints ?? true,
                explicitStatus: project.explicitStatus || 'ACTIVE'
            });
        }
    }, [project, organizationId, projectId, navigate]);

    const handleUpdate = (e) => {
        e.preventDefault();
        // Backend expects UUID or null, empty string causes serialization error
        const payload = {
            ...form,
            workflowId: form.workflowId === '' ? null : form.workflowId
        };
        updateProjectMutation.mutate(payload, {
            onSuccess: () => addToast('Project settings saved', 'success'),
            onError: (err) => addToast(err.response?.data?.message || 'Failed to update project', 'error')
        });
    };

    const handleDelete = () => {
        deleteProjectMutation.mutate(projectId, {
            onSuccess: () => {
                navigate(`/projects/${organizationId}`); // Redirect to project list
                addToast('Project deleted successfully', 'success');
            },
            onError: (err) => {
                setIsDeleteModalOpen(false);
                addToast(err.response?.data?.message || 'Failed to delete project', 'error');
            }
        });
    };

    const handleArchiveToggle = () => {
        archiveProjectMutation.mutate(null, {
            onSuccess: (data) => {
                addToast(`Project ${data.archived ? 'archived' : 'unarchived'} successfully`, 'success');
            },
            onError: (err) => {
                addToast(err.response?.data?.message || 'Failed to update archive status', 'error');
            }
        });
    };

    const handleExport = async () => {
        try {
            addToast('Preparing export...', 'info');
            await downloadProjectExport(organizationId, projectId, project.name);
            addToast('Export downloaded successfully', 'success');
        } catch (error) {
            addToast('Failed to export project data', 'error');
        }
    };

    if (isLoading) return <div className="p-12 flex justify-center"><div className="spinner spinner-lg" /></div>;
    if (error) return <div className="p-12 text-danger">Failed to load project: {error.message}</div>;

    // Basic permission check (can be refined with granular permissions)
    // If usage of this page should be restricted to ADMIN/MANAGER, logic belongs here.

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary mb-2">Project Settings</h1>
                <p className="text-text-secondary">Manage configuration and danger zone actions for <strong>{project.name}</strong>.</p>
            </div>

            {/* Tabs for Navigation */}
            <div className="flex border-b border-border-muted mb-6">
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text-primary'}`}
                    onClick={() => setActiveTab('general')}
                >
                    General
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sla' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text-primary'}`}
                    onClick={() => setActiveTab('sla')}
                >
                    SLA Policies
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'governance' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text-primary'}`}
                    onClick={() => setActiveTab('governance')}
                >
                    <div className="flex items-center gap-2">
                        <HiOutlineScale className="w-4 h-4" /> Governance
                    </div>
                </button>
                {canManageSettings(project?.role) && (
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'danger' ? 'border-danger text-danger' : 'border-transparent text-muted hover:text-danger'}`}
                        onClick={() => setActiveTab('danger')}
                    >
                        Danger Zone
                    </button>
                )}
            </div>

            {activeTab === 'general' && (
                <div className="card mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-6 border-b border-border-subtle">
                        <h2 className="text-lg font-bold text-text-primary">General</h2>
                        <p className="text-sm text-text-secondary">Update your project's core information.</p>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-2">Project Name</label>
                                <input
                                    type="text"
                                    className="input w-full max-w-lg"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-2">Project Status</label>
                                <select
                                    className="input w-full max-w-lg"
                                    value={form.explicitStatus}
                                    onChange={(e) => setForm({ ...form, explicitStatus: e.target.value })}
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="ON_HOLD">On Hold</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-2">Assigned Workflow</label>
                                <select
                                    className="input w-full max-w-lg"
                                    value={form.workflowId || ''}
                                    onChange={(e) => setForm({ ...form, workflowId: e.target.value })}
                                >
                                    <option value="">-- Select Workflow --</option>
                                    {workflows?.map(wf => (
                                        <option key={wf.id} value={wf.id}>{wf.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-text-secondary mt-1">
                                    Changing the workflow may affect existing tasks state.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-primary mb-2">Description</label>
                                <textarea
                                    className="input w-full max-w-lg h-32"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="What is this project about?"
                                />
                            </div>

                            <div className="pt-6 border-t border-border-muted space-y-4">
                                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                    <HiOutlineAdjustments className="w-4 h-4" /> Field Configuration
                                </h3>
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between p-3 rounded-lg border border-border-subtle hover:bg-bg-base/50 transition-colors cursor-pointer">
                                        <div className="text-sm">
                                            <div className="font-bold text-text-primary">Enable Due Dates</div>
                                            <div className="text-xs text-text-secondary">Show expected completion dates on tasks.</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={form.showDueDate}
                                            onChange={(e) => setForm({ ...form, showDueDate: e.target.checked })}
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-3 rounded-lg border border-border-subtle hover:bg-bg-base/50 transition-colors cursor-pointer">
                                        <div className="text-sm">
                                            <div className="font-bold text-text-primary">Enable Story Points</div>
                                            <div className="text-xs text-text-secondary">Used for estimating effort and tracking velocity.</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={form.showStoryPoints}
                                            onChange={(e) => setForm({ ...form, showStoryPoints: e.target.checked })}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border-muted flex justify-end">
                                {canManageSettings(project?.role) && (
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={updateProjectMutation.isPending || (
                                            form.name === project.name &&
                                            (form.description || '') === (project.description || '') &&
                                            form.workflowId === (project.workflowId || '') &&
                                            form.showDueDate === (project.showDueDate ?? true) &&
                                            form.showStoryPoints === (project.showStoryPoints ?? true) &&
                                            form.explicitStatus === (project.explicitStatus || 'ACTIVE')
                                        )}
                                    >
                                        {updateProjectMutation.isPending ? <span className="spinner" /> : (
                                            <>
                                                <HiOutlineSave className="mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

            {
                activeTab === 'governance' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <HiOutlineShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-bold text-text-primary">Governance Control Center</div>
                                <div className="text-sm text-text-secondary">Audit and monitor the underlying structural power of this project.</div>
                            </div>
                        </div>

                        <PermissionMatrix />
                        <WorkflowSnapshot workflowId={project.workflowId} />
                    </div>
                )
            }

            {
                activeTab === 'sla' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <SlaPolicyList
                            projectId={projectId}
                            organizationId={organizationId}
                            workflowId={project.workflowId}
                        />
                    </div>
                )
            }

            {
                activeTab === 'danger' && (
                    <div className="border border-danger/30 rounded-xl overflow-hidden bg-bg-raised animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-6 border-b border-danger/20 bg-danger/5">
                            <div className="flex items-center gap-3 text-danger">
                                <HiOutlineExclamationCircle className="w-6 h-6" />
                                <h2 className="text-lg font-bold">Danger Zone</h2>
                            </div>
                            <p className="text-sm text-text-secondary mt-1 ml-9">Advanced actions for project lifecycle management.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Export Section */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-muted/50">
                                <div>
                                    <div className="font-bold text-text-primary">Export Project Data</div>
                                    <div className="text-sm text-text-secondary mt-1">
                                        Download a complete JSON backup of this project, including tasks, sprints, and members.
                                    </div>
                                </div>
                                <button
                                    onClick={handleExport}
                                    className="btn btn-outline whitespace-nowrap"
                                >
                                    Export to JSON
                                </button>
                            </div>

                            {/* Archive Section */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-muted/50">
                                <div>
                                    <div className="font-bold text-text-primary">{project.archived ? 'Unarchive Project' : 'Archive Project'}</div>
                                    <div className="text-sm text-text-secondary mt-1 max-w-lg">
                                        {project.archived
                                            ? 'Restore this project to active status. It will reappear in standard views and lists.'
                                            : 'Mark this project as read-only and hide it from active lists. Data is preserved and can be unarchived later.'}
                                    </div>
                                </div>
                                <button
                                    onClick={handleArchiveToggle}
                                    disabled={archiveProjectMutation.isPending}
                                    className={`btn whitespace-nowrap ${project.archived ? 'btn-outline' : 'btn-ghost text-amber-600 hover:bg-amber-50 border border-amber-200 hover:border-amber-400'}`}
                                >
                                    {archiveProjectMutation.isPending ? <span className="spinner" /> : (
                                        project.archived ? 'Unarchive' : 'Archive Project'
                                    )}
                                </button>
                            </div>

                            {/* Delete Section */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                                <div>
                                    <div className="font-bold text-text-primary">Delete this project</div>
                                    <div className="text-sm text-text-secondary">
                                        Once deleted, it will be gone forever. Please be certain.
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="btn btn-ghost text-danger hover:bg-danger/10 border border-danger/30 hover:border-danger"
                                >
                                    Delete Project
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Project?"
                message={`This will permanently delete the project "${project.name}" and all of its tasks, workflows, and automation rules. This action cannot be undone.`}
                confirmationMapString={project.name}
                isPending={deleteProjectMutation.isPending}
            />
        </div >
    );
}
