import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';

export const useAutomationRules = (projectId) => {
    return useQuery({
        queryKey: ['automation-rules', projectId],
        queryFn: async () => {
            const { data } = await client.get(`/projects/${projectId}/automation`);
            return data;
        },
        enabled: !!projectId,
    });
};

export const useCreateAutomationRule = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (rule) => {
            const { data } = await client.post(`/projects/${projectId}/automation`, rule);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation-rules', projectId] });
        },
    });
};

export const useUpdateAutomationRule = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ ruleId, rule }) => {
            const { data } = await client.put(`/projects/${projectId}/automation/${ruleId}`, rule);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation-rules', projectId] });
        },
    });
};

export const useDeleteAutomationRule = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ruleId) => {
            await client.delete(`/projects/${projectId}/automation/${ruleId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['automation-rules', projectId] });
        },
    });
};
