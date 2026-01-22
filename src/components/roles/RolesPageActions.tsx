'use client';

import React from 'react';
import { Button } from 'primereact/button';

interface RolesPageActionsProps {
  onCreateNew: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

const RolesPageActions: React.FC<RolesPageActionsProps> = ({
  onCreateNew,
  onRefresh,
  loading = false
}) => {
  return (
    <div className="flex justify-content-between align-items-center gap-3 mb-4">
      <Button
        label="Nuevo Rol"
        icon="pi pi-plus"
        severity="success"
        onClick={onCreateNew}
        disabled={loading}
      />
      <Button
        icon="pi pi-refresh"
        onClick={onRefresh}
        loading={loading}
        tooltip="Actualizar"
        tooltipOptions={{ position: 'top' }}
      />
    </div>
  );
};

export default RolesPageActions;