'use client';

import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { EstatusProyecto } from '@/types/proyectos.d';

interface ProjectsPageActionsProps {
  globalFilter: string;
  statusFilter: string | null;
  hasCreatePermission: boolean;
  layout: 'list' | 'grid';
  onGlobalFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string | null) => void;
  onLayoutChange: (layout: 'list' | 'grid') => void;
  onNewProject: () => void;
}

const ProjectsPageActions: React.FC<ProjectsPageActionsProps> = ({
  globalFilter,
  statusFilter,
  hasCreatePermission,
  layout,
  onGlobalFilterChange,
  onStatusFilterChange,
  onLayoutChange,
  onNewProject
}) => {
  // Opciones de estado usando el enum
  const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Borrador', value: EstatusProyecto.BORRADOR },
    { label: 'En Progreso', value: EstatusProyecto.EN_PROGRESO },
    { label: 'Completado', value: EstatusProyecto.COMPLETADO },
    { label: 'Cancelado', value: EstatusProyecto.CANCELADO },
    { label: 'En Revisión', value: EstatusProyecto.EN_REVISION },
    { label: 'Aprobado', value: EstatusProyecto.APROBADO },
    { label: 'Rechazado', value: EstatusProyecto.RECHAZADO }
  ];

  return (
    <div className="card mb-3">
      <div className="flex flex-column md:flex-row justify-content-between align-items-stretch md:align-items-center gap-3">
        <div className="flex flex-column md:flex-row gap-3 align-items-stretch md:align-items-center flex-1">
          {/* Búsqueda global */}
          <div className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(e) => onGlobalFilterChange(e.target.value)}
              placeholder="Buscar proyectos..."
              className="w-full md:w-20rem"
            />
          </div>

          {/* Filtro por estado */}
          <Dropdown
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.value)}
            options={statusOptions}
            placeholder="Filtrar por estado"
            className="w-full md:w-12rem"
            showClear
          />
      </div>

      {/* Botón de nuevo proyecto y controles de vista */}
      <div className="flex gap-2 align-items-center">
        <Button
          icon="pi pi-plus"
          label="Nuevo Proyecto"
          onClick={onNewProject}
          disabled={!hasCreatePermission}
          tooltip={!hasCreatePermission
            ? "No tiene permisos para crear proyectos"
            : undefined}
          tooltipOptions={{ position: 'bottom' }}
        />
      </div>
      </div>
    </div>
  );
};

export default ProjectsPageActions;