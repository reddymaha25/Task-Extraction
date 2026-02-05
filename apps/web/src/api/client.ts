import axios from 'axios';

const API_BASE_URL = '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Run API
export const runApi = {
  create: (data: any) => api.post('/runs', data),
  process: (runId: string, data: any) => api.post(`/runs/${runId}/process`, data),
  get: (runId: string) => api.get(`/runs/${runId}`),
  list: (params: any) => api.get('/runs', { params }),
};

// Task API
export const taskApi = {
  getByRun: (runId: string) => api.get('/tasks', { params: { runId } }),
  update: (taskId: string, data: any) => api.patch(`/tasks/${taskId}`, data),
};

// Upload API
export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Export API
export const exportApi = {
  create: (runId: string, data: any) => api.post(`/runs/${runId}/exports`, data),
  download: (exportId: string) => `${API_BASE_URL}/exports/${exportId}/download`,
};

// Integration API
export const integrationApi = {
  push: (runId: string, data: any) => api.post(`/runs/${runId}/push`, data),
};
