import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/layout/context/authContext';

interface AuthRouteGuardProps {
    children: React.ReactNode;
}

/**
 * Componente que maneja las rutas de autenticación
 * Redirige usuarios autenticados lejos de páginas de login
 */
export const AuthRouteGuard: React.FC<AuthRouteGuardProps> = ({ children }) => {
    const { isAuthenticated, loading, initialized } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Rutas de autenticación que deben redirigir si el usuario ya está logueado
    const authRoutes = [
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password'
    ];

    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    useEffect(() => {
        // Esperar a que el contexto se inicialice
        if (!initialized || loading) {
            return;
        }

        // Si el usuario está autenticado y está en una ruta de auth, redirigir al dashboard
        if (isAuthenticated && isAuthRoute) {
            console.log('✅ Usuario ya autenticado, redirigiendo al dashboard...');
            router.replace('/');
            return;
        }

    }, [isAuthenticated, loading, initialized, pathname, isAuthRoute, router]);

    return <>{children}</>;
};

export default AuthRouteGuard;
