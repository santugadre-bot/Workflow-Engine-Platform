import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';

export const usePendingApprovals = (organizationId) => {
    return useQuery({
        queryKey: ['pending-approvals', organizationId],
        queryFn: async () => {
            const { data } = await client.get(`/organizations/${organizationId}/approvals`);
            return data;
        },
        enabled: !!organizationId,
        refetchInterval: 30000, // Poll every 30 seconds
    });
};

export const usePendingApprovalsCount = (organizationId) => {
    return useQuery({
        queryKey: ['pending-approvals', organizationId, 'count'],
        queryFn: async () => {
            const { data } = await client.get(`/organizations/${organizationId}/approvals`);
            return Array.isArray(data) ? data.length : 0;
        },
        enabled: !!organizationId,
        refetchInterval: 30000,
    });
};

export const useApprovalHistory = (organizationId) => {
    return useQuery({
        queryKey: ['approval-history', organizationId],
        queryFn: async () => {
            const { data } = await client.get(`/organizations/${organizationId}/approvals/history`);
            return data;
        },
        enabled: !!organizationId,
        staleTime: 60000, // History is less time-sensitive — cache 1 min
    });
};

export const useProcessApproval = (organizationId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ requestId, status, comment }) => {
            await client.post(`/organizations/${organizationId}/approvals/${requestId}/process`, null, {
                params: { status, comment }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-approvals', organizationId] });
            queryClient.invalidateQueries({ queryKey: ['approval-history', organizationId] });
        },
    });
};

export const useBulkProcessApprovals = (organizationId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ requestIds, status, comment }) => {
            // Sequential API calls — one per request
            for (const requestId of requestIds) {
                await client.post(`/organizations/${organizationId}/approvals/${requestId}/process`, null, {
                    params: { status, comment }
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-approvals', organizationId] });
            queryClient.invalidateQueries({ queryKey: ['approval-history', organizationId] });
        },
    });
};
