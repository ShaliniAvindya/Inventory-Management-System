import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://inventory-management-system-server-gamma.vercel.app/api',
    withCredentials: true,
    timeout: 15000,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                try {
                    localStorage.removeItem('current-user');
                    const currentPath = window?.location?.pathname || '';
                    if (currentPath !== '/login') {
                        window.location.href = '/login';
                    }
                } catch (_) {}
            }
        }
        return Promise.reject(error);
    }
);

export default api;
