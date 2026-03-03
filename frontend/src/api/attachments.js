import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import client from './client';

const BASE = (taskId) => `/tasks/${taskId}/attachments`;

export const attachmentsApi = {
    list: (taskId) => client.get(BASE(taskId)).then(r => r.data),
    upload: (taskId, file) => {
        const form = new FormData();
        form.append('file', file);
        return client.post(BASE(taskId), form, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(r => r.data);
    },
    delete: (taskId, attachmentId) => client.delete(`${BASE(taskId)}/${attachmentId}`).then(r => r.data),
    downloadUrl: (taskId, attachmentId) => `${client.defaults.baseURL}${BASE(taskId)}/${attachmentId}/download`,
};

export function useTaskAttachments(taskId) {
    return useQuery({
        queryKey: ['attachments', taskId],
        queryFn: () => attachmentsApi.list(taskId),
        enabled: !!taskId,
    });
}

export function useUploadAttachment(taskId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (file) => attachmentsApi.upload(taskId, file),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', taskId] }),
    });
}

export function useDeleteAttachment(taskId) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (attachmentId) => attachmentsApi.delete(taskId, attachmentId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', taskId] }),
    });
}
