import useUIStore from '../../store/uiStore';
import CreateOrganizationModal from './CreateOrganizationModal';
import CreateProjectModal from './CreateProjectModal';
import CreateWorkflowModal from './CreateWorkflowModal';
import CreateTaskModal from './CreateTaskModal';

export default function GlobalModalManager() {
    const modal = useUIStore((s) => s.modal);
    const closeModal = useUIStore((s) => s.closeModal);

    if (!modal) return null;

    const { type, ...props } = modal;

    switch (type) {
        case 'createOrganization':
            return <CreateOrganizationModal isOpen={true} onClose={closeModal} {...props} />;
        case 'createProject':
            return <CreateProjectModal isOpen={true} onClose={closeModal} {...props} />;
        case 'createWorkflow':
            return <CreateWorkflowModal isOpen={true} onClose={closeModal} {...props} />;
        case 'createTask':
            return <CreateTaskModal isOpen={true} onClose={closeModal} {...props} />;
        default:
            return null;
    }
}
