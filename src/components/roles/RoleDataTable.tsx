'use client';

import React, { useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import type { Rol } from '@/types/usuarios';

interface RoleDataTableProps {
  roles: Rol[];
  loading?: boolean;
  onEdit: (role: Rol) => void;
  onDelete: (role: Rol) => void;
  onViewPermissions: (role: Rol) => void;
}

const RoleDataTable: React.FC<RoleDataTableProps> = ({
  roles,
  loading = false,
  onEdit,
  onDelete,
  onViewPermissions
}) => {
  // Memoizar datos para optimizar rendimiento
  const sortedRoles = useMemo(() => {
    return roles?.sort((a, b) => a.title.localeCompare(b.title)) || [];
  }, [roles]);

  const nameBodyTemplate = (role: Rol) => (
    <div className="flex align-items-center gap-2">
      <div>
        <div className="font-medium">{role.title}</div>
      </div>
    </div>
  );

  const permissionsBodyTemplate = (role: Rol) => (
    <div className="flex align-items-center gap-2">
      <Badge 
        value={role.permissions?.length} 
        severity={role.permissions?.length > 0 ? 'info' : 'warning'}
      />
      <Button
        icon="pi pi-eye"
        text
        size="small"
        tooltip="Ver permisos"
        tooltipOptions={{ position: 'top' }}
        onClick={() => onViewPermissions(role)}
        disabled={role.permissions?.length === 0}
      />
    </div>
  );

  const dateBodyTemplate = (role: Rol) => {
    if (!role.created_at) return '-';
    const fecha = new Date(role.created_at);
    return (
      <div className="text-color-secondary">
        <div>{fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' })}</div>
        <small>{fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</small>
      </div>
    );
  };

  const actionsBodyTemplate = (role: Rol) => (
    <div className="flex gap-1">
      <Button
        icon="pi pi-pencil"
        rounded
        text
        size="small"
        tooltip="Editar rol"
        tooltipOptions={{ position: 'top' }}
        onClick={() => onEdit(role)}
      />
      {/* <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-sm p-button-danger"
        tooltip="Eliminar rol"
        tooltipOptions={{ position: 'top' }}
        onClick={() => onDelete(role)}
      /> */}
    </div>
  );


  return (
    <DataTable
      value={sortedRoles}
      loading={loading}
      paginator
      rows={10}
      rowsPerPageOptions={[5, 10, 25, 50]}
      responsiveLayout="scroll"
      emptyMessage="No se encontraron roles"
      dataKey="id"
    >
      <Column
        field="title"
        header="Nombre"
        body={nameBodyTemplate}
        sortable
        style={{ minWidth: '200px' }}
      />
      
      <Column
        field="permissions"
        header="Permisos"
        body={permissionsBodyTemplate}
        style={{ minWidth: '120px' }}
      />
      
      <Column
        field="created_at"
        header="Fecha de creación"
        body={dateBodyTemplate}
        sortable
        style={{ minWidth: '160px' }}
      />
      
      <Column
        body={actionsBodyTemplate}
        header="Acciones"
        style={{ minWidth: '140px' }}
        frozen
        alignFrozen="right"
      />
    </DataTable>
  );
};

export default RoleDataTable;