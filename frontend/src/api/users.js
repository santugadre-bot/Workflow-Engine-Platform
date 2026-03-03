import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';

export const usersApi = {
    getMe: () => client.get('/users/me').then((res) => res.data),
    updateProfile: (data) => client.put('/users/me', data).then((res) => res.data),
    changePassword: (data) => client.put('/users/me/password', data).then((res) => res.data),
    uploadAvatar: (formData) => client.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then((res) => res.data),
    deleteAvatar: () => client.delete('/users/me/avatar').then((res) => res.data),
};

export function useCurrentUser() {
    return useQuery({
        queryKey: ['users', 'me'],
        queryFn: usersApi.getMe,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.updateProfile,
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(['users', 'me'], updatedUser);
            // Also update the 'user' in safeStorage or AuthContext if needed
            // But usually, we trigger a refetch or AuthContext handles it via its own state
        },
    });
}

export function useChangePassword() {
    return useMutation({
        mutationFn: usersApi.changePassword,
    });
}

export function useUpdateAvatar() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.uploadAvatar,
        onSuccess: (avatarUrl) => {
            queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
        },
    });
}

export function useRemoveAvatar() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: usersApi.deleteAvatar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
        },
    });
}
