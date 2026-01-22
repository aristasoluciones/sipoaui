'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';

import { Badge } from 'primereact/badge';
import { ProgressBar } from 'primereact/progressbar';

import { Avatar } from 'primereact/avatar';
import ProyectoStageGeneralSidebar from './ProyectoStageGeneralSidebar';
import ProyectoStageDiagnosticoSidebar from './ProyectoStageDiagnosticoSidebar';
import ProyectoStageDiagnosticoView from './ProyectoStageDiagnosticoView';
import ProyectoStagePoaSidebar from './ProyectoStagePoaSidebar';
import ProyectoStageBeneficiariosSidebar from './ProyectoStageBeneficiariosSidebar';
import ProyectoStageFormulacionSidebar from './ProyectoStageFormulacionSidebar';

import { useProjectOperations } from '@/src/hooks/useProjectOperations';
import { Proyecto, ProyectoFormData, ProyectoApi } from '@/types/proyectos';
import { Prioridad, EstatusEtapa } from '@/types/proyectos.d';
import { useNotification } from '@/layout/context/notificationContext';
import { formatApiError } from '@/src/utils';

interface ProyectoWizardProps {
  project?: Proyecto;
  onCancel: () => void;
  isCreating?: boolean;
  onSuccess?: () => void;
  onCloseWizard?: () => void;
  onReloadProjects?: () => void;
  onProjectSaved?: (savedProject: ProyectoApi) => void;
  onSavingStart?: () => void;
  onSavingEnd?: () => void;
  selectedEjercicioFiscal: number | null;
}

interface Stage {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  required: boolean;
}

const ProyectoWizard: React.FC<ProyectoWizardProps> = ({
  project,
  onCancel,
  isCreating = false,
  onSuccess,
  onCloseWizard,
  onReloadProjects,
  onProjectSaved,
  onSavingStart,
  onSavingEnd,
  selectedEjercicioFiscal
}) => {
  const router = useRouter();
  // Estado local para saving
  const [wizardSaving, setWizardSaving] = useState(false);

  // Usar hooks separados para evitar prop drilling y estado duplicado
  const { handleSaveProject, handleSaveDiagnostico } = useProjectOperations({
    isCreating,
    selectedProject: project || null,
    onSuccess,
    onCloseWizard,
    onReloadProjects,
    onProjectSaved,
    onSavingStart: () => {
      setWizardSaving(true);
      onSavingStart?.();
    },
    onSavingEnd: () => {
      setWizardSaving(false);
      onSavingEnd?.();
    },
    showSuccessMessages: false // Los mensajes se manejan en el componente
  });
  const { success:showMsgSuccess, error:showMsgError, warning:showMsgWarning } = useNotification();
  const [loading, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProyectoFormData>({
    uuid: project?.uuid || undefined,
    codigo: project?.codigo || '',
    nombre: project?.nombre || '',
    descripcion: project?.descripcion || '',
    prioridad: project?.prioridad as Prioridad || Prioridad.MEDIA,
    ejercicio_id: selectedEjercicioFiscal || 0,
    unidad_id: project?.unidad?.id || null,
    responsable_id: project?.responsable?.id || null,
    tipo_proyecto_id: project?.tipoProyecto?.id || null
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [projectCreated, setProjectCreated] = useState(!!project); // true si ya existe un proyecto
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());
  const [currentEtapaEstatus, setCurrentEtapaEstatus] = useState<string | null>(null);
  const toast = useRef<Toast>(null);

  // Mapear etapa_actual a ID de stage
  const mapEtapaActualToStageId = (etapaActual: string): number => {
    const etapaMap: Record<string, number> = {
      'InformacionGeneral': 1,
      'DiagnosticoProblema': 2,
      'ProgramaOperativoAnual': 3,
      'EstimacionBeneficiarios': 4,
      'FormulacionCuantitativa': 5
    };
    return etapaMap[etapaActual] ?? 1;
  };

  // Inicializar etapas completadas cuando se carga el proyecto
  useEffect(() => {
    if (project?.etapasCompletadas) {
      const newCompletedStages = new Set<number>();
      
      // Marcar como completadas las etapas que vienen en etapasCompletadas
      project.etapasCompletadas.forEach(etapa => {
        // Mapear el ID de la etapa completada al ID del stage
        // Asumiendo que el ID de EtapaCompletada corresponde al ID del stage
        newCompletedStages.add(etapa.id);
      });
      
      setCompletedStages(newCompletedStages);
      
      // Guardar el estatus de la etapa actual que viene del servidor
      const etapaEstatus = project.estatusEtapaActual || 'Captura';
      setCurrentEtapaEstatus(etapaEstatus);
    }
  }, [project?.etapasCompletadas, project?.estatusEtapaActual]);

  // Actualizar ejercicio fiscal cuando cambie
  useEffect(() => {
    if (selectedEjercicioFiscal && selectedEjercicioFiscal !== formData.ejercicio_id) {
      setFormData(prev => ({
        ...prev,
        ejercicio_id: selectedEjercicioFiscal
      }));
    }
  }, [selectedEjercicioFiscal, formData.ejercicio_id]);

  // Definición de etapas del proyecto
  const stages: Stage[] = [
    {
      id: 1,
      title: 'Información General',
      description: 'Datos básicos del proyecto',
      icon: 'pi pi-info-circle',
      color: 'blue',
      required: true
    },
    {
      id: 2,
      title: 'Diagnóstico del Problema',
      description: 'Identificación y análisis del problema principal',
      icon: 'pi pi-search',
      color: 'orange',
      required: true
    },
    {
      id: 3,
      title: 'Programa Operativo Anual',
      description: 'Captura de Actividades, Subactividades y periodos de ejecución',
      icon: 'pi pi-list',
      color: 'purple',
      required: true
    },
    {
      id: 4,
      title: 'Estimación de Beneficiarios',
      description: 'Análisis de población objetivo y beneficiarios',
      icon: 'pi pi-users',
      color: 'green',
      required: true
    },
    {
      id: 5,
      title: 'Formulación Cuantitativa',
      description: 'Análisis financiero y evaluación económica',
      icon: 'pi pi-calculator',
      color: 'teal',
      required: false
    }
  ];

  // Opciones para dropdowns - ya no necesarias aquí (movidas al componente sidebar)

  // Obtener progreso de una etapa
  const getStageProgress = (stageId: number): number => {
    // Verificar si está en completedStages
    if (completedStages.has(stageId)) {
      return 100;
    }

    // Stage 1 (Información General) está completo si:
    // - Existe un proyecto (ya guardado en BD), o
    // - Es un proyecto nuevo que ya se guardó (projectCreated = true)
    if (stageId === 1) {
      return (project || projectCreated) ? 100 : 0;
    }

    // Por ahora, otras etapas no tienen progreso
    // calcular basado en datos guardados en sessionStorage
    const storedData = sessionStorage.getItem(`proyecto_etapas_${formData.uuid}`);
    if (storedData) {
      const etapas = JSON.parse(storedData);
      if (etapas[stageId]) {
        return 100;
      }
    }

    return 0;
  };

  // Verificar si una etapa está completa
  const isStageCompleted = (stageId: number): boolean => {
    return completedStages.has(stageId) || getStageProgress(stageId) >= 100;
  };

  // Verificar si todas las etapas requeridas están completas
  const areAllRequiredStagesCompleted = (): boolean => {
    return stages
      .filter(stage => stage.required)
      .every(stage => isStageCompleted(stage.id));
  };

  // Verificar si una etapa está desbloqueada
  const isStageUnlocked = (stageId: number): boolean => {
    if (stageId === 1) return true; // Primera etapa siempre desbloqueada
    
    // Si existe un proyecto cargado con etapa actual
    if (project?.etapaActual && currentEtapaEstatus) {
      const currentStageId = mapEtapaActualToStageId(project.etapaActual);
      
      // Si es la etapa actual, está desbloqueada
      if (stageId === currentStageId) return true;
      
      // Si es una etapa anterior a la actual, está desbloqueada (ya fue completada)
      if (stageId < currentStageId) return true;
      
      // Si es la siguiente etapa y la actual está "Aprobado", se desbloquea
      if (stageId === currentStageId + 1 && currentEtapaEstatus === 'Aprobado') {
        return true;
      }
      
      // Cualquier otra etapa posterior está bloqueada
      if (stageId > currentStageId) return false;
    }
    
    // Lógica por defecto: verificar que todas las etapas anteriores requeridas estén completas
    for (let i = 1; i <= stageId; i++) {
      const stage = stages.find(s => s.id === i);
      if (stage?.required && !isStageCompleted(i)) {
        return false;
      }
    }
    return true;
  };

  // Obtener estado de una etapa
  const getStageStatus = (stageId: number): EstatusEtapa | 'locked' | 'optional' => {
    if (isStageCompleted(stageId)) return EstatusEtapa.APROBADO;
    if (!isStageUnlocked(stageId)) return 'locked';
    const stage = stages.find(s => s.id === stageId);
    if (stage && !stage.required) return 'optional';
    return EstatusEtapa.CAPTURA;
  };

  // Manejar apertura de sidebar para editar etapa
  const handleEditStage = (stageId: number) => {
    if (!isStageUnlocked(stageId)) {
      showMsgWarning('Etapa bloqueada', 'Complete las etapas anteriores para desbloquear esta etapa');
      return;
    }

    // Si es la etapa POA (stageId 3), redirigir a la página dedicada
    if (stageId === 3 && project?.uuid) {
      router.push(`/proyectos/${project.uuid}/poa`);
      return;
    }

    // aplicar clase a document body para evitar scroll cuando el sidebar esté abierto
    document.body.classList.add('overflow-hidden');
    setActiveStage(stageId);
    setSidebarVisible(true);
  };

  // Verificar si una etapa está en modo solo lectura (Aprobado)
  const isStageReadOnly = (stageId: number): boolean => {
    if (!project?.etapaActual || !currentEtapaEstatus) return false;
    
    const currentStageId = mapEtapaActualToStageId(project.etapaActual);
    
    // Si es la etapa actual y está aprobada, es solo lectura
    if (stageId === currentStageId && currentEtapaEstatus === 'Aprobado') {
      return true;
    }
    
    // Si es una etapa anterior a la actual, también es solo lectura
    if (stageId < currentStageId) {
      return true;
    }
    
    return false;
  };

  // Cerrar sidebar
  const handleCloseSidebar = () => {
    // remover clase de no-scroll al cerrar sidebar
    document.body.classList.remove('overflow-hidden');
    setSidebarVisible(false);
    setActiveStage(null);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof ProyectoFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Guardar etapa actual
  const handleSaveStage = async () => {
    const stage = activeStage !== null ? stages.find(s => s.id === activeStage) : null;
    const stageName = stage?.title || '';

    // Si es la etapa 1 (Información General), guardar el proyecto y activar siguiente etapa
    if (activeStage === 1) {
      try {
      await handleSaveProject(formData, true); // keepWizardOpen = true

      // Si llega aquí, el guardado fue exitoso
      setProjectCreated(true);

      showMsgSuccess(
        'Proyecto guardado',
        'La información se ha guardado correctamente.'
      );

      handleCloseSidebar();
      } catch (exception: any) {
         const errorMessage = formatApiError(exception);
          showMsgError('Error', `${errorMessage}`);
      }
      return;
    }

    // El guardado de etapas sucede en useProjectOperations

    

    handleCloseSidebar();
  };

  // Enviar proyecto a revisión
  const handleFinishProject = async () => {
    try {
      setSaving(true);
      await handleSaveProject(formData);
    } catch (_error) {
      showMsgError('Error', 'No se pudo enviar el proyecto a revisión');
    } finally {
      setSaving(false);
    }
  };

  // Manejar cancelación
  const handleCancel = () => {
    setShowConfirmDialog(true);
  };

  // Confirmar cancelación
  const confirmCancel = () => {
    setShowConfirmDialog(false);
    onCancel();
  };

  return (
    <>
      <div className="wizard-container h-full">
        {/* Header */}
        <div className="flex justify-content-between align-items-center p-4 border-bottom-1 surface-border">
          <div>
            <h2 className="text-2xl font-bold text-900 m-0">
              {isCreating ? 'Nuevo Proyecto' : `Actualizar: ${project?.nombre}`}
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
              onClick={handleCancel}
            />
            <Button
              label="Enviar a revisión"
              icon="pi pi-send"
              severity="success"
              loading={loading}
              onClick={handleFinishProject}
              disabled={!areAllRequiredStagesCompleted()}
            />
          </div>
        </div>

        {/* Contenido Principal - Resumen de Etapas */}
        <div className="p-4">
          <div className="grid">
            {stages.map((stage) => {
              const progress = getStageProgress(stage.id);
              const status = getStageStatus(stage.id);
              const isLocked = status === 'locked';
              
              return (
                <div key={stage.id} className="col-12 md:col-6 lg:col-4">
                  <div
                    className={`bg-white border border-round border-gray-200 h-full border-1 cursor-pointer transition-all transition-duration-200 ${
                      isLocked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:shadow-4'
                    }`}
                    onClick={() => !isLocked && handleEditStage(stage.id)}
                  >
                    <div className="p-3 flex flex-column h-full">
                      {/* Header de la tarjeta */}
                      <div className="flex align-items-start justify-content-between mb-3">
                        <div className="flex align-items-center items-center gap-2">
                          <div>
                            <Avatar icon={stage.icon} shape='circle' className={`bg-${stage.color}-500`} />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-900 m-0">{stage.title}</h4>
                            <p className="text-600 text-sm m-0 mt-1">{stage.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex align-items-center gap-2">
                          {status === EstatusEtapa.APROBADO && (
                            <Badge 
                              value="Aprobado" 
                              severity="success" 
                              className="text-xs"
                            />
                          )}
                          {status === EstatusEtapa.CAPTURA && (
                            <Badge 
                              value="Captura" 
                              severity="info" 
                              className="text-xs"
                            />
                          )}
                          {status === 'locked' && (
                            <Badge 
                              value="Bloqueado" 
                              severity="warning" 
                              className="text-xs"
                            />
                          )}
                          {status === 'optional' && (
                            <Badge 
                              value="Opcional" 
                              severity="info" 
                              className="text-xs"
                            />
                          )}
                          {!stage.required && (
                            <i className="pi pi-info-circle text-blue-500" title="Etapa opcional" />
                          )}
                        </div>
                      </div>

                      {/* Espacio flexible para mantener altura consistente */}
                      <div className="flex-grow-1"></div>

                      {/* Botón de acción - siempre en el bottom */}
                      <div className="flex justify-content-end mt-3">
                        <Button
                          label={
                            isLocked 
                              ? 'Bloqueado' 
                              : status === EstatusEtapa.APROBADO 
                                ? 'Revisar' 
                                : 'Editar'
                          }
                          icon={
                            isLocked 
                              ? 'pi pi-lock' 
                              : status === EstatusEtapa.APROBADO 
                                ? 'pi pi-eye' 
                                : 'pi pi-pencil'
                          }
                          size="small"
                          outlined
                          disabled={isLocked}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isLocked) handleEditStage(stage.id);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Componente Sidebar para edición de etapas */}
        {activeStage === 1 ? (
          <ProyectoStageGeneralSidebar
            visible={sidebarVisible}
            onHide={handleCloseSidebar}
            stage={stages.find(s => s.id === activeStage)!}
            formData={formData}
            onInputChange={handleInputChange}
            onSave={handleSaveStage}
            onCancel={handleCloseSidebar}
          />
        ) : activeStage === 2 ? (
          project ? (
            isStageReadOnly(2) ? (
              <ProyectoStageDiagnosticoView
                visible={sidebarVisible}
                onHide={handleCloseSidebar}
                projectUuid={project.uuid}
              />
            ) : (
              <ProyectoStageDiagnosticoSidebar
                visible={sidebarVisible}
                onHide={handleCloseSidebar}
                stage={stages.find(s => s.id === activeStage)!}
                project={project}
                onCancel={handleCloseSidebar}
              />
            )
          ) : null
        ) : activeStage === 3 ? (
          project ? (
            <ProyectoStagePoaSidebar
              visible={sidebarVisible}
              onHide={handleCloseSidebar}
              stage={stages.find(s => s.id === activeStage)!}
              project={project}
              onSave={handleSaveStage}
              onCancel={handleCloseSidebar}
            />
          ) : null
        ) : activeStage === 4 ? (
          project ? (
            <ProyectoStageBeneficiariosSidebar
              visible={sidebarVisible}
              onHide={handleCloseSidebar}
              stage={stages.find(s => s.id === activeStage)!}
              project={project}
              onSave={handleSaveStage}
              onCancel={handleCloseSidebar}
            />
          ) : null
        ) : activeStage === 5 ? (
          project ? (
            <ProyectoStageFormulacionSidebar
              visible={sidebarVisible}
              onHide={handleCloseSidebar}
              stage={stages.find(s => s.id === activeStage)!}
              project={project}
              onSave={handleSaveStage}
              onCancel={handleCloseSidebar}
            />
          ) : null
        ) : null}
      </div>

      {/* Dialog de confirmación para cancelar */}
      <Dialog
        visible={showConfirmDialog}
        onHide={() => setShowConfirmDialog(false)}
        header={
          <span className="text-xl font-semibold">Confirmar Acción</span>
        }
        modal
        style={{ width: '500px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={() => setShowConfirmDialog(false)}
            />
            <Button
              label="Sí, regresar"
              icon="pi pi-check"
              severity="danger"
              onClick={confirmCancel}
            />
          </div>
        }
      >
        <div className="grid p-3">
          <div className="col-12">
            <div className="flex align-items-start gap-3 p-4 bg-orange-50 border-round">
              <i className="pi pi-exclamation-triangle text-orange-600 text-3xl"></i>
              <div>
                <p className="text-900 font-semibold mb-2">¿Está seguro que desea regresar?</p>
                <p className="text-600 m-0">
                  Los cambios no guardados se perderán y tendrá que volver a capturar la información.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export { ProyectoWizard };
export default ProyectoWizard;
