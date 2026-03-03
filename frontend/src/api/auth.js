import { useMutation } from '@tanstack/react-query';
import client from './client';

export const authApi = {
    register: (data) => client.post('/auth/register', data).then((r) => r.data),
    login: (data) => client.post('/auth/login', data).then((r) => r.data),
    refresh: (data) => client.post('/auth/refresh', data).then((r) => r.data),
};

export function useLoginMutation() {
    return useMutation({
        mutationFn: authApi.login,
    });
}

export function useRegisterMutation() {
    return useMutation({
        mutationFn: authApi.register,
    });
}
