import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log("API URL:", import.meta.env.VITE_API_URL);

// Add Authorization header to all requests if token exists
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.debug(
        'api interceptor: attaching Authorization header, token length=',
        token.length,
        'origin=',
        window.location.origin
      );
    } else {
      console.debug(
        'api interceptor: no token found in storage for origin=',
        window.location.origin
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Services
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/profile', data);
export const getXpProfile = () => api.get('/auth/xp');
export const awardXp = (payload) => api.post('/auth/xp/award', payload);

// Jobs Services
export const getTodayJobs = () => api.get('/jobs/today');
export const searchJobs = () => api.post('/jobs/search');
export const getJobById = (id) => api.get(`/jobs/${id}`);
export const updateJobStatus = (id, status) =>
  api.put(`/jobs/${id}/status`, { status });

export const getJobStats = () => api.get('/jobs/stats');
export const getSkillGapAnalysis = () => api.get('/jobs/skill-gap');
export const toggleBookmark = (id) =>
  api.put(`/jobs/${id}/bookmark`);

export const getBookmarkedJobs = () =>
  api.get('/jobs/bookmarked');

export const getInterviewPrep = (jobId) =>
  api.get(`/jobs/${jobId}/interview-prep`);

export const saveInterviewAnswer = (data) =>
  api.post('/jobs/interview-answers', data);

// Subscription Services
export const getPlans = () => api.get('/subscription/plans');

export const createOrder = (plan) =>
  api.post('/subscription/create-order', { plan });

export const verifyPayment = (data) =>
  api.post('/subscription/verify-payment', data);

export const getMySubscription = () =>
  api.get('/subscription/my-subscription');

export const cancelSubscription = () =>
  api.post('/subscription/cancel');

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

export const generateResume = (jobId) =>
  api.get(`/resume/generate/${jobId}`);

export const scoreResume = (data) =>
  api.post('/resume/score', data);

export const downloadResume = (jobId) =>
  api.get(`/resume/download/${jobId}`, {
    responseType: 'blob',
  });

// Applications Services
export const getApplications = () =>
  api.get('/applications');

export const createApplication = (data) =>
  api.post('/applications', data);

export const updateApplication = (id, data) =>
  api.put(`/applications/${id}`, data);

export const deleteApplication = (id) =>
  api.delete(`/applications/${id}`);

export const getApplicationStats = () =>
  api.get('/applications/stats');

// Career Growth Services
export const getCareerDashboard = () =>
  api.get('/career/dashboard');

export const recordCareerActivity = (
  type,
  metadata = {}
) =>
  api.post('/career/activity', {
    type,
    metadata,
  });

export default api;