import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

console.log('API URL configured:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Response:`, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => {
    // Ensure data is a plain object
    const payload = {
      username: data.username,
      email: data.email,
      password: data.password
    };
    return api.post('/auth/register', payload);
  },
  login: (data) => {
    const payload = {
      email: data.email,
      password: data.password
    };
    return api.post('/auth/login', payload);
  },
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data)
};

// User API
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  searchUsers: (query) => api.get('/users/search', { params: { q: query } }),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvatar: (formData) => api.put('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStatus: (status) => api.put('/users/status', { status }),
  getOnlineUsers: () => api.get('/users/online'),
  blockUser: (id) => api.post(`/users/${id}/block`),
  unblockUser: (id) => api.delete(`/users/${id}/block`)
};

// Conversation API
export const conversationAPI = {
  getConversations: () => api.get('/conversations'),
  getConversation: (id) => api.get(`/conversations/${id}`),
  createPrivate: (userId) => api.post('/conversations/private', { userId }),
  createGroup: (data) => api.post('/conversations/group', data),
  updateGroup: (id, data) => api.put(`/conversations/${id}/group`, data),
  addParticipant: (id, userId) => api.post(`/conversations/${id}/participants`, { userId }),
  removeParticipant: (id, userId) => api.delete(`/conversations/${id}/participants/${userId}`),
  leaveGroup: (id) => api.post(`/conversations/${id}/leave`),
  markAsRead: (id) => api.put(`/conversations/${id}/read`),
  deleteConversation: (id) => api.delete(`/conversations/${id}`)
};

// Message API
export const messageAPI = {
  getMessages: (conversationId, params) => api.get(`/messages/${conversationId}`, { params }),
  sendMessage: (data) => api.post('/messages', data),
  editMessage: (id, content) => api.put(`/messages/${id}`, { content }),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
  addReaction: (id, emoji) => api.post(`/messages/${id}/reactions`, { emoji }),
  removeReaction: (id) => api.delete(`/messages/${id}/reactions`),
  votePoll: (id, optionId) => api.post(`/messages/${id}/poll/vote`, { optionId }),
  removeVote: (id) => api.delete(`/messages/${id}/poll/vote`),
  searchMessages: (params) => api.get('/messages/search', { params })
};

// Upload API
export const uploadAPI = {
  uploadFiles: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadSingle: (formData) => api.post('/upload/single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAttachment: (id) => api.delete(`/upload/${id}`)
};

// Chatbot API
export const chatbotAPI = {
  sendMessage: (message) => api.post('/chatbot/message', { message }),
  getHistory: () => api.get('/chatbot/history'),
  clearHistory: () => api.delete('/chatbot/history')
};
export const pollAPI = {
  vote: (id, optionId) =>
    api.post(`/messages/${id}/poll/vote`, { optionId })
};

export default api;