import { useState } from 'react';
import Modal from '../modals/Modal';
import { useProjects, useAddProjectMember } from '../../api/projects';
import useUIStore from '../../store/uiStore';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';

export default function AssignToProjectModal({ isOpen, onClose, organizationId, userToAssign }) {
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [role, setRole] = useState('DEVELOPER');
    const addToast = useUIStore((s) => s.addToast);

    const { data: projects, isLoading: isLoadingProjects } = useProjects(organizationId);

    // We need a mutation that can take a dynamic projectId
    const addMemberMutation = useAddProjectMember(organizationId, selectedProjectId);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedProjectId) {
            addToast('Please select a project', 'error');
            return;
        }

        addMemberMutation.mutate(
            { email: userToAssign.email, role },
            {
                onSuccess: () => {
                    addToast(`Added ${userToAssign.displayName || userToAssign.email} to project`, 'success');
                    setSelectedProjectId('');
                    setRole('DEVELOPER');
                    onClose();
                },
                onError: (err) => {
                    addToast(err.response?.data?.message || 'Failed to add member to project', 'error');
                }
            }
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Assign ${userToAssign?.displayName || 'Member'} to Project`}
            icon={<HiOutlineOfficeBuilding />}
        >
            <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Select Project</label>
                    <select
                        className="input w-full"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        required
                        disabled={isLoadingProjects}
                    >
                        <option value="" disabled>-- Choose a project --</option>
                        {projects?.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                    {isLoadingProjects && <p className="text-xs text-text-muted mt-1">Loading projects...</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Project Role</label>
                    <select
                        className="input w-full"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                    >
                        <option value="PROJECT_ADMIN">Admin</option>
                        <option value="SCRUM_MASTER">Scrum Master</option>
                        <option value="TEAM_LEAD">Team Lead</option>
                        <option value="DEVELOPER">Developer</option>
                        <option value="QA">QA</option>
                        <option value="VIEWER">Viewer</option>
                        <option value="REPORTER">Reporter</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-ghost"
                        disabled={addMemberMutation.isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={addMemberMutation.isPending || isLoadingProjects || !selectedProjectId}
                    >
                        {addMemberMutation.isPending ? 'Assigning...' : 'Assign to Project'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
