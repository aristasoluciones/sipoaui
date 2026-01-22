'use client';

import React from 'react';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import {
  useRolesManagement,
  RolesPageActions,
  RoleDataTable,
  RoleFormDialog,
  PermissionsViewer,
  DeleteRoleConfirm
} from '@/src/components/roles';

// Components
import { PermissionGuard } from '@/src/components/PermissionGuard';
import { AccessDenied } from '@/src/components/AccessDeneid';

const RolesPage: React.FC = () => {
  const {
    // Estado
    roles,
    permissions,
    loading,
    saving,
    
    // Dialog state
    roleDialogVisible,
    deleteDialogVisible,
    permissionsViewerVisible,
    
    // Selected items
    selectedRole,
    roleToDelete,
    roleToViewPermissions,
    
    // Dialog actions
    showCreateRoleDialog,
    showEditRoleDialog,
    showDeleteDialog,
    showPermissionsViewer,
    hideAllDialogs,
    
    // CRUD operations
    handleSaveRole,
    handleDeleteRole,
    
    // Utilities
    refreshData
  } = useRolesManagement();

  const home = { icon: 'pi pi-home', command: () => window.location.href = '/' };
  const breadcrumbItems = [
    { label: 'Inicio', command: () => window.location.href = '/' },
    { 
      label: 'Roles y Usuarios', 
      command: () => window.location.href = '/roles',
      className: 'text-primary font-medium'
    },
    { 
      label: "Roles",
      className: 'font-bold text-900'
     },
  ];

  return (
    <PermissionGuard 
      resource="roles_y_usuarios.roles" 
      action="access"
      fallback={<AccessDenied variant='detailed' showContact message="No tienes acceso a esta modulo"/>}
    >
      <div className="grid">
      <div className="col-12">
        <BreadCrumb model={breadcrumbItems} home={home} className="mb-4" />
      </div>
      
      {/* Título y descripción del módulo */}
      <div className="col-12">
        <div className="card mb-3">
          <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
            <div className="flex align-items-center gap-3">
              <div className="flex align-items-center justify-content-center bg-blue-100 border-round"
                   style={{ width: '3rem', height: '3rem' }}>
                <i className="pi pi-key text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-900 m-0">Gestión de Roles</h2>
                <p className="text-600 m-0 mt-1">Administra los roles y permisos del sistema para controlar el acceso a las diferentes funcionalidades</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                label="Nuevo Rol"
                icon="pi pi-plus"
                onClick={showCreateRoleDialog}
                disabled={loading}
                tooltip="Crear un nuevo rol"
                tooltipOptions={{ position: 'top' }}
              />
              <Button
                icon="pi pi-refresh"
                onClick={refreshData}
                loading={loading}
                tooltip="Actualizar listado"
                severity="info"
                tooltipOptions={{ position: 'top' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-12">
        <div className="card p-0 overflow-hidden">
          {/* Tabla de datos */}
          <RoleDataTable
            roles={roles}
            loading={loading}
            onEdit={showEditRoleDialog}
            onDelete={showDeleteDialog}
            onViewPermissions={showPermissionsViewer}
          />
        </div>
      </div>

      {/* Dialog de formulario de rol */}
      <RoleFormDialog
        visible={roleDialogVisible}
        role={selectedRole}
        onHide={hideAllDialogs}
        onSave={handleSaveRole}
        loading={saving}
        permissions={permissions}
      />

      {/* Visor de permisos */}
      <PermissionsViewer
        visible={permissionsViewerVisible}
        role={roleToViewPermissions}
        onHide={hideAllDialogs}
        permissions={permissions}
      />

      {/* Confirmación de eliminación */}
      <DeleteRoleConfirm
        visible={deleteDialogVisible}
        role={roleToDelete}
        onHide={hideAllDialogs}
        onConfirm={handleDeleteRole}
        loading={saving}
      />
    </div>
    </PermissionGuard>
  );
};

export default RolesPage;