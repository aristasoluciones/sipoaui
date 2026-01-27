'use client';

import React, { useState, useEffect } from 'react';
import { DataView } from 'primereact/dataview';
import { DataViewLayoutOptions } from 'primereact/dataview';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import type { Proyecto } from '@/types/proyectos.d';
import { EstatusProyecto, Prioridad, EtapaProyectoEnum } from '@/types/proyectos.d';
import { PROYECTO_STAGES, mapEtapaEnumToStageId, getStageById } from '@/src/config/proyectos';
import { EstatusEtapa } from '@/types/proyectos.d';
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
  showFilters?: boolean;
  onToggleFilters?: () => void;
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
  onNewProject,
  showFilters = false,
  onToggleFilters
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  // Función para truncar texto
  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Calcular progreso total basado en etapas completadas y aprobadas
  const getOverallProgress = (project: Proyecto) => {
    if (!project.etapasCompletadas || !Array.isArray(project.etapasCompletadas)) {
      return 0;
    }

    // Contar etapas aprobadas
    const etapasAprobadas = project.etapasCompletadas.filter(
      etapa => etapa.estatus === EstatusEtapa.APROBADO
    ).length;

    // Calcular porcentaje basado en el total de etapas definidas
    const totalEtapas = PROYECTO_STAGES.length;
    const progreso = totalEtapas > 0 ? (etapasAprobadas / totalEtapas) * 100 : 0;

    return Math.round(progreso);
  };

  // Obtener color del estado
  const getStatusSeverity = (estado: string) => {
    switch (estado) {
      case EstatusProyecto.APROBADO: return 'success';
      case EstatusProyecto.CAPTURA: return 'info';
      case EstatusProyecto.EN_REVISION: return 'warning';
      case EstatusProyecto.OBSERVADO: return 'warning';
      case EstatusProyecto.CANCELADO: return 'danger';
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

  // Obtener color de etapa usando la configuración centralizada
  const getStageSeverity = (etapa: EtapaProyectoEnum) => {
    const stageId = mapEtapaEnumToStageId(etapa);
    const stage = getStageById(stageId);
    
    if (!stage) return 'info';
    
    // Mapear colores de la configuración a severidades de PrimeReact
    const colorToSeverity: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      'blue': 'info',
      'orange': 'warning',
      'purple': 'info', // Changed from 'secondary' to 'info'
      'green': 'success',
      'teal': 'info'   // Changed from 'secondary' to 'info'
    };
    
    return colorToSeverity[stage.color] || 'info';
  };

  // Obtener etiqueta de etapa usando la configuración centralizada
  const getStageLabel = (etapa: EtapaProyectoEnum) => {
    const stageId = mapEtapaEnumToStageId(etapa);
    const stage = getStageById(stageId);
    return stage?.title || etapa;
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
                  value={getStageLabel(project.etapaActual)} 
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
                <ProgressBar value={overallProgress} showValue={false} style={{height: '.65rem'}} />
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
            <div className="grid">
              {/* Primera columna: Título, código y descripción */}
              <div className="col-12 md:col-6">
                <div className="flex flex-column gap-3">
                  {/* Información principal */}
                  <div>
                    <h5 className="text-lg font-semibold text-900 m-0 mb-1">{project.nombre}</h5>
                    <small className="text-600">{project.codigo}</small>
                  </div>
                  
                  <p className="text-600 line-height-3 m-0">{truncateText(project.descripcion || '', 200)}</p>
                </div>
              </div>

              {/* Segunda columna: Etapa, Prioridad, Estatus, Progreso, Unidad, Responsable, Presupuesto */}
              <div className="col-12 md:col-6">
                <div className="flex flex-column gap-3">
                  {/* Etapa, Prioridad, Estatus y Presupuesto en la misma fila */}
                  <div className="flex justify-content-between align-items-start gap-3">
                    <div className="flex gap-2 flex-wrap">
                      <div className="flex flex-column align-items-start gap-1">
                        <span className="text-xs text-600">Etapa Actual</span>
                        <Badge
                          value={getStageLabel(project.etapaActual)}
                          severity={getStageSeverity(project.etapaActual)}
                        />
                      </div>
                      <div className="flex flex-column align-items-start gap-1">
                          <span className="text-xs text-600">Prioridad</span>
                          <Badge
                            value={project.prioridad}
                            severity={getPrioritySeverity(project.prioridad)}
                          />
                      </div>
                      <div className="flex flex-column align-items-start gap-1">
                        <span className="text-xs text-600">Estatus</span>
                        <Badge
                            value={project.estatus}
                            severity={getStatusSeverity(project.estatus)}
                          />
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-xs text-600 block">Presupuesto</span>
                      <span className="text-sm font-medium">
                        ${(project.presupuestoTotal || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="flex flex-column gap-1">
                    <div className="flex justify-content-between align-items-center">
                      <span className="text-xs text-600">Progreso</span>
                      <span className="text-sm font-semibold">{overallProgress}%</span>
                    </div>
                    <ProgressBar value={overallProgress} showValue={false} style={{height: '0.65rem'}} />
                  </div>

                  {/* Unidad Responsable y Responsable en la misma fila */}
                  <div className="flex justify-content-between align-items-end gap-3">
                    <div className="flex-1">
                      <span className="text-xs text-600 block">Unidad Responsable</span>
                      <Badge value={project.unidad.nombre} severity="info" className="mt-1" />
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-600 block">Responsable</span>
                      <span className="text-sm font-medium mt-1 block">{project.responsable.nombre}</span>
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
      <div className="flex gap-2 align-items-center">
        {onToggleFilters && (
          <Button
            label={isMobile ? "" : (showFilters ? "Ocultar filtros" : "Mostrar filtros")}
            icon={showFilters ? "pi pi-filter-slash" : "pi pi-filter"}
            size="small"
            onClick={onToggleFilters}
            className="p-button-text"
            tooltip={showFilters ? "Ocultar filtros de búsqueda" : "Mostrar filtros de búsqueda"}
            tooltipOptions={{ position: 'bottom' }}
          />
        )}
        {hasCreatePermission && isEjercicioFiscalAbierto && (
          <Button
            label={isMobile ? "" : "Nuevo Proyecto"}
            icon="pi pi-plus"
            size="small"
            onClick={onNewProject}
            tooltip="Crear un nuevo proyecto"
            tooltipOptions={{ position: 'bottom' }}
          />
        )}
        <DataViewLayoutOptions 
          layout={layout} 
          onChange={(e) => onLayoutChange(e.value as 'grid' | 'list')} 
        />
      </div>
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