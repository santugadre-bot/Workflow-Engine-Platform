import client from './client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const notificationsApi = {
    list: () => client.get('/notifications').then((res) => res.data),
    getUnreadCount: () => client.get('/notifications/unread-count').then((res) => res.data),
    markRead: (id) => client.post(`/notifications/${id}/read`),
    markAllRead: () => client.post('/notifications/read-all'),
};

export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: notificationsApi.list,
        refetchInterval: 30000, // Poll every 30s
    });
}

export function useUnreadNotificationsCount() {
    return useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: notificationsApi.getUnreadCount,
        refetchInterval: 30000,
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: notificationsApi.markRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: notificationsApi.markAllRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}
