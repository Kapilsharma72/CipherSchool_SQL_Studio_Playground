export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http:
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/me',
  },
  LEARNING_ASSISTANT: {
    GET_HINT: '/v1/learning-assistant',
  },
  ASSIGNMENTS: {
    GET_ALL: '/v1/assignments',
    GET_ONE: (id) => `/v1/assignments/${id}`,
    SAVE_PROGRESS: (id) => `/v1/assignments/${id}/progress`,
    GET_PROGRESS: (id) => `/v1/assignments/${id}/progress`,
  },
  QUERY: {
    EXECUTE: '/v1/query/execute',
    VALIDATE: '/v1/query/validate',
  },
};

export const apiRequest = async (endpoint, method = 'GET', data = null, token = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`[API] ${method} ${url}`, { data });
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

    const authToken = token || localStorage.getItem('token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config = {
    method,
    headers,
    credentials: 'include',
    mode: 'cors',
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    
        const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      try {
        responseData = text ? JSON.parse(text) : {};
      } catch (e) {
        responseData = { message: text };
      }
    }

        console.log(`[API] ${method} ${url} - Status: ${response.status}`, responseData);

    if (!response.ok) {
            let errorMessage = 'Something went wrong';
      
      if (responseData.message) {
        errorMessage = responseData.message;
      } else if (responseData.error) {
        if (typeof responseData.error === 'string') {
          errorMessage = responseData.error;
        } else if (responseData.error.message) {
          errorMessage = responseData.error.message;
        }
      } else if (responseData.status === 'error' && responseData.message) {
        errorMessage = responseData.message;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = responseData;
      throw error;
    }

    return responseData;
  } catch (error) {
    console.error(`[API] Error in ${method} ${url}:`, error);
    
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      error.message = 'Unable to connect to the server. Please check your internet connection.';
    }
    
        
    throw error;
  }
};
