'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';

// Components
import { PageAccessDenied } from '@/src/components/AccessDeneid';

// Hooks and Components
import {
  useProjectsManagement,
  ProjectFilters,
  EjercicioFiscalSelector,
  ProjectList
} from '@/src/components/proyectos';
import { Proyecto } from '@/types/proyectos';

// Hooks
import { usePermissions } from '@/src/hooks/usePermissions';

const ProjectsPage: React.FC = () => {
  const router = useRouter();
  const { hasAnyPermission } = usePermissions();

  // Estado local para el layout
  const [layout, setLayout] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);

  const {
    // Estado
    displayedProjects,
    loading,
    loadingMore,
    saving,
    hasMore,

    // Filtros y búsqueda
    globalFilter,
    statusFilter,
    etapaFilter,
    selectedEjercicioFiscal,

    // Ejercicios fiscales
    ejerciciosFiscales,
    ejerciciosFiscalesLoading,

    // Acciones
    loadProjects,
    loadMoreProjects,
    setGlobalFilter,
    setStatusFilter,
    setEtapaFilter,
    changeSelectedEjercicioFiscal,

    // Utilities
    isEjercicioFiscalCerrado,
    permiteCapturaProyectos,
    getSelectedEjercicioFiscal
  } = useProjectsManagement();

  // Memoizar el cálculo de isEjercicioFiscalAbierto para evitar re-ejecuciones innecesarias
  const isEjercicioFiscalAbierto = useMemo(() => {
    const ejercicio = getSelectedEjercicioFiscal();
    return ejercicio ? permiteCapturaProyectos(ejercicio) : false;
  }, [selectedEjercicioFiscal, getSelectedEjercicioFiscal, permiteCapturaProyectos]);

  // Modificar handleProjectSelect para navegar a la ruta dinámica
  const handleProjectClick = (project: Proyecto) => {
    router.push(`/proyectos/${project.uuid}`);
  };

  // Modificar handleNewProject para navegar a /proyectos/nuevo
  const handleCreateNewProject = () => {
    router.push(`/proyectos/nuevo?ejercicio=${selectedEjercicioFiscal}`);
  };

  // Breadcrumb
  const breadcrumbItems = [
    { label: 'Inicio', url: '/' },
    { label: 'Proyectos' }
  ];

  const breadcrumbHome = { icon: 'pi pi-home', url: '/' };

  if (!hasAnyPermission(['cartera_de_proyectos.proyectos', 'cartera_de_proyectos.proyectos.access'])) {
    return <PageAccessDenied />;
  }

  return (
    <>
      <div className="grid">
        <div className="col-12">
          <BreadCrumb
            model={breadcrumbItems}
            home={breadcrumbHome}
            className="mb-2"
          />
        </div>
      </div>

      {/* Mostrar estado de carga o zero state si no hay ejercicios fiscales */}
      {ejerciciosFiscalesLoading ? (
        <div className="grid">
          <div className="col-12">
            <div className="card">
              <div className="flex flex-column align-items-center justify-content-center p-8 text-center">
                <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="4"/>
                <h3 className="text-xl font-semibold text-900 mt-4 mb-2">Cargando ejercicios fiscales...</h3>
                <p className="text-600 m-0">Por favor espere mientras se cargan los ejercicios fiscales disponibles</p>
              </div>
            </div>
          </div>
        </div>
      ) : ejerciciosFiscales.length === 0 ? (
        <div className="grid">
          <div className="col-12">
            <div className="card">
              <div className="flex flex-column align-items-center justify-content-center p-8 text-center">
                <i className="pi pi-calendar-times text-6xl text-400 mb-4"></i>
                <h3 className="text-xl font-semibold text-900 mb-2">No hay ejercicios fiscales disponibles</h3>
                <p className="text-600 mb-4" style={{maxWidth: '30rem'}}>
                  Actualmente no hay ejercicios fiscales configurados en el sistema. 
                  Para crear proyectos, es necesario que un administrador configure al menos un ejercicio fiscal.
                </p>
                <div className="flex gap-2">
                <Button 
                  label="Contactar administrador" 
                  icon="pi pi-envelope" 
                  severity="secondary"
                  outlined
                  onClick={() => {
                    // TODO: Implementar contacto con administrador
                    window.open('mailto:admin@sipoa.gob.mx?subject=Solicitud de apertura de ejercicio fiscal', '_blank');
                  }}
                />
                <Button 
                  label="Refrescar" 
                  icon="pi pi-refresh" 
                  onClick={() => window.location.reload()}
                />
              </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header con selector de ejercicio fiscal */}
          <div className="grid">
            <div className="col-12">
              <EjercicioFiscalSelector
                selectedEjercicioFiscal={selectedEjercicioFiscal}
                ejerciciosFiscales={ejerciciosFiscales}
                onEjercicioFiscalChange={changeSelectedEjercicioFiscal}
                showBanner={true}
                totalProjects={displayedProjects.length}
              />
            </div>
          </div>

          {/* Toolbar con acciones - solo si showFilters */}
          {showFilters && (
            <div className="grid">
              <div className="col-12">
                <ProjectFilters
                  globalFilter={globalFilter}
                  statusFilter={statusFilter}
                  etapaFilter={etapaFilter}
                  layout={layout}
                  onGlobalFilterChange={setGlobalFilter}
                  onStatusFilterChange={setStatusFilter}
                  onEtapaFilterChange={setEtapaFilter}
                  onLayoutChange={setLayout}
                />
              </div>
            </div>
          )}

          {/* Contenido principal - Lista de proyectos */}
          <div className="grid">
            <div className="col-12">
              <ProjectList
                displayedProjects={displayedProjects}
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                layout={layout}
                onProjectSelect={handleProjectClick}
                onLoadMore={loadMoreProjects}
                onLayoutChange={setLayout}
                hasCreatePermission={hasAnyPermission(['cartera_de_proyectos.proyectos.create'])}
                isEjercicioFiscalAbierto={isEjercicioFiscalAbierto}
                onNewProject={handleCreateNewProject}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ProjectsPage;
