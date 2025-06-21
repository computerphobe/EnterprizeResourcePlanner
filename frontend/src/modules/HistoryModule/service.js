import { request } from '@/request';

export const historyService = {
  // Get history with filters
  getHistory: async (params = {}) => {
    return await request.get('/history', { params });
  },

  // Get available filter options
  getFilters: async () => {
    return await request.get('/history/filters');
  },

  // Export history data
  exportHistory: async (params = {}) => {
    return await request.get('/api/history/export', { 
      params,
      responseType: 'blob'
    });
  }
};
