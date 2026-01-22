'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BreadCrumb } from 'primereact/breadcrumb';
import { PageAccessDenied } from '@/src/components/AccessDeneid';
import { usePermissions } from '@/src/hooks/usePermissions';
import { ProjectWizardDialog } from '@/src/components/proyectos';
import { ProyectoApi, Proyecto } from '@/types/proyectos';
import { toCamelCase } from '@/src/utils/transformers';

const NewProjectPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAnyPermission } = usePermissions();

  // Obtener el ejercicio fiscal de los query params
  const ejercicioFiscal = searchParams?.get('ejercicio') 
    ? parseInt(searchParams.get('ejercicio')!) 
    : new Date().getFullYear();

  // Breadcrumb
  const breadcrumbItems = [
    { label: 'Inicio', url: '/' },
    { label: 'Proyectos', url: '/proyectos' },
    { label: 'Nuevo Proyecto' }
  ];

  const breadcrumbHome = { icon: 'pi pi-home', url: '/' };

  if (!hasAnyPermission(['cartera_de_proyectos.proyectos.create'])) {
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

      <div className="grid">
        <div className="col-12">
          <ProjectWizardDialog
            visible={true}
            project={null}
            isCreating={true}
            isEjercicioFiscalCerrado={false}
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
          />
        </div>
      </div>
    </>
  );
};

export default NewProjectPage;
