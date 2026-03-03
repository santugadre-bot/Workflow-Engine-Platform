import { useQuery } from '@tanstack/react-query';
import client from './client';

export const analyticsApi = {
    getOrganizationAnalytics: async (organizationId, days = 30) => {
        const response = await client.get(`/organizations/${organizationId}/analytics`, {
            params: { days }
        });
        return response.data;
    },
    getProjectAnalytics: async (organizationId, projectId, days = 30) => {
        const response = await client.get(`/organizations/${organizationId}/analytics/projects/${projectId}`, {
            params: { days }
        });
        return response.data;
    },
};

export const useOrganizationAnalytics = (organizationId, days) => {
    return useQuery({
        queryKey: ['analytics', organizationId, days],
        queryFn: () => analyticsApi.getOrganizationAnalytics(organizationId, days),
        enabled: !!organizationId,
    });
};

export const useProjectAnalytics = (organizationId, projectId, days) => {
    return useQuery({
        queryKey: ['analytics', organizationId, projectId, days],
        queryFn: () => analyticsApi.getProjectAnalytics(organizationId, projectId, days),
        enabled: !!organizationId && !!projectId,
    });
};
