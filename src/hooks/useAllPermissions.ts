
import { CATALOGOS_CONFIG } from '../config/catalogos';
import { useMemo } from 'react';

export function useAllPermissions(user: any) {
  // Llama los hooks en el mismo orden y cantidad siempre
  return useMemo(() => {
    const perms: Record<string, { canRead: boolean; canCreate: boolean; canUpdate: boolean; canDelete: boolean }> = {};
    
     for (const config of CATALOGOS_CONFIG) {
      // Lógica de permisos directa (sin usar otro hook)
      const userPermissions = user?.permissions || [];
      perms[config.key] = {
        canRead: userPermissions.includes(`${config.key}.read`) || user?.role === 'admin',
        canCreate: userPermissions.includes(`${config.key}.create`) || user?.role === 'admin',
        canUpdate: userPermissions.includes(`${config.key}.update`) || user?.role === 'admin',
        canDelete: userPermissions.includes(`${config.key}.delete`) || user?.role === 'admin',
      };
    }
    return perms;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
};