'use client';

import React from 'react';
import { DataView } from 'primereact/dataview';
import { DataViewLayoutOptions } from 'primereact/dataview';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { ProgressBar } from 'primereact/progressbar';
import type { Proyecto } from '@/types/proyectos.d';
import { EstatusProyecto, Prioridad, EtapaProyectoEnum } from '@/types/proyectos.d';
import ZeroStateProjects from './ZeroStateProjects';

interface ProjectListProps {
  displayedProjects: Proyecto[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  layout: 'grid' | 'list';
  onProjectSelect: (project: Proyecto) => void;
  onLoadMore: () => void;
  onLayoutChange: (layout: 'grid' | 'list') => void;
  hasCreatePermission: boolean;
  isEjercicioFiscalAbierto: boolean;
  onNewProject: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  displayedProjects,
  loading,
  loadingMore,
  hasMore,
  layout,
  onProjectSelect,
  onLoadMore,
  onLayoutChange,
  hasCreatePermission,
  isEjercicioFiscalAbierto,
  onNewProject
}) => {
  // Función para truncar texto
  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Calcular progreso total
  // Por el momento, cada etapa suma 25% si esta guardada en el storage.
  // Evalua si esta completada del 1-4 etapa y suma su porcentaje.
  // En el futuro, esto debe venir del backend.
  const getOverallProgress = (project: Proyecto) => {
    const storedData = sessionStorage.getItem(`proyecto_etapas_${project.uuid}`);
    if (storedData) {
      const etapas = JSON.parse(storedData);
      // la estructura de etapas es { 1:{ ...muchosdatos }, 2:{ ...muchosdatos }, ... }, asi que solo
      // evalua si existe unicamente la llave 1 significa que la etapa 1 esta guardada.
      // Cada etapa vale 25%
      let total = 0;
      if (etapas['1']) total += 25;
      if (etapas['2']) total += 25;
      if (etapas['3']) total += 25;
      if (etapas['4']) total += 25;
      return Math.min(total, 100);
    }
    return 0;
  };

  // Obtener color del estado
  const getStatusSeverity = (estado: string) => {
    switch (estado) {
      case EstatusProyecto.COMPLETADO: return 'success';
      case EstatusProyecto.EN_PROGRESO: return 'info';
      case EstatusProyecto.EN_REVISION: return 'warning';
      case EstatusProyecto.CANCELADO: return 'danger';
      case EstatusProyecto.RECHAZADO: return 'danger';
      case EstatusProyecto.APROBADO: return 'success';
      case EstatusProyecto.BORRADOR: return null;
      default: return null;
    }
  };

  // Obtener color de prioridad
  const getPrioritySeverity = (prioridad: string) => {
    switch (prioridad) {
      case Prioridad.ALTA: return 'danger';
      case Prioridad.CRITICA: return 'danger';
      case Prioridad.MEDIA: return 'warning';
      case Prioridad.BAJA: return 'success';
      default: return 'info';
    }
  };

  // Obtener color de etapa
  const getStageSeverity = (etapa: EtapaProyectoEnum) => {
    switch (etapa) {
      case EtapaProyectoEnum.DIAGNOSTICO_PROBLEMA: return 'info';
      case EtapaProyectoEnum.PROGRAMA_OPERATIVO_ANUAL: return 'warning';
      case EtapaProyectoEnum.ESTIMACION_BENEFICIARIOS: return 'success';
      case EtapaProyectoEnum.FORMULACION_CUANTITATIVA: return 'danger';
      default: return 'info';
    }
  };

  // Template de proyecto para DataView
  const itemTemplate = (project: Proyecto) => {
    const overallProgress = getOverallProgress(project);

    if (layout === 'grid') {
      return (
        <div className="col-12 sm:col-6 md:col-4 p-2">
          <Card
            className="cursor-pointer transition-duration-200 hover:shadow-3"
            style={{ height: '100%' }}
            onClick={() => onProjectSelect(project)}
          >
            <div className="flex flex-column" style={{ height: '100%' }}>
              {/* Header con código y estado */}
              <div className="flex justify-content-between align-items-start mb-3">
                <div className="flex-1">
                  <h6 className="text-base font-semibold text-900 m-0 mb-1">{project.nombre}</h6>
                  <small className="text-600">{project.codigo}</small>
                </div>
                <div className="flex flex-column gap-1 align-items-end">
                  <div className="flex gap-1">
                    <Badge
                      value={(project.prioridad || 'media').toUpperCase()}
                      severity={getPrioritySeverity(project.prioridad || 'media')}
                    />
                    <Badge
                      value={project.estatus}
                      severity={getStatusSeverity(project.estatus)}
                    />
                  </div>
                </div>
              </div>

              {/* Etapa Actual */}
              <div className="mb-3">
                <small className="text-600 block mb-1">Etapa Actual</small>
                <Badge 
                  value={project.etapaActual} 
                  severity={getStageSeverity(project.etapaActual)}
                  style={{ display: 'block', textAlign: 'center' }}
                />
              </div>

              {/* Descripción */}
              <p className="text-600 line-height-3 flex-1 m-0 mb-3">
                {truncateText(project.descripcion || '', 120)}
              </p>

              {/* Unidad */}
              <div className="mb-3">
                <small className="text-600 block mb-1">Unidad Responsable</small>
                <Badge value={project.unidad.nombre} severity="info" />
              </div>
              <div className="mb-3">
                <div className="flex justify-content-between align-items-center mb-2">
                  <small className="text-600">Progreso</small>
                  <small className="text-900 font-semibold">{overallProgress}%</small>
                </div>
                <ProgressBar value={overallProgress} style={{height: '0.5rem'}} />
              </div>

              {/* Footer con responsable y presupuesto */}
              <div className="flex justify-content-between align-items-end">
                <div>
                  <small className="text-600 block">Responsable</small>
                  <span className="text-sm font-medium">{project.responsable.nombre}</span>
                </div>
                <div className="text-right">
                  <small className="text-600 block">Presupuesto</small>
                  <span className="text-sm font-medium">
                    ${(project.presupuestoTotal || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    } else {
      return (
        <div className="col-12 p-2">
          <Card
            className="cursor-pointer transition-duration-200 hover:shadow-3"
            onClick={() => onProjectSelect(project)}
          >
            <div className="flex flex-column gap-3">
              {/* Información principal */}
              <div className="flex-1">
                <div className="flex flex-column md:flex-row justify-content-between align-items-start gap-3 mb-3">
                  <div className="flex-1">
                    <h5 className="text-lg font-semibold text-900 m-0 mb-1">{project.nombre}</h5>
                    <small className="text-600">{project.codigo}</small>
                  </div>
                  
                  {/* Etapa, Prioridad y Estatus */}
                  <div className="flex gap-2 flex-wrap">
                    <div className="flex flex-column align-items-center gap-1">
                      <span className="text-xs text-600">Etapa Actual</span>
                      <Badge
                        value={project.etapaActual}
                        severity={getStageSeverity(project.etapaActual)}
                      />
                    </div>
                    <div className="flex flex-column align-items-center gap-1">
                        <span className="text-xs text-600">Prioridad</span>
                        <Badge
                          value={project.prioridad}
                          severity={getPrioritySeverity(project.prioridad)}
                        />
                    </div>
                    <div className="flex flex-column align-items-center gap-1">
                      <span className="text-xs text-600">Estatus</span>
                      <Badge
                          value={project.estatus}
                          severity={getStatusSeverity(project.estatus)}
                        />
                    </div>
                  </div>
                </div>
                
                <p className="text-600 line-height-3 m-0 mb-3">{truncateText(project.descripcion || '', 150)}</p>
                
                {/* Progreso y responsable - Grid responsivo */}
                <div className="grid">
                  <div className="col-12 md:col-6 lg:col-3">
                    <div className="flex flex-column gap-1">
                      <span className="text-xs text-600">Progreso</span>
                      <div className="flex align-items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{overallProgress}%</span>
                      </div>
                      <ProgressBar value={overallProgress} style={{height: '0.5rem'}} />
                    </div>
                  </div>

                  <div className="col-12 md:col-6 lg:col-3">
                    <div className="flex flex-column gap-1">
                      <span className="text-xs text-600">Unidad Responsable</span>
                      <Badge value={project.unidad.nombre} severity="info" />
                    </div>
                  </div>

                  <div className="col-12 md:col-6 lg:col-3">
                    <div className="flex flex-column gap-1">
                      <span className="text-xs text-600">Responsable</span>
                      <span className="text-sm font-medium">{project.responsable.nombre}</span>
                    </div>
                  </div>

                  <div className="col-12 md:col-6 lg:col-3">
                    <div className="flex flex-column gap-1">
                      <span className="text-xs text-600">Presupuesto</span>
                      <span className="text-sm font-medium">
                        ${(project.presupuestoTotal || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex align-items-center justify-content-center p-8">
          <i className="pi pi-spin pi-spinner text-4xl text-blue-500 mr-3"></i>
          <span className="text-xl text-600">Cargando proyectos...</span>
        </div>
      </div>
    );
  }

  // Mostrar zero state si no hay proyectos
  if (!loading && displayedProjects.length === 0) {
    return (
      <ZeroStateProjects
          hasCreatePermission={hasCreatePermission}
          isEjercicioFiscalAbierto={isEjercicioFiscalAbierto}
          onNewProject={onNewProject}
        />
    );
  }

  // Header del DataView con controles de layout
  const header = (
    <div className="flex justify-content-between align-items-center">
      <h5 className="m-0">Proyectos</h5>
      <DataViewLayoutOptions 
        layout={layout} 
        onChange={(e) => onLayoutChange(e.value as 'grid' | 'list')} 
      />
    </div>
  );

  return (
    <div className="card p-0 overflow-hidden">
      <DataView
        value={displayedProjects}
        itemTemplate={itemTemplate}
        layout={layout}
        header={header}
        paginator
        rows={12}
        emptyMessage="No se encontraron proyectos"
      />
    </div>
  );
};

export default ProjectList;