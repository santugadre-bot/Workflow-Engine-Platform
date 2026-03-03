import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';

export const tasksApi = {
    listByProject: (projId) => client.get(`/projects/${projId}/tasks`).then((r) => r.data),
    getById: (taskId) => client.get(`/tasks/${taskId}`).then((r) => r.data),
    create: (projId, data) => client.post(`/projects/${projId}/tasks`, data).then((r) => r.data),
    update: (taskId, data) => client.put(`/tasks/${taskId}`, data).then((r) => r.data),
    transition: (taskId, transitionId) => client.post(`/tasks/${taskId}/transition/${transitionId}`).then((r) => r.data),
    getComments: (taskId) => client.get(`/tasks/${taskId}/comments`).then((r) => r.data),
    addComment: (taskId, data) => client.post(`/tasks/${taskId}/comments`, data).then((r) => r.data),
    getHistory: (taskId) => client.get(`/tasks/${taskId}/history`).then((r) => r.data),
    delete: (taskId) => client.delete(`/tasks/${taskId}`).then((r) => r.data),
    getMyTasks: (organizationId, page = 0, limit = 10) => client.get(`/organizations/${organizationId}/tasks/my`, { params: { page, limit } }).then((r) => r.data),
    getLinks: (taskId) => client.get(`/tasks/${taskId}/links`).then((r) => r.data),
    createLink: (taskId, data) => client.post(`/tasks/${taskId}/links`, data).then((r) => r.data),
    deleteLink: (taskId, targetTaskId) => client.delete(`/tasks/${taskId}/links/${targetTaskId}`).then((r) => r.data),
    bulkUpdate: (data) => client.post('/tasks/bulk', data).then((r) => r.data),
};

export function useTasks(projId, options = {}) {
    return useQuery({
        queryKey: ['tasks', projId],
        queryFn: () => tasksApi.listByProject(projId),
        enabled: !!projId,
        ...options,
    });
}

export function useMyTasks(organizationId, page = 0, limit = 10) {
    return useQuery({
        queryKey: ['tasks', 'my', organizationId, page, limit],
        queryFn: () => tasksApi.getMyTasks(organizationId, page, limit),
        enabled: !!organizationId,
        keepPreviousData: true,
    });
}

export function useTask(taskId) {
    return useQuery({
        queryKey: ['tasks', taskId],
        queryFn: () => tasksApi.getById(taskId),
        enabled: !!taskId,
    });
}

export function useTaskComments(taskId) {
    return useQuery({
        queryKey: ['tasks', taskId, 'comments'],
        queryFn: () => tasksApi.getComments(taskId),
        enabled: !!taskId,
        staleTime: 60_000, // Comments are append-only; 60s is safe
    });
}

export function useTaskHistory(taskId) {
    return useQuery({
        queryKey: ['tasks', taskId, 'history'],
        queryFn: () => tasksApi.getHistory(taskId),
        enabled: !!taskId,
        staleTime: 5 * 60 * 1000, // History is immutable — cache aggressively
    });
}

export function useTransitionTask(projId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, transitionId }) => tasksApi.transition(taskId, transitionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projId] });
        },
    });
}

export function useCreateTask(projId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => tasksApi.create(projId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projId] });
        },
    });
}

export function useDeleteTask(projId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: tasksApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projId] });
        },
    });
}

export function useAddComment(taskId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => tasksApi.addComment(taskId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'comments'] });
        },
    });
}

export function useUpdateTask(projId, taskId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => tasksApi.update(taskId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projId] });
            queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
        },
    });
}

export function useUpdateTaskGeneral(projId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, data }) => tasksApi.update(taskId, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projId] });
            queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] });
        },
    });
}

export function useTaskLinks(taskId) {
    return useQuery({
        queryKey: ['tasks', taskId, 'links'],
        queryFn: () => tasksApi.getLinks(taskId),
        enabled: !!taskId,
    });
}

export function useCreateTaskLink(taskId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => tasksApi.createLink(taskId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'links'] });
        },
    });
}

export function useDeleteTaskLink(taskId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (targetTaskId) => tasksApi.deleteLink(taskId, targetTaskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'links'] });
        },
    });
}

