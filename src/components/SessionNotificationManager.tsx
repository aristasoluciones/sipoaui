import React, { useEffect, useState } from 'react';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { useAuth } from '@/layout/context/authContext';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Componente que maneja las notificaciones de sesión
 * Informa al usuario sobre expiraciones de sesión y otros eventos de autenticación
 */
export const SessionNotificationManager: React.FC = () => {
    const toast = useRef<Toast>(null);
    const { isAuthenticated, initialized, user } = useAuth();
    const pathname = usePathname();
    const [lastAuthState, setLastAuthState] = useState<boolean | null>(null);
    const [hasShownWelcome, setHasShownWelcome] = useState(false);

    useEffect(() => {
        if (!initialized) return;

        // Detectar cambios en el estado de autenticación
        if (lastAuthState !== null && lastAuthState !== isAuthenticated) {
            
            // Si cambió de autenticado a no autenticado (sesión expirada)
            if (lastAuthState === true && !isAuthenticated) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Sesión Expirada',
                    detail: 'Tu sesión ha expirado. Serás redirigido al login.',
                    life: 5000,
                    sticky: false
                });
            }
            
            // Si cambió de no autenticado a autenticado (login exitoso)
            if (lastAuthState === false && isAuthenticated && user && !hasShownWelcome) {
                // Pequeño delay para asegurar que la UI esté lista
                setTimeout(() => {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Bienvenido',
                        detail: `Hola ${user.name || 'Usuario'}, has iniciado sesión correctamente.`,
                        life: 4000
                    });
                    setHasShownWelcome(true);
                }, 500);
            }
        }

        setLastAuthState(isAuthenticated);
    }, [isAuthenticated, initialized, lastAuthState, user, hasShownWelcome]);

    // Resetear el flag de bienvenida cuando cambie de página o se desloguee
    useEffect(() => {
        if (!isAuthenticated) {
            setHasShownWelcome(false);
        }
    }, [isAuthenticated, pathname]);

    return (
        <Toast 
            ref={toast} 
            position="top-right"
            className="session-toast"
            style={{ zIndex: 10000 }}
        />
    );
};

export default SessionNotificationManager;
