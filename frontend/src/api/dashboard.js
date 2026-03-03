import client from './client';

export const dashboardApi = {
    getStats: async (organizationId) => {
        const response = await client.get(`/organizations/${organizationId}/stats`);
        return response.data;
    },

    getActivity: async (organizationId, limit = 20) => {
        const response = await client.get(`/organizations/${organizationId}/dashboard/activity`, {
            params: { limit }
        });
        return response.data;
    }
};
