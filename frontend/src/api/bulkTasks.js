import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from './client';

export const bulkTasksApi = {
    bulk: (data) => client.post('/tasks/bulk', data).then(r => r.data),
};

export function useBulkTasks(projectId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => bulkTasksApi.bulk(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        },
    });
}
