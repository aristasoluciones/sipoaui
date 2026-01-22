import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/layout/context/authContext';

interface SessionGuardProps {
    children: React.ReactNode;
}

/**
 * Componente que protege la aplicación validando la sesión del usuario
 * Redirige automáticamente a login si no está autenticado
 */
export const SessionGuard: React.FC<SessionGuardProps> = ({ children }) => {
    const { isAuthenticated, loading, initialized, user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [showLoadingScreen, setShowLoadingScreen] = useState(true);

    // Rutas que no requieren autenticación
    const publicRoutes = useMemo(() => [
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/landing',
        '/pages/notfound',
        '/pages/error',
        '/pages/access'
    ], []);

    // Verificar si la ruta actual es pública (memoizado)
    const isPublicRoute = useMemo(() => {
        return publicRoutes.some(route => pathname.startsWith(route));
    }, [pathname, publicRoutes]);

    // Handler para redirección (memoizado)
    const handleRedirectToLogin = useCallback(() => {
        console.log('🔒 Usuario no autenticado, redirigiendo a login...');
        
        // Guardar la ruta actual para redirigir después del login
        const currentPath = pathname !== '/' ? pathname : '';
        if (currentPath) {
            sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
        
        router.replace('/auth/login');
    }, [pathname, router]);

    // Efecto principal con dependencias optimizadas
    useEffect(() => {
        // Esperar a que el contexto de auth se inicialice
        if (!initialized) {
            return;
        }

        setIsCheckingAuth(false);

        // Si estamos en una ruta pública, no validar autenticación
        if (isPublicRoute) {
            setShowLoadingScreen(false);
            return;
        }

        // Si no está cargando y no está autenticado, redirigir a login
        if (!loading && !isAuthenticated) {
            handleRedirectToLogin();
            return;
        }

        // Si está autenticado, ocultar pantalla de carga
        if (isAuthenticated && user?.id) {
            setShowLoadingScreen(false);
        }

    }, [
        isAuthenticated, 
        loading, 
        initialized, 
        isPublicRoute, 
        handleRedirectToLogin,
        user?.id // Solo el ID del usuario, no el objeto completo
    ]);

    // Mostrar loading mientras se verifica la autenticación
    if (showLoadingScreen && (isCheckingAuth || (!isPublicRoute && (loading || !isAuthenticated)))) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen bg-gray-50">
                <div className="flex flex-column align-items-center gap-4 p-6 bg-white border-round-xl shadow-3" style={{ minWidth: '300px' }}>
                    <div className="flex align-items-center justify-content-center w-6rem h-6rem bg-primary-50 border-circle">
                        <i className="pi pi-spin pi-spinner text-primary text-4xl"></i>
                    </div>
                    <div className="text-center">
                        <h4 className="text-900 font-bold m-0 mb-2">Verificando sesión</h4>
                        <p className="text-600 text-sm m-0 line-height-3">
                            Estamos validando tu acceso al sistema...
                        </p>
                    </div>
                    <div className="w-full">
                        <div className="bg-primary-50 border-round-lg p-2">
                            <div 
                                className="bg-primary-500 border-round h-0.5rem transition-all transition-duration-300"
                                style={{ 
                                    width: initialized ? '100%' : '30%',
                                    transition: 'width 0.5s ease-in-out'
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Si es ruta pública o está autenticado, mostrar contenido
    return <>{children}</>;
};

export default SessionGuard;
