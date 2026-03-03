import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import client from './client';

// ─── API functions ────────────────────────────────────────────────────────────

export const sprintsApi = {
    list: (projectId) => client.get(`/projects/${projectId}/sprints`).then(r => r.data),
    create: (projectId, data) => client.post(`/projects/${projectId}/sprints`, data).then(r => r.data),
    start: (projectId, sprintId, data) =>
        client.post(`/projects/${projectId}/sprints/${sprintId}/start`, data).then(r => r.data),
    addTask: (projectId, sprintId, taskId) =>
        client.post(`/projects/${projectId}/sprints/${sprintId}/tasks/${taskId}`).then(r => r.data),
    removeTask: (projectId, sprintId, taskId) =>
        client.delete(`/projects/${projectId}/sprints/${sprintId}/tasks/${taskId}`).then(r => r.data),
    burndown: (projectId, sprintId) =>
        client.get(`/projects/${projectId}/sprints/${sprintId}/burndown`).then(r => r.data),
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSprints(projectId) {
    return useQuery({
        queryKey: ['sprints', projectId],
        queryFn: () => sprintsApi.list(projectId),
        enabled: !!projectId,
        staleTime: 2 * 60 * 1000, // Sprint list changes only when user acts
    });
}

export function useCreateSprint(projectId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => sprintsApi.create(projectId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sprints', projectId] });
            qc.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

export function useStartSprint(projectId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ sprintId, ...data }) => sprintsApi.start(projectId, sprintId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sprints', projectId] });
            qc.invalidateQueries({ queryKey: ['tasks'] });
            qc.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

export function useAddTaskToSprint(projectId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ sprintId, taskId }) => sprintsApi.addTask(projectId, sprintId, taskId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks', projectId] });
            qc.invalidateQueries({ queryKey: ['sprints', projectId] });
            qc.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });
}

export function useRemoveTaskFromSprint(projectId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ sprintId, taskId }) => sprintsApi.removeTask(projectId, sprintId, taskId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks', projectId] });
            qc.invalidateQueries({ queryKey: ['sprints', projectId] });
            qc.invalidateQueries({ queryKey: ['projects', projectId] });
        },
    });
}

export function useSprintBurndown(projectId, sprintId) {
    return useQuery({
        queryKey: ['burndown', sprintId],
        queryFn: () => sprintsApi.burndown(projectId, sprintId),
        enabled: !!projectId && !!sprintId,
        staleTime: 60_000,
    });
}
