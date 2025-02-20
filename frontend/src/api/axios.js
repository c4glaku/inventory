import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    error => {
        console.error('Request Interceptor Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            localStorage.removeItem('token');
            window.location.href = '/login';

            return Promise.reject(error);
        }

        if (error.response) {
            console.error('Response Error:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });

            switch (error.response.status) {
                case 400:
                    console.error('Bad Request:', error.response.data);
                    break;
                case 403:
                    console.error('Forbidden:', error.response.data);
                    break;
                case 404:
                    console.error('Not Found:', error.response.data);
                    break;
                case 500:
                    console.error('Server Error:', error.response.data);                        
                    break;
                default:
                    console.error('Unexpected Error:', error.response.data);
            } 
        } else if (error.request) {
            console.error('No Response Received:', error.request);
        } else {
            console.error('Request Configuration Error', error.message);
        }

        return Promise.reject(error);
    }
);

// Helper methods
export const apiHelpers = {
    // GET request with error handling
    get: async (url, config = {}) => {
        try {
            const response = await api.get(url, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // POST request with error handling
    post: async (url, data = {}, config = {}) => {
        try {
            const response = await api.post(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // PUT request with error handling
    put: async (url, data = {}, config = {}) => {
        try {
            const response = await api.put(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // DELETE request with error handling
    delete: async (url, config = {}) => {
        try {
            const response = await api.delete(url, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default api;