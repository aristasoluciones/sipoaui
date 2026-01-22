import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/layout/context/authContext';

/**
 * Hook que maneja la redirección después del login
 * Redirige al usuario a la página que intentaba acceder antes de ser enviado al login
 */
export const usePostLoginRedirect = () => {
    const { isAuthenticated, user, initialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!initialized || !isAuthenticated || !user) {
            return;
        }

        // Obtener la ruta guardada antes del login
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        
        if (redirectPath) {
            // Limpiar la ruta guardada
            sessionStorage.removeItem('redirectAfterLogin');
            
            // Redirigir a la página original
            console.log('🔄 Redirigiendo a:', redirectPath);
            router.replace(redirectPath);
        } else {
            // Si no hay ruta guardada, ir al dashboard
            console.log('🏠 Redirigiendo al dashboard');
            router.replace('/');
        }
    }, [isAuthenticated, user, initialized, router]);
};

export default usePostLoginRedirect;
