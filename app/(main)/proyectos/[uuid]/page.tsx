'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { PageAccessDenied } from '@/src/components/AccessDeneid';
import { usePermissions } from '@/src/hooks/usePermissions';
import ProyectoWizard from '@/src/components/proyectos/ProyectoWizard';
import { ProyectoService } from '@/src/services/proyecto';
import { Proyecto, ProyectoApi } from '@/types/proyectos';
import { toCamelCase } from '@/src/utils/transformers';
import { proyectoInformacionGeneralSchema } from '@/src/schemas/proyecto.schemas';

const ProjectDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const uuid = params?.uuid as string;
  const { hasAnyPermission } = usePermissions();

  const [project, setProject] = useState<Proyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const lastLoadedUuidRef = React.useRef<string | null>(null);

  // Cargar proyecto
  const loadProject = async () => {
    lastLoadedUuidRef.current = uuid;
    setLoading(true);
    try {
      const projectApi = await ProyectoService.getProyecto(uuid);
      const projectData = toCamelCase(projectApi) as Proyecto;
      setProject(projectData);
      setNotFound(false);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para recargar el proyecto
  const reloadProject = async () => {
    if (uuid) {
      await loadProject();
    }
  };

  // Cargar proyecto al montar
  useEffect(() => {
    // Evitar múltiples cargas (por ejemplo React Strict Mode en desarrollo)
    if (!uuid) return;
    if (lastLoadedUuidRef.current === uuid) return;

    loadProject();

    // Si el usuario navega a otro uuid, permitimos recargar para el nuevo uuid
    return () => {
      // No resetear inmediatamente para evitar dobles llamadas en Strict Mode;
      // solo limpiar si el componente se desmonta totalmente.
      // lastLoadedUuidRef.current = null;
    };
  }, [uuid]);

  // Breadcrumb
  const breadcrumbItems = [
    { label: 'Inicio', url: '/' },
    { label: 'Proyectos', url: '/proyectos' },
    { label: project?.nombre || 'Cargando...' }
  ];

  const breadcrumbHome = { icon: 'pi pi-home', url: '/' };

  if (!hasAnyPermission(['cartera_de_proyectos.proyectos', 'cartera_de_proyectos.proyectos.access'])) {
    return <PageAccessDenied />;
  }

  // Estado de carga
  if (loading) {
    return (
      <>
        <div className="grid">
          <div className="col-12">
            <BreadCrumb
              model={breadcrumbItems}
              home={breadcrumbHome}
              className="mb-4"
            />
          </div>
        </div>
        <div className="grid">
          <div className="col-12">
            <div className="flex flex-column align-items-center justify-content-center p-8 text-center">
              <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
              <h3 className="text-xl font-semibold text-900 mt-4 mb-2">Cargando proyecto...</h3>
              <p className="text-600 m-0">Por favor espere mientras se carga la información del proyecto.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Proyecto no encontrado
  if (notFound || !project) {
    return (
      <>
        <div className="grid">
          <div className="col-12">
            <BreadCrumb
              model={[
                { label: 'Inicio', url: '/' },
                { label: 'Proyectos', url: '/proyectos' },
                { label: 'No encontrado' }
              ]}
              home={breadcrumbHome}
              className="mb-4"
            />
          </div>
        </div>
        <div className="grid">
          <div className="col-12">
            <div className="flex flex-column align-items-center justify-content-center p-8 text-center border-2 border-dashed border-300 border-round-lg">
              <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-4"></i>
              <h3 className="text-xl font-semibold text-900 mb-2">Proyecto no encontrado</h3>
              <p className="text-600 mb-4 max-w-30rem">
                El proyecto que estás buscando no existe o ha sido eliminado. 
                Verifica el enlace o regresa al listado de proyectos.
              </p>
              <div className="flex gap-2">
                <Button 
                  label="Volver al listado" 
                  icon="pi pi-arrow-left" 
                  onClick={() => router.push('/proyectos')}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Mostrar wizard del proyecto
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

      {/* Toolbar del proyecto */}
      <div className="grid">
        <div className="col-12">
          <div className="p-3 border-1 surface-border border-round-lg bg-white mb-2">
            <div className="flex justify-content-between align-items-start mb-3">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-900 m-0">
                  Proyecto: {project.nombre}
                </h2>
                <p className="text-sm text-600 m-0 mt-1">
                  {project.descripcion || 'Sin descripción disponible'}
                </p>
              </div>

              <div className="ml-3">
                <Button
                  label="Regresar al listado"
                  icon="pi pi-arrow-left"
                  severity="secondary"
                  outlined
                  onClick={() => router.push('/proyectos')}
                  className="h-3rem"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="col-12">
          <ProyectoWizard
            project={project}
            isCreating={false}
            onCancel={() => router.push('/proyectos')}
            onSuccess={() => {}}
            onCloseWizard={() => router.push('/proyectos')}
            onReloadProjects={() => {}}
            onProjectSaved={(savedProjectApi: ProyectoApi) => {
              const savedProject = toCamelCase(savedProjectApi) as Proyecto;
              setProject(savedProject);
            }}
            onProjectReload={reloadProject}
            selectedEjercicioFiscal={project.ejercicioId}
          />
        </div>
      </div>
    </>
  );
};

export default ProjectDetailPage;
