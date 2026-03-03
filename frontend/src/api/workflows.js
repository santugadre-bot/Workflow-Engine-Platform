import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';

export const workflowsApi = {
    listByOrganization: (orgId) => {
        if (!orgId || orgId === 'undefined') return Promise.resolve([]);
        return client.get(`/organizations/${orgId}/workflows`).then((r) => r.data);
    },
    getById: (wfId) => client.get(`/workflows/${wfId}`).then((r) => r.data),
    create: (orgId, data) => client.post(`/organizations/${orgId}/workflows`, data).then((r) => r.data),
    addState: (wfId, data) => client.post(`/workflows/${wfId}/states`, data).then((r) => r.data),
    addTransition: (wfId, data) => client.post(`/workflows/${wfId}/transitions`, data).then((r) => r.data),
    validateAndActivate: (wfId) => client.post(`/workflows/${wfId}/validate`).then((r) => r.data),
    assignToProject: (wfId, projId) => client.post(`/workflows/${wfId}/assign/${projId}`).then((r) => r.data),
    update: (wfId, data) => client.put(`/workflows/${wfId}`, data).then((r) => r.data),
    delete: (wfId) => client.delete(`/workflows/${wfId}`).then((r) => r.data),
    deleteState: (wfId, stateId) => client.delete(`/workflows/${wfId}/states/${stateId}`).then((r) => r.data),
    deleteTransition: (wfId, transitionId) => client.delete(`/workflows/${wfId}/transitions/${transitionId}`).then((r) => r.data),
    updateStatePositions: (wfId, positions) => client.put(`/workflows/${wfId}/states/positions`, positions).then((r) => r.data),
    updateState: (wfId, stateId, data) => client.put(`/workflows/${wfId}/states/${stateId}`, data).then((r) => r.data),
    updateTransition: (wfId, transitionId, data) => client.put(`/workflows/${wfId}/transitions/${transitionId}`, data).then((r) => r.data),
};

export function useWorkflows(orgId) {
    return useQuery({
        queryKey: ['workflows', orgId],
        queryFn: () => workflowsApi.listByOrganization(orgId),
        enabled: !!orgId && orgId !== 'undefined',
    });
}

export function useWorkflow(wfId) {
    return useQuery({
        queryKey: ['workflow', wfId],
        queryFn: () => workflowsApi.getById(wfId),
        enabled: !!wfId,
    });
}

export function useCreateWorkflow(orgId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => workflowsApi.create(orgId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows', orgId] });
        },
    });
}

export function useAddState(wfId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => workflowsApi.addState(wfId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', wfId] });
        },
    });
}

export function useAddTransition(wfId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => workflowsApi.addTransition(wfId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', wfId] });
        },
    });
}

export function useActivateWorkflow(wfId, orgId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => workflowsApi.validateAndActivate(wfId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', wfId] });
            queryClient.invalidateQueries({ queryKey: ['workflows', orgId] });
        },
    });
}

export function useUpdateWorkflow(wfId, orgId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => workflowsApi.update(wfId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', wfId] });
            queryClient.invalidateQueries({ queryKey: ['workflows', orgId] });
        },
    });
}

export function useDeleteWorkflow(orgId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: workflowsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflows', orgId] });
        },
    });
}

export function useDeleteState(wfId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (stateId) => workflowsApi.deleteState(wfId, stateId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', wfId] });
        },
    });
}

export function useDeleteTransition(wfId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (transitionId) => workflowsApi.deleteTransition(wfId, transitionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', wfId] });
        },
    });
}

export function useUpdateStatePositions(wfId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (positions) => workflowsApi.updateStatePositions(wfId, positions),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', wfId] });
        },
    });
}

export function useUpdateState(wfId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ stateId, data }) => workflowsApi.updateState(wfId, stateId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', wfId] });
        },
    });
}

export function useUpdateTransition(wfId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ transitionId, data }) => workflowsApi.updateTransition(wfId, transitionId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow', wfId] });
        },
    });
}
