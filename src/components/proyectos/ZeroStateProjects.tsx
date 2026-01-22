'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

interface ZeroStateProjectsProps {
  hasCreatePermission: boolean;
  isEjercicioFiscalAbierto: boolean;
  onNewProject: () => void;
}

const ZeroStateProjects: React.FC<ZeroStateProjectsProps> = ({
  hasCreatePermission,
  isEjercicioFiscalAbierto,
  onNewProject
}) => {
  const canCreateProject = hasCreatePermission && isEjercicioFiscalAbierto;

  return (
    <div className="card">
      <div className="flex flex-column align-items-center justify-content-center p-8 text-center">
        {/* Icono */}
        <div className="flex align-items-center justify-content-center bg-blue-100 border-round mb-4"
             style={{width: '4rem', height: '4rem'}}>
          <i className="pi pi-folder-open text-4xl text-blue-500"></i>
        </div>

        {/* Título y mensaje */}
        <div className="flex flex-column gap-2">
          <h3 className="text-xl font-semibold text-900 m-0 mb-2">
            No hay proyectos registrados
          </h3>
          <p className="text-600 m-0 mb-4">
              {canCreateProject
                ? "Comienza creando tu primer proyecto para organizar y gestionar los recursos de tu unidad."
                : "No tienes permisos para crear proyectos o el ejercicio fiscal está cerrado."
              }
            </p>
          </div>

        {/* Botón de acción */}
        {canCreateProject && (
          <Button
            icon="pi pi-plus"
            label="Crear Primer Proyecto"
            onClick={onNewProject}
            size="large"
          />
        )}

        {/* Información adicional */}
        {!canCreateProject && (
          <div className="flex flex-column gap-2 mt-3">
              {!hasCreatePermission && (
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-lock"></i>
                  <span>Necesitas permisos de creación</span>
                </div>
              )}
              {!isEjercicioFiscalAbierto && (
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-calendar-times"></i>
                  <span>Ejercicio fiscal cerrado</span>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ZeroStateProjects;