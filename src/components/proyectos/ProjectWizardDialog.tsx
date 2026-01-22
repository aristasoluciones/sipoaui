'use client';

import React from 'react';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import ProyectoWizard from './ProyectoWizard';
import { Proyecto, ProyectoApi } from '@/types/proyectos';
import { EstatusProyecto, Prioridad } from '@/types/proyectos.d';

interface ProjectWizardDialogProps {
  visible: boolean;
  project: Proyecto | null;
  isCreating: boolean;
  isEjercicioFiscalCerrado: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  onCloseWizard?: () => void;
  onReloadProjects?: () => void;
  onProjectSaved?: (savedProject: ProyectoApi) => void;
  selectedEjercicioFiscal: number | null;
}

const ProjectWizardDialog: React.FC<ProjectWizardDialogProps> = ({
  visible,
  project,
  isCreating,
  isEjercicioFiscalCerrado,
  onCancel,
  onSuccess,
  onCloseWizard,
  onReloadProjects,
  onProjectSaved,
  selectedEjercicioFiscal
}) => {
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

  if (!visible) return null;

  if (isEjercicioFiscalCerrado) {
    // Vista de solo lectura para ejercicios fiscales cerrados
    return (
      <div className="bg-white border border-gray-200 border-round shadow-8 md:shadow-1 dark:bg-gray-800 dark:border-gray-700">
        <div className="p-4">
          <div className="flex align-items-center justify-content-between mb-4">
            <h3 className="text-2xl font-bold text-900 m-0">Vista de Proyecto</h3>
            <Badge value="Solo Lectura" severity="info" />
          </div>
          <div className="grid">
            <div className="col-12 md:col-6">
              <div className="field mb-4">
                <label className="block font-medium text-900 mb-2">Nombre del Proyecto</label>
                <InputText
                  value={project?.nombre || ''}
                  readOnly
                  className="w-full"
                />
              </div>
            </div>
            <div className="col-12 md:col-6">
              <div className="field mb-4">
                <label className="block font-medium text-900 mb-2">Código</label>
                <InputText
                  value={project?.codigo || ''}
                  readOnly
                  className="w-full"
                />
              </div>
            </div>
            <div className="col-12">
              <div className="field mb-4">
                <label className="block font-medium text-900 mb-2">Descripción</label>
                <InputTextarea
                  value={project?.descripcion || ''}
                  readOnly
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="field mb-4">
                <label className="block font-medium text-900 mb-2">Estado</label>
                <Badge
                  value={project?.estatus}
                  severity={getStatusSeverity(project?.estatus || '')}
                />
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="field mb-4">
                <label className="block font-medium text-900 mb-2">Prioridad</label>
                <Badge
                  value={project?.prioridad}
                  severity={getPrioritySeverity(project?.prioridad || '')}
                />
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="field mb-4">
                <label className="block font-medium text-900 mb-2">Presupuesto Total</label>
                <InputText
                  value={`$${(project?.presupuestoTotal || 0).toLocaleString()}`}
                  readOnly
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              label="Cerrar"
              icon="pi pi-times"
              severity="secondary"
              onClick={onCancel}
            />
          </div>
        </div>
      </div>
    );
  }

  // Wizard normal para ejercicios fiscales abiertos
  return (
    <div className="bg-white border border-gray-200 border-round shadow-8 md:shadow-1 dark:bg-gray-800 dark:border-gray-700">
      <ProyectoWizard
        project={project || undefined}
        onCancel={onCancel}
        isCreating={isCreating}
        onSuccess={onSuccess}
        onCloseWizard={onCloseWizard}
        onReloadProjects={onReloadProjects}
        onProjectSaved={onProjectSaved}
        selectedEjercicioFiscal={selectedEjercicioFiscal}
      />
    </div>
  );
};

export default ProjectWizardDialog;