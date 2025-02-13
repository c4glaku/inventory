import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Response interceptor
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            console.error('Response Error:', error.response.data);
        } else if (error.request) {
            console.error('Request Error:', error.request);
        } else {
            console.error('Error', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;