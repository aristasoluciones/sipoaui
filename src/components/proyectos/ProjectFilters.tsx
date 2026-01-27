'use client';

import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { EstatusProyecto, EtapaProyectoEnum } from '@/types/proyectos.d';
import { PROYECTO_STAGES } from '@/src/config/proyectos';

interface ProjectFiltersProps {
  globalFilter: string;
  statusFilter: string | null;
  etapaFilter: string | null;
  layout: 'list' | 'grid';
  onGlobalFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string | null) => void;
  onEtapaFilterChange: (value: string | null) => void;
  onLayoutChange: (layout: 'list' | 'grid') => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  globalFilter,
  statusFilter,
  etapaFilter,
  layout,
  onGlobalFilterChange,
  onStatusFilterChange,
  onEtapaFilterChange,
  onLayoutChange
}) => {
  // Opciones de estado usando el enum
  const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'En captura', value: EstatusProyecto.CAPTURA },
    { label: 'En revisión', value: EstatusProyecto.EN_REVISION },
    { label: 'Observado', value: EstatusProyecto.OBSERVADO },
    { label: 'Aprobado', value: EstatusProyecto.APROBADO },
    { label: 'Cancelado', value: EstatusProyecto.CANCELADO }
  ];

  // Opciones de etapa usando la configuración
  const etapaOptions = [
    { label: 'Todas', value: null },
    ...PROYECTO_STAGES.map(stage => ({
      label: stage.title,
      value: stage.etapaEnum
    }))
  ];

  return (
    <div className="card mb-3">
      <div className="grid">
        <div className="col-12 lg:col-4">
          <div className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(e) => onGlobalFilterChange(e.target.value)}
              placeholder="Buscar proyectos..."
              className="w-full"
            />
          </div>
        </div>

        <div className="col-12 md:col-6 lg:col-4">
          <Dropdown
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.value)}
            options={statusOptions}
            placeholder="Filtrar por estado"
            className="w-full"
            showClear
          />
        </div>

        <div className="col-12 md:col-6 lg:col-4">
          <Dropdown
            value={etapaFilter}
            onChange={(e) => onEtapaFilterChange(e.value)}
            options={etapaOptions}
            placeholder="Filtrar por etapa"
            className="w-full"
            showClear
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectFilters;