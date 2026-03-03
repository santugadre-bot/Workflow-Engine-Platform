import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';

export const slaApi = {
    list: (projectId) => client.get(`/projects/${projectId}/sla-policies`).then((r) => r.data),
    create: (projectId, data) => client.post(`/projects/${projectId}/sla-policies`, data).then((r) => r.data),
    update: (projectId, policyId, data) => client.put(`/projects/${projectId}/sla-policies/${policyId}`, data).then((r) => r.data),
    delete: (projectId, policyId) => client.delete(`/projects/${projectId}/sla-policies/${policyId}`).then((r) => r.data),
};

export function useSlaPolicies(projectId) {
    return useQuery({
        queryKey: ['sla-policies', projectId],
        queryFn: () => slaApi.list(projectId),
        enabled: !!projectId,
    });
}

export function useCreateSlaPolicy(projectId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => slaApi.create(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sla-policies', projectId] });
        },
    });
}

export function useUpdateSlaPolicy(projectId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ policyId, data }) => slaApi.update(projectId, policyId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sla-policies', projectId] });
        },
    });
}

export function useDeleteSlaPolicy(projectId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (policyId) => slaApi.delete(projectId, policyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sla-policies', projectId] });
        },
    });
}
