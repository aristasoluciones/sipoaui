import { useAuth } from '../../layout/context/authContext';

/**
 * Hook personalizado para manejo de permisos
 * Facilita el uso de permisos en los componentes
 */
export const usePermissions = () => {
    const { permissions, userRoles, isSuperAdmin, hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

    return {
        permissions,
        userRoles,
        isSuperAdmin,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        // Helpers específicos para acciones comunes
        canCreate: (resource: string) => hasPermission(`${resource}.create`),
        canUpdate: (resource: string) => hasPermission(`${resource}.edit`),
        canDelete: (resource: string) => hasPermission(`${resource}.delete`),
        canManage: (resource: string) => hasPermission(`${resource}.access`),
        // Helper para verificar múltiples permisos de un recurso
        canAccess: (resource: string, actions: string[]) => {
            const permissionsToCheck = actions.map(action => `${resource}.${action}`);
            return hasAnyPermission(permissionsToCheck);
        }
    };
};
