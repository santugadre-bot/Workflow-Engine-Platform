import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';

export const organizationsApi = {
    list: () => client.get('/organizations').then((r) => r.data),
    getById: (id) => client.get(`/organizations/${id}`).then((r) => r.data),
    create: (data) => client.post('/organizations', data).then((r) => r.data),
    addMember: (orgId, data) => client.post(`/organizations/${orgId}/members`, data).then((r) => r.data),
    listMembers: (orgId) => client.get(`/organizations/${orgId}/members`).then((r) => r.data),
    update: (id, data) => client.put(`/organizations/${id}`, data).then((r) => r.data),
    delete: (id) => client.delete(`/organizations/${id}`).then((r) => r.data),
    removeMember: (orgId, userId) => client.delete(`/organizations/${orgId}/members/${userId}`).then((r) => r.data),
    removeMembersBulk: (orgId, userIds) => client.delete(`/organizations/${orgId}/members/bulk`, { data: userIds }).then((r) => r.data),
    updateMemberRole: (orgId, userId, role) => client.put(`/organizations/${orgId}/members/${userId}`, null, { params: { role } }).then((r) => r.data),
    getStats: (orgId) => client.get(`/organizations/${orgId}/stats`).then((r) => r.data),
};

export function useRemoveMembersBulk(orgId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userIds) => organizationsApi.removeMembersBulk(orgId, userIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
        },
    });
}

export function useOrganizations() {
    return useQuery({
        queryKey: ['organizations'],
        queryFn: organizationsApi.list,
    });
}

export function useOrganizationStats(orgId) {
    return useQuery({
        queryKey: ['organizations', orgId, 'stats'],
        queryFn: () => organizationsApi.getStats(orgId),
        enabled: !!orgId,
    });
}

export function useOrganization(id) {
    return useQuery({
        queryKey: ['organizations', id],
        queryFn: () => organizationsApi.getById(id),
        enabled: !!id,
    });
}

export function useCreateOrganization() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: organizationsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
        },
    });
}

export function useOrganizationMembers(orgId) {
    return useQuery({
        queryKey: ['organizations', orgId, 'members'],
        queryFn: () => organizationsApi.listMembers(orgId),
        enabled: !!orgId,
    });
}

export function useUpdateOrganization(id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => organizationsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            queryClient.invalidateQueries({ queryKey: ['organizations', id] });
        },
    });
}

export function useDeleteOrganization() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: organizationsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
        },
    });
}

export function useRemoveMember(orgId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId) => organizationsApi.removeMember(orgId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
        },
    });
}

export function useUpdateMemberRole(orgId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, role }) => organizationsApi.updateMemberRole(orgId, userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
        },
    });
}

/**
 * Transfer ownership to another member.
 * Promotes the target user to OWNER and downgrades the current requester to ADMIN.
 * Requires two sequential API calls.
 */
export function useTransferOwnership(orgId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ toUserId, fromUserId }) => {
            // Step 1: promote target to OWNER
            await organizationsApi.updateMemberRole(orgId, toUserId, 'OWNER');
            // Step 2: downgrade current owner to ADMIN
            await organizationsApi.updateMemberRole(orgId, fromUserId, 'ADMIN');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
            queryClient.invalidateQueries({ queryKey: ['organizations', orgId] });
        },
    });
}
