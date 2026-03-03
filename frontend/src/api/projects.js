import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';

export const projectsApi = {
    list: (orgId) => {
        if (!orgId || orgId === 'undefined') return Promise.resolve([]);
        return client.get(`/organizations/${orgId}/projects`).then((r) => r.data);
    },
    getById: (orgId, projId) => {
        if (!orgId || orgId === 'undefined' || !projId || projId === 'undefined') return Promise.resolve(null);
        return client.get(`/organizations/${orgId}/projects/${projId}`).then((r) => r.data);
    },
    create: (orgId, data) => client.post(`/organizations/${orgId}/projects`, data).then((r) => r.data),
    update: (orgId, projId, data) => client.put(`/organizations/${orgId}/projects/${projId}`, data).then((r) => r.data),
    delete: (orgId, projId) => client.delete(`/organizations/${orgId}/projects/${projId}`).then((r) => r.data),

    // Member Management
    listMembers: (orgId, projId) => client.get(`/organizations/${orgId}/projects/${projId}/members`).then((r) => r.data),
    addMember: (orgId, projId, data) => client.post(`/organizations/${orgId}/projects/${projId}/members`, data).then((r) => r.data),
    removeMember: (orgId, projId, memberId) => client.delete(`/organizations/${orgId}/projects/${projId}/members/${memberId}`).then((r) => r.data),
    removeMembersBulk: (orgId, projId, userIds) => client.delete(`/organizations/${orgId}/projects/${projId}/members/bulk`, { data: userIds }).then((r) => r.data),
    updateMemberRole: (orgId, projId, memberId, role) => client.put(`/organizations/${orgId}/projects/${projId}/members/${memberId}?role=${role}`).then((r) => r.data),
};

export function useProjects(orgId) {
    return useQuery({
        queryKey: ['projects', orgId],
        queryFn: () => projectsApi.list(orgId),
        enabled: !!orgId && orgId !== 'undefined',
        staleTime: 5 * 60 * 1000, // Project list rarely changes mid-session
    });
}

export function useProject(orgId, projId) {
    return useQuery({
        queryKey: ['projects', orgId, projId],
        queryFn: () => projectsApi.getById(orgId, projId),
        enabled: !!orgId && orgId !== 'undefined' && !!projId && projId !== 'undefined',
        staleTime: 5 * 60 * 1000, // Project detail rarely changes mid-session
    });
}

export function useCreateProject(orgId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => projectsApi.create(orgId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', orgId] });
        },
    });
}

export function useUpdateProject(orgId, projId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => projectsApi.update(orgId, projId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', orgId] });
            queryClient.invalidateQueries({ queryKey: ['projects', orgId, projId] });
        },
    });
}

export function useArchiveProject(orgId, projId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => axios.post(`/api/organizations/${orgId}/projects/${projId}/archive`).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', orgId] });
            queryClient.invalidateQueries({ queryKey: ['projects', orgId, projId] });
        },
    });
}

export function downloadProjectExport(orgId, projId, projectName) {
    return axios.get(`/api/organizations/${orgId}/projects/${projId}/export`, {
        responseType: 'blob', // Important for downloading files
    }).then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `project_${projectName || projId}_export.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    });
}

export function useDeleteProject(orgId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (projId) => projectsApi.delete(orgId, projId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', orgId] });
        },
    });
}

// --- Project Members ---

export function useProjectMembers(orgId, projId) {
    return useQuery({
        queryKey: ['project-members', orgId, projId],
        queryFn: () => projectsApi.listMembers(orgId, projId),
        enabled: !!orgId && orgId !== 'undefined' && !!projId && projId !== 'undefined',
    });
}

export function useAddProjectMember(orgId, projId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => projectsApi.addMember(orgId, projId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-members', orgId, projId] });
            queryClient.invalidateQueries({ queryKey: ['projects', orgId, projId] }); // Refresh team overview
        },
    });
}

export function useRemoveProjectMember(orgId, projId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (memberId) => projectsApi.removeMember(orgId, projId, memberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-members', orgId, projId] });
            queryClient.invalidateQueries({ queryKey: ['projects', orgId, projId] });
        },
    });
}

export function useUpdateProjectMemberRole(orgId, projId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ memberId, role }) => projectsApi.updateMemberRole(orgId, projId, memberId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-members', orgId, projId] });
            queryClient.invalidateQueries({ queryKey: ['projects', orgId, projId] });
        },
    });
}

export function useRemoveProjectMembersBulk(orgId, projId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userIds) => projectsApi.removeMembersBulk(orgId, projId, userIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project-members', orgId, projId] });
            queryClient.invalidateQueries({ queryKey: ['projects', orgId, projId] });
        },
    });
}
