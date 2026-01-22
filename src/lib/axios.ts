import axios from 'axios';
import { formatBearerToken } from '@/src/utils/security';

let authToken: string | null = null;

/**
 * Establece el token de autenticación para las peticiones
 * @param token - Token Sanctum (sin prefijo Bearer)
 */
export const setAuthToken = (token: string | null): void => {
    authToken = token;
};

/**
 * Obtiene el token actual
 * @returns Token actual o null
 */
export const getAuthToken = (): string | null => {
    return authToken;
};

const http = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://sfpi.iepc-chiapas.org.mx',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

http.interceptors.request.use(
    (config) => {
        if (authToken) {
            config.headers.Authorization = formatBearerToken(authToken);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de response: manejo de errores 401
http.interceptors.response.use(
    (response) => response.data,
    (responseError) => {
        // Manejo de errores 401: token inválido o revocado
        if (responseError.response && responseError.response.status === 401) {
            if (window.location.pathname !== '/auth/login') {
                authToken = null;
                window.location.href = '/auth/login';
            }
        }
        return Promise.reject(responseError);
    }
);

export default http;