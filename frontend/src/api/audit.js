import { useQuery } from '@tanstack/react-query';
import client from './client';

export const auditApi = {
    getActivity: (orgId, page = 0, size = 20) =>
        client.get(`/organizations/${orgId}/activity`, { params: { page, size } }).then((r) => r.data),
};

export function useActivityLog(orgId, page = 0, size = 20) {
    return useQuery({
        queryKey: ['activity', orgId, page],
        queryFn: () => auditApi.getActivity(orgId, page, size),
        enabled: !!orgId,
    });
}
