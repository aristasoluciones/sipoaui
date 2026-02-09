'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { PageAccessDenied } from '@/src/components/AccessDeneid';
import { usePermissions } from '@/src/hooks/usePermissions';
import ProyectoWizard from '@/src/components/proyectos/ProyectoWizard';
import { ProyectoApi, Proyecto } from '@/types/proyectos';
import { toCamelCase } from '@/src/utils/transformers';
import { CatalogoService } from '@/src/services/catalogos.service';
import { useNotification } from '@/layout/context/notificationContext';

const NewProjectPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAnyPermission } = usePermissions();
  const { error: showError } = useNotification();

  // Estados para catálogos
  const [unidades, setUnidades] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [tiposProyecto, setTiposProyecto] = useState<any[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // Obtener el ejercicio fiscal de los query params
  const ejercicioFiscal = searchParams?.get('ejercicio') 
    ? parseInt(searchParams.get('ejercicio')!) 
    : new Date().getFullYear();

  // Cargar catálogos una sola vez al montar el componente
  useEffect(() => {
    const loadCatalogos = async () => {
      setLoadingCatalogos(true);
      try {
        // Cargar unidades desde catálogo
        const unidadesService = new CatalogoService('unidades');
        const unidadesData = await unidadesService.getAll();
        setUnidades(Array.isArray(unidadesData) ? unidadesData : []);

        // Usar mocks para empleados y tipos de proyecto (igual que en los stages)
        setEmpleados([
          { id: 1, nombre: 'Juan Pérez García' },
          { id: 2, nombre: 'María González López' },
          { id: 3, nombre: 'Carlos Rodríguez Martínez' },
          { id: 4, nombre: 'Ana Sánchez Hernández' },
          { id: 5, nombre: 'Luis Fernández Díaz' },
          { id: 6, nombre: 'Carmen Jiménez Ruiz' },
          { id: 7, nombre: 'Miguel Álvarez Moreno' },
          { id: 8, nombre: 'Isabel Romero Navarro' },
          { id: 9, nombre: 'David Torres Ortega' },
          { id: 10, nombre: 'Laura Ramírez Delgado' }
        ]);

        setTiposProyecto([
          { id: 1, nombre: 'Ordinario' },
          { id: 2, nombre: 'Extraordinario' }
        ]);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
        showError('Error al cargar datos', 'No se pudieron cargar los catálogos. Intente recargar la página.');
      } finally {
        setLoadingCatalogos(false);
      }
    };

    loadCatalogos();
  }, [showError]);

  // Breadcrumb
  const breadcrumbItems = [
    { label: 'Inicio', url: '/' },
    { label: 'Proyectos', url: '/proyectos' },
    { label: 'Nuevo Proyecto' }
  ];

  const breadcrumbHome = { icon: 'pi pi-home', url: '/' };

  if (!hasAnyPermission(['cartera_de_proyectos.proyectos', 'cartera_de_proyectos.proyectos.create'])) {
    return <PageAccessDenied />;
  }

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

      {/* Toolbar del proyecto */}
      <div className="grid">
        <div className="col-12">
          <div className="flex justify-content-between align-items-center p-4 border-1 surface-border border-round-lg bg-white mb-4">
            <div>
              <h2 className="text-2xl font-bold text-900 m-0">
                Nuevo Proyecto
              </h2>
              <p className="text-600 m-0 mt-1">
                Complete todas las etapas requeridas para enviar a revisión
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                label="Regresar al listado"
                icon="pi pi-arrow-left"
                severity="secondary"
                outlined
                onClick={() => router.push('/proyectos')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="col-12">
          <ProyectoWizard
            project={undefined}
            isCreating={true}
            onCancel={() => router.push('/proyectos')}
            onSuccess={() => {}}
            onCloseWizard={() => router.push('/proyectos')}
            onReloadProjects={() => {}}
            onProjectSaved={(savedProjectApi: ProyectoApi) => {
              // Navegar al proyecto recién creado
              const savedProject = toCamelCase(savedProjectApi) as Proyecto;
              router.push(`/proyectos/${savedProject.uuid}`);
            }}
            selectedEjercicioFiscal={ejercicioFiscal}
            unidades={unidades}
            empleados={empleados}
            tiposProyecto={tiposProyecto}
          />
        </div>
      </div>
    </>
  );
};

export default NewProjectPage;
