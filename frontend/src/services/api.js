import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'https://job-agent-git-master-naitikfefars-projects.vercel.app/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization header to all requests if token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth Services
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);

// Jobs Services
export const getTodayJobs = () => api.get('/jobs/today');
export const searchJobs = () => api.post('/jobs/search');
export const getJobById = (id) => api.get(`/jobs/${id}`);
export const updateJobStatus = (id, status) => api.put(`/jobs/${id}/status`, { status });
export const getJobStats = () => api.get('/jobs/stats');

// Resume Services
export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  return api.post('/resume/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const generateResume = (jobId) => api.get(`/resume/generate/${jobId}`);
export const downloadResume = (jobId) =>
  api.get(`/resume/download/${jobId}`, { responseType: 'blob' });

// Applications Services
export const getApplications = () => api.get('/applications');
export const createApplication = (data) => api.post('/applications', data);
export const updateApplication = (id, data) => api.put(`/applications/${id}`, data);
export const deleteApplication = (id) => api.delete(`/applications/${id}`);
export const getApplicationStats = () => api.get('/applications/stats');

export default api;
