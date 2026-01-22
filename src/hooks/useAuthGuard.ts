import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import http from '../lib/axios';

/**
 * Hook para validar autenticación en páginas protegidas
 * Ahora usa tokens Bearer en lugar de cookies de sesión
 */
export function useAuthGuard() {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            try {
                // Validar token con el backend
                await http.get(`/api/auth/profile`);
                // Si el token es válido, no hace nada
            } catch (error) {
                // Si el token es inválido o no existe, redirige al login
                router.replace('/auth/login');
            }
        };
        checkSession();
    }, [router]);
}