'use client';

import React, { useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tree } from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import type { Rol, Permiso } from '@/types/usuarios';

interface PermissionsViewerProps {
  visible: boolean;
  role?: Rol | null;
  onHide: () => void;
  permissions: Permiso[];
}

const PermissionsViewer: React.FC<PermissionsViewerProps> = ({
  visible,
  role,
  onHide,
  permissions
}) => {
  const permissionsTree = useMemo(() => {
    if (!permissions.length) return [];

    // Crear árbol jerárquico basado en parent_id
    const createPermissionTree = (parentId: number | null = null): TreeNode[] => {
      const children = permissions.filter(p => p.parent_id === parentId);
      
      return children.map(permission => {
        // Validar que role.permissions existe y es array antes de verificar permisos
        const hasPermission = role && Array.isArray(role.permissions) 
          ? role.permissions.includes(permission.name) 
          : false;
        const childNodes = createPermissionTree(permission.id);
        
        return {
          key: permission.id.toString(),
          label: (
            <div className="flex align-items-center justify-content-between w-full">
              <div className="flex align-items-center gap-2">
                <i 
                  className={`pi ${childNodes.length > 0 ? 'pi-folder' : 'pi-shield'}`}
                  style={{ color: hasPermission ? '#10b981' : '#6b7280' }}
                />
                <span className={hasPermission ? 'font-semibold text-green-700' : 'text-color-secondary'}>
                  {permission.title}
                </span>
              </div>
              {hasPermission && (
                <Tag
                  value="✓"
                  severity="success"
                  className="text-xs"
                />
              )}
            </div>
          ) as any,
          children: childNodes.length > 0 ? childNodes : undefined,
          expanded: true
        };
      });
    };

    return createPermissionTree();
  }, [role, permissions]);

  const permissionStats = useMemo(() => {
    if (!role || !permissions.length || !Array.isArray(role.permissions)) return { granted: 0, total: 0 };

    const grantedCount = role.permissions.length;
    const totalCount = permissions.length;

    return { granted: grantedCount, total: totalCount };
  }, [role, permissions]);

  if (!role) return null;

  const dialogHeader = (
    <div className="flex align-items-center gap-3">
      <div 
        className="w-3rem h-3rem border-round flex align-items-center justify-content-center text-white"
        style={{ backgroundColor: '#6366f1' }}
      >
        <i className="pi pi-users text-xl"></i>
      </div>
      <div>
        <h3 className="m-0 text-color">Permisos del Rol</h3>
        <p className="mt-1 mb-0 text-color-secondary">{role.title}</p>
      </div>
    </div>
  );

  const dialogFooter = (
    <Button
      label="Cerrar"
      icon="pi pi-times"
      onClick={onHide}
      className="p-button-text"
      autoFocus
    />
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '800px', maxHeight: '90vh' }}
      header={dialogHeader}
      footer={dialogFooter}
      onHide={onHide}
      modal
      className="p-fluid"
      blockScroll
    >
      {/* Estadísticas */}
      <div className="grid mb-4">
        <div className="col-12 md:col-4">
          <div className="text-center p-3 border-1 border-200 border-round">
            <div className="text-2xl font-bold text-blue-600">
              {permissionStats.granted}
            </div>
            <div className="text-color-secondary">Permisos otorgados</div>
          </div>
        </div>
        <div className="col-12 md:col-4">
          <div className="text-center p-3 border-1 border-200 border-round">
            <div className="text-2xl font-bold text-color">
              {permissionStats.total}
            </div>
            <div className="text-color-secondary">Permisos totales</div>
          </div>
        </div>
        <div className="col-12 md:col-4">
          <div className="text-center p-3 border-1 border-200 border-round">
            <div className="text-2xl font-bold text-green-600">
              {permissionStats.total > 0 ? Math.round((permissionStats.granted / permissionStats.total) * 100) : 0}%
            </div>
            <div className="text-color-secondary">Cobertura</div>
          </div>
        </div>
      </div>

      <Divider />

      {/* Árbol de permisos */}
      <div className="mb-3">
        <h4 className="text-color mb-3 flex align-items-center gap-2">
          <i className="pi pi-sitemap text-lg"></i>
          Estructura de Permisos
        </h4>
        
        {permissionsTree.length > 0 ? (
          <Tree 
            value={permissionsTree}
            className="w-full"
            style={{ 
              border: 'none',
              maxHeight: '400px',
              overflow: 'auto'
            }}
          />
        ) : (
          <div className="text-center p-4">
            <i className="pi pi-info-circle text-6xl text-color-secondary mb-3"></i>
            <p className="text-color-secondary">
              Este rol no tiene permisos asignados
            </p>
          </div>
        )}
      </div>


      {/* Mensaje si no hay permisos */}
      {(!Array.isArray(role.permissions) || role.permissions.length === 0) && (
        <div className="text-center p-4 bg-yellow-50 border-round">
          <i className="pi pi-exclamation-triangle text-3xl text-yellow-600 mb-2"></i>
          <h5 className="text-yellow-800 mb-2">Sin permisos asignados</h5>
          <p className="text-yellow-700 m-0">
            Este rol no tiene permisos específicos. Los usuarios con este rol tendrán acceso limitado al sistema.
          </p>
        </div>
      )}
    </Dialog>
  );
};

export default PermissionsViewer;