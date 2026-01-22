import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGuardProps {
    children: React.ReactNode;
    permission?: string;
    permissions?: string[];
    resource?: string;
    action?: string;
    requireAll?: boolean;
    fallback?: React.ReactNode;
}

/**
 * Componente para renderizado condicional basado en permisos
 * 
 * @param children - Contenido a renderizar si se tienen los permisos
 * @param permission - Permiso específico requerido
 * @param permissions - Array de permisos (por defecto requiere cualquiera)
 * @param resource - Recurso (ej: 'users', 'roles')
 * @param action - Acción (ej: 'create', 'update', 'delete')
 * @param requireAll - Si es true, requiere todos los permisos. Si es false, requiere cualquiera
 * @param fallback - Componente a renderizar si no se tienen los permisos
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    permission,
    permissions,
    resource,
    action,
    requireAll = false,
    fallback = null
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin } = usePermissions();

    let hasAccess = false;

    // Superadmin siempre tiene acceso
    if (isSuperAdmin) {
        hasAccess = true;
    } else if (permission) {
        // Verificar un permiso específico
        hasAccess = hasPermission(permission);
    } else if (resource && action) {
        // Verificar permiso usando resource.action
        hasAccess = hasPermission(`${resource}.${action}`);
    } else if (permissions && permissions.length > 0) {
        // Verificar array de permisos
        hasAccess = requireAll 
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);
    }

    return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGuard;
