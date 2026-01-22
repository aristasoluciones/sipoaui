'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Toast } from 'primereact/toast';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/layout/context/authContext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useNotification } from '@/layout/context/notificationContext';

/**
 * Componente unificado que maneja:
 * - Protección de rutas (SessionGuard)
 * - Notificaciones de sesión (SessionNotificationManager)
 */
export const SessionManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const toast = useRef<Toast>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { success, info, warning } = useNotification();
    
    const { isAuthenticated, initialized, user, logout } = useAuth();
    
    const [lastAuthState, setLastAuthState] = useState<boolean | null>(null);
    const [hasShownWelcome, setHasShownWelcome] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

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
     // 🛠️ TODO verificar por que no guarda la ruta actual cuando no esta autenticado
    const handleRedirectToLogin = useCallback(() => {
        // Guardar la ruta actual para redirigir después del login
        const currentPath = pathname;
        if (currentPath && !currentPath.startsWith('/auth/login')) {
            sessionStorage.setItem('redirectAfterLogin', currentPath);
        }       
        router.replace('/auth/login');
    }, [pathname,router]);

    // Efecto para manejar cambios de autenticación y notificaciones
    useEffect(() => {
        if (!initialized) return;

        // Detectar cambios en el estado de autenticación
        if (lastAuthState !== null && lastAuthState !== isAuthenticated) {
            
            // Si cambió de autenticado a no autenticado (sesión expirada)
            if (lastAuthState === true && !isAuthenticated) {
                warning('¡Sesión Expirada!', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', { life: 3000 });
                // Redirigir después de mostrar la notificación
                setTimeout(() => {
                    handleRedirectToLogin();
                }, 500);
            }
            
            // Si cambió de no autenticado a autenticado (login exitoso)
            if (lastAuthState === false && isAuthenticated && user && !hasShownWelcome) {
                setTimeout(() => {
                    success('¡Bienvenido!', `Hola ${user.name || 'Usuario'}, has iniciado sesión correctamente.`, { life: 4000 });
                    setHasShownWelcome(true);
                }, 500);
            }
        }

        setLastAuthState(isAuthenticated);
    }, [isAuthenticated, initialized, lastAuthState, user, hasShownWelcome, router]);

    // Efecto para protección de rutas
    useEffect(() => {
        if (!initialized) return;

        // Si estamos en una ruta privada y no estamos autenticados
        if (!isPublicRoute && !isAuthenticated && !isRedirecting) {
            setIsRedirecting(true);
            info('Acceso Requerido', '🔒 Debes iniciar sesión para acceder a esta página.', { life: 3000 });
            // Redirigir al login
            setTimeout(() => {
                handleRedirectToLogin();
            }, 500);
        }
        
        // Si estamos en login y ya estamos autenticados, redirigir al dashboard
        if (pathname === '/auth/login' && isAuthenticated && !isRedirecting) {
            const redirectPath = sessionStorage.getItem('redirectAfterLogin');
            if (redirectPath) {
                sessionStorage.removeItem('redirectAfterLogin');
                router.push(redirectPath);
                return;
            }
            router.push('/');
        }
        
    }, [isAuthenticated, initialized, pathname, isPublicRoute, router, isRedirecting]);

    // Resetear flags cuando cambie la ruta o se desloguee
    useEffect(() => {
        if (!isAuthenticated) {
            setHasShownWelcome(false);
            setIsRedirecting(false);
        }
    }, [isAuthenticated, pathname]);

    // Mostrar loading mientras se inicializa la autenticación
    if (!initialized) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen">
                <ProgressSpinner />
            </div>
        );
    }

    // Si estamos redirigiendo, mostrar loading
    if (isRedirecting) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen">
                <ProgressSpinner />
                <span className="ml-2">Redirigiendo...</span>
            </div>
        );
    }

    // Si no está autenticado y está en ruta privada, no renderizar children
    if (!isPublicRoute && !isAuthenticated) {
        return null;
    }

    return (
        <>
         {children}
        </>
    );
};

export default SessionManager;