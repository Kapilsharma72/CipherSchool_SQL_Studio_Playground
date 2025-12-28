import { apiRequest, API_ENDPOINTS } from '../config/api';

export const authService = {
  login: async (credentials) => {
    return apiRequest(API_ENDPOINTS.AUTH.LOGIN, 'POST', credentials);
  },
  register: async (userData) => {
    return apiRequest(API_ENDPOINTS.AUTH.REGISTER, 'POST', userData);
  },
  getProfile: async (token) => {
    return apiRequest(API_ENDPOINTS.AUTH.PROFILE, 'GET', null, token);
  },
};

export const learningAssistantService = {
  getHint: async (data, token) => {
    return apiRequest(
      API_ENDPOINTS.LEARNING_ASSISTANT.GET_HINT, 
      'POST', 
      data, 
      token
    );
  },
};

export const assignmentService = {
  getAll: async (token) => {
    return apiRequest(API_ENDPOINTS.ASSIGNMENTS.GET_ALL, 'GET', null, token);
  },
  getOne: async (id, token) => {
    return apiRequest(API_ENDPOINTS.ASSIGNMENTS.GET_ONE(id), 'GET', null, token);
  },
  saveProgress: async (id, data, token) => {
    return apiRequest(API_ENDPOINTS.ASSIGNMENTS.SAVE_PROGRESS(id), 'POST', data, token);
  },
  getProgress: async (id, token) => {
    return apiRequest(API_ENDPOINTS.ASSIGNMENTS.GET_PROGRESS(id), 'GET', null, token);
  },
};

export const queryService = {
  execute: async (data, token) => {
    return apiRequest(API_ENDPOINTS.QUERY.EXECUTE, 'POST', data, token);
  },
  validate: async (data, token) => {
    return apiRequest(API_ENDPOINTS.QUERY.VALIDATE, 'POST', data, token);
  },
};

export default {
  auth: authService,
  learningAssistant: learningAssistantService,
  assignment: assignmentService,
  query: queryService,
};
