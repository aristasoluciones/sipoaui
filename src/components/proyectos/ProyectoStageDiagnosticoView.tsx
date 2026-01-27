'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { Chip } from 'primereact/chip';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useProjectOperations } from '@/src/hooks/useProjectOperations';
import { DiagnosticoApi, Proyecto, EstatusEtapa } from '@/types/proyectos.d';
import ObservacionDialog from './ObservacionDialog';

interface ProyectoStageDiagnosticoViewProps {
  visible: boolean;
  onHide: () => void;
  project: Proyecto;
  onProjectReload?: () => void;
}

const ProyectoStageDiagnosticoView: React.FC<ProyectoStageDiagnosticoViewProps> = ({
  visible,
  onHide,
  project,
  onProjectReload
}) => {
  const [diagnosticoData, setDiagnosticoData] = useState<DiagnosticoApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [showObservacionDialog, setShowObservacionDialog] = useState(false);
  const hasLoadedData = useRef(false);

  const { handleGetDiagnostico, handleAprobar, handleObservar } = useProjectOperations({
    isCreating: false,
    selectedProject: project,
    onSuccess: () => {
      onProjectReload?.(); // Recargar el proyecto
      onHide(); // Cierra el sidebar después de la acción
    },
    showSuccessMessages: true
  });

  useEffect(() => {
    if (visible && project?.uuid && !hasLoadedData.current) {
      loadDiagnostico();
      hasLoadedData.current = true;
    }

    if (!visible) {
      hasLoadedData.current = false;
    }
  }, [visible, project?.uuid]);

  const loadDiagnostico = async () => {
    setLoading(true);
    try {
      const data = await handleGetDiagnostico(project.uuid);
      if (data) {
        // Convertir DiagnosticoData a DiagnosticoApi (mapeo de campos)
        const apiData: DiagnosticoApi = {
          diagnostico: data.diagnostico,
          efectos: data.efectos,
          fines: data.fines,
          poblacion_afectada: data.poblacionAfectada,
          poblacion_objetivo: data.poblacionObjetivo,
          descripcion_problema: data.descripcionProblema,
          descripcion_resultado_esperado: data.descripcionResultadoEsperado,
          magnitud_linea_base: data.magnitudLineaBase,
          magnitud_resultado_esperado: data.magnitudResultadoEsperado,
          causas: data.causas || [],
          medios: data.medios || []
        };
        setDiagnosticoData(apiData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAprobarEtapa = async () => {
    try {
      await handleAprobar(project.uuid);
      onHide(); // Cerrar el sidebar después de aprobar
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  const handleObservarEtapa = async (observacion: string) => {
    try {
      await handleObservar(project.uuid, observacion);
      setShowObservacionDialog(false);
      onHide(); // Cerrar el sidebar después de observar
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  // Verificar si la etapa está en revisión
  const isEnRevision = project?.estatusEtapaActual === EstatusEtapa.EN_REVISION;

  const renderField = (label: string, value: string | undefined) => {
    return (
      <div className="mb-3">
        <label className="block text-900 font-semibold text-sm mb-1">{label}</label>
        <div className="p-2 surface-100 border-round">
          <p className="m-0 text-700 text-sm line-height-3">{value || 'No especificado'}</p>
        </div>
      </div>
    );
  };

  const renderCompactField = (label: string, value: string | undefined) => {
    return (
      <div className="flex flex-column">
        <label className="text-600 font-medium text-xs mb-1">{label}</label>
        <span className="text-900 text-sm">{value || 'No especificado'}</span>
      </div>
    );
  };

  const renderListField = (label: string, items: string[] | undefined) => {
    if (!items || items.length === 0) {
      return (
        <div className="mb-3">
          <label className="block text-900 font-semibold text-sm mb-1">{label}</label>
          <div className="p-2 surface-100 border-round">
            <p className="m-0 text-500 text-sm">No hay elementos</p>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-3">
        <label className="block text-900 font-semibold text-sm mb-1">{label}</label>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Chip key={index} label={item} className="text-xs" />
          ))}
        </div>
      </div>
    );
  };

  const renderHeader = () => {
    return (
      <div className="flex align-items-center justify-content-between">
        <div>
          <h5 className="m-0 mb-1">Diagnóstico del Problema</h5>
          <p className="m-0 text-600 text-sm">Vista de solo lectura - Etapa aprobada</p>
        </div>
      </div>
    );
  };

  return (
    <Sidebar
      visible={visible}
      onHide={onHide}
      position="right"
      className="p-sidebar-lg w-full lg:w-8"
      header={renderHeader}
      dismissable
    >
      <div className="flex flex-column h-full">
        {loading ? (
          <div className="flex flex-column align-items-center justify-content-center p-8">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
            <p className="mt-3 text-600">Cargando información del diagnóstico...</p>
          </div>
        ) : diagnosticoData ? (
          <div className="flex-1 overflow-y-auto px-2">
            {/* Grid de 2 columnas para información principal */}
            <div className="grid">
              {/* Columna izquierda */}
              <div className="col-12 lg:col-6">
                <div className="surface-card border-1 surface-border border-round p-3 mb-3 h-full">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-exclamation-triangle text-orange-500"></i>
                    <h6 className="m-0 text-900 font-semibold">Problema Principal</h6>
                  </div>
                  {renderField('Descripción', diagnosticoData.diagnostico)}
                </div>
              </div>

              {/* Columna derecha */}
              <div className="col-12 lg:col-6">
                <div className="surface-card border-1 surface-border border-round p-3 mb-3 h-full">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-users text-blue-500"></i>
                    <h6 className="m-0 text-900 font-semibold">Población</h6>
                  </div>
                  {renderField('Población Afectada', diagnosticoData.poblacion_afectada)}
                  {renderField('Población Objetivo', diagnosticoData.poblacion_objetivo)}
                </div>
              </div>
            </div>

            {/* Grid de 2 columnas para efectos y fines */}
            <div className="grid">
              <div className="col-12 lg:col-6">
                <div className="surface-card border-1 surface-border border-round p-3 mb-3 h-full">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-arrow-down text-red-500"></i>
                    <h6 className="m-0 text-900 font-semibold">Efectos</h6>
                  </div>
                  {renderField('Consecuencias', diagnosticoData.efectos)}
                </div>
              </div>

              <div className="col-12 lg:col-6">
                <div className="surface-card border-1 surface-border border-round p-3 mb-3 h-full">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-flag text-green-500"></i>
                    <h6 className="m-0 text-900 font-semibold">Fines</h6>
                  </div>
                  {renderField('Objetivos', diagnosticoData.fines)}
                </div>
              </div>
            </div>

            {/* Grid de 2 columnas para descripciones */}
            <div className="grid">
              <div className="col-12 lg:col-6">
                <div className="surface-card border-1 surface-border border-round p-3 mb-3 h-full">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-file-edit text-indigo-500"></i>
                    <h6 className="m-0 text-900 font-semibold">Descripción Detallada</h6>
                  </div>
                  {renderField('Problema', diagnosticoData.descripcion_problema)}
                  {renderField('Resultado Esperado', diagnosticoData.descripcion_resultado_esperado)}
                </div>
              </div>

              <div className="col-12 lg:col-6">
                <div className="surface-card border-1 surface-border border-round p-3 mb-3 h-full">
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className="pi pi-chart-line text-cyan-500"></i>
                    <h6 className="m-0 text-900 font-semibold">Magnitudes</h6>
                  </div>
                  <div className="grid">
                    <div className="col-12">
                      {renderCompactField('Línea Base', diagnosticoData.magnitud_linea_base)}
                    </div>
                    <div className="col-12 mt-2">
                      {renderCompactField('Resultado Esperado', diagnosticoData.magnitud_resultado_esperado)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Causas y Medios en una fila */}
            <div className="grid">
              {diagnosticoData.causas && diagnosticoData.causas.length > 0 && (
                <div className="col-12 lg:col-6">
                  <div className="surface-card border-1 surface-border border-round p-3 mb-3 h-full">
                    <div className="flex align-items-center gap-2 mb-2">
                      <i className="pi pi-sitemap text-purple-500"></i>
                      <h6 className="m-0 text-900 font-semibold">Causas Identificadas</h6>
                    </div>
                    {renderListField('', diagnosticoData.causas)}
                  </div>
                </div>
              )}

              {diagnosticoData.medios && diagnosticoData.medios.length > 0 && (
                <div className="col-12 lg:col-6">
                  <div className="surface-card border-1 surface-border border-round p-3 mb-3 h-full">
                    <div className="flex align-items-center gap-2 mb-2">
                      <i className="pi pi-arrows-h text-teal-500"></i>
                      <h6 className="m-0 text-900 font-semibold">Medios</h6>
                    </div>
                    {renderListField('', diagnosticoData.medios)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-column align-items-center justify-content-center p-8 text-center">
            <i className="pi pi-inbox text-400" style={{ fontSize: '3rem' }}></i>
            <h4 className="mt-3 mb-2">No hay información disponible</h4>
            <p className="text-600 m-0">No se encontró información del diagnóstico para este proyecto.</p>
          </div>
        )}

        <div className="flex justify-content-end gap-2 pt-3 mt-auto border-top-1 surface-border">
          {isEnRevision ? (
            <>
              <Button
                label="Observar"
                icon="pi pi-eye"
                severity="warning"
                onClick={() => setShowObservacionDialog(true)}
                size="small"
              />
              <Button
                label="Aprobar"
                icon="pi pi-check-circle"
                severity="success"
                onClick={handleAprobarEtapa}
                size="small"
              />
            </>
          ) : (
            <Button
              label="Cerrar"
              icon="pi pi-times"
              onClick={onHide}
              className="p-button-secondary"
              size="small"
            />
          )}
        </div>
      </div>

      {/* Diálogo de observación */}
      <ObservacionDialog
        visible={showObservacionDialog}
        onHide={() => setShowObservacionDialog(false)}
        onSubmit={handleObservarEtapa}
        isSubmitting={false}
      />
    </Sidebar>
  );
};

export default ProyectoStageDiagnosticoView;
