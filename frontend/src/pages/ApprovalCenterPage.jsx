import { useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ApprovalCenter from '../components/approval/ApprovalCenter';

export default function ApprovalCenterPage() {
    const { organizationId } = useParams();

    return (
        <AppLayout title="Approval Center">
            <ApprovalCenter organizationId={organizationId} />
        </AppLayout>
    );
}
