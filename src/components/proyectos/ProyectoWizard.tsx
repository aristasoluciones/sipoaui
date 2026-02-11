'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

import { Badge } from 'primereact/badge';

import { Avatar } from 'primereact/avatar';
import ProyectoStageGeneralSidebar from './ProyectoStageGeneralSidebar';
import ProyectoStageGeneralView from './ProyectoStageGeneralView';
import ProyectoStageDiagnosticoSidebar from './ProyectoStageDiagnosticoSidebar';
import ProyectoStageDiagnosticoView from './ProyectoStageDiagnosticoView';
import ProyectoStagePoaSidebar from './ProyectoStagePoaSidebar';
import ProyectoStageBeneficiariosSidebar from './ProyectoStageBeneficiariosSidebar';
import ProyectoStageFormulacionSidebar from './ProyectoStageFormulacionSidebar';

import { useProjectOperations } from '@/src/hooks/useProjectOperations';
import { Prioridad, EstatusEtapa, ProyectoWizardProps, ProyectoFormData, Proyecto } from '@/types/proyectos.d';
import { useNotification } from '@/layout/context/notificationContext';
import { formatApiError } from '@/src/utils';
import { PROYECTO_STAGES, mapEtapaActualToStageId, getStageById, getRequiredStages, isStageRequired } from '@/src/config/proyectos';

const ProyectoWizard: React.FC<ProyectoWizardProps> = ({
  project,
  onCancel,
  isCreating = false,
  onSuccess,
  onCloseWizard,
  onReloadProjects,
  onProjectSaved,
  onProjectReload,
  onSavingStart,
  onSavingEnd,
  selectedEjercicioFiscal,
  unidades = [],
  empleados = [],
  tiposProyecto = []
}) => {
  const router = useRouter();
  // Estado local para saving
  const [wizardSaving, setWizardSaving] = useState(false);
  // Estado local del proyecto para actualizaciones en tiempo real
  const [localProject, setLocalProject] = useState(project);

  // Usar hooks separados para evitar prop drilling y estado duplicado
  const { handleSaveProject } = useProjectOperations({
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
  const [formData, setFormData] = useState<ProyectoFormData>({
    uuid: project?.uuid || undefined,
    codigo: project?.codigo || '',
    nombre: project?.nombre || '',
    //descripcion: project?.descripcion || '', se elimina descripción del formulario general
    prioridad: project?.prioridad as Prioridad || Prioridad.MEDIA,
    ejercicio_id: selectedEjercicioFiscal || 0,
    unidad_id: project?.unidad?.id || null,
    responsable_id: project?.responsable?.id || null,
    tipo_proyecto_id: project?.tipoProyecto?.id || null
  });
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [projectCreated, setProjectCreated] = useState(!!project); // true si ya existe un proyecto
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());
  const [currentEtapaEstatus, setCurrentEtapaEstatus] = useState<string | null>(null);
  const toast = useRef<Toast>(null);

  // Sincronizar localProject con project cuando cambie
  useEffect(() => {
    setLocalProject(project);
  }, [project]);

  // Inicializar etapas completadas cuando se carga el proyecto
  useEffect(() => {
    if (localProject?.etapasCompletadas) {
      const newCompletedStages = new Set<number>();
      
      // Marcar como completadas las etapas que vienen en etapasCompletadas
      localProject.etapasCompletadas.forEach(etapa => {
        // Mapear el ID de la etapa completada al ID del stage
        // Asumiendo que el ID de EtapaCompletada corresponde al ID del stage
        if(etapa.estatus === EstatusEtapa.APROBADO)
          newCompletedStages.add(etapa.id);
      });
      
      setCompletedStages(newCompletedStages);
      
      // Guardar el estatus de la etapa actual que viene del servidor
      const etapaEstatus = localProject.estatusEtapaActual || 'Captura';
      setCurrentEtapaEstatus(etapaEstatus);
    }
  }, [localProject?.etapasCompletadas, localProject?.estatusEtapaActual]);

  // Actualizar ejercicio fiscal cuando cambie
  useEffect(() => {
    if (selectedEjercicioFiscal && selectedEjercicioFiscal !== formData.ejercicio_id) {
      setFormData(prev => ({
        ...prev,
        ejercicio_id: selectedEjercicioFiscal
      }));
    }
  }, [selectedEjercicioFiscal, formData.ejercicio_id]);

  // Función para actualizar el proyecto localmente
  const handleProjectUpdate = (updatedFields: Partial<Proyecto>) => {
    setLocalProject(prev => prev ? { ...prev, ...updatedFields } : undefined);
  };

  // Obtener el progreso de una etapa, en porcentaje
  const getStageProgress = (stageId: number): number => {
    // Si la etapa está aprobada, está 100% completa
    if (completedStages.has(stageId)) return 100;
    
    return 0;
  };

  // Verificar si una etapa está completada
  const isStageCompleted = (stageId: number): boolean => {
    return getStageProgress(stageId) === 100;
  };

  // Verificar si todas las etapas requeridas están completas
  const areAllRequiredStagesCompleted = (): boolean => {
    return getRequiredStages().every(stage => isStageCompleted(stage.id));
  };

  // Verificar si una etapa está desbloqueada
  const isStageUnlocked = (stageId: number): boolean => {
    // Para proyectos nuevos, la primera etapa siempre está desbloqueada
    if (isCreating && stageId === 1) return true;

    if (stageId === 1) return true; // Primera etapa siempre desbloqueada
    
    // Si existe un proyecto cargado con etapa actual
    if (localProject?.etapaActual && currentEtapaEstatus) {
      const currentStageId = mapEtapaActualToStageId(localProject.etapaActual);
      
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
      if (isStageRequired(i) && !isStageCompleted(i)) {
        return false;
      }
    }
    return true;
  };

  // Obtener estado de una etapa
  const getStageStatus = (stageId: number): EstatusEtapa | 'locked' | 'optional' => {
  
    // Para proyectos nuevos, solo la etapa 1 está disponible, las demás están bloqueadas
    if (isCreating) {
      return stageId === 1 ? EstatusEtapa.CAPTURA : 'locked';
    }
      
    // Buscar la etapa en etapasCompletadas de la API
    const etapaCompletada = localProject?.etapasCompletadas?.find(e => e.id === stageId);

    // Si la etapa existe en etapasCompletadas, devolver su estatus
    if (etapaCompletada) {
      return etapaCompletada.estatus;
    }
    // Si la etapa no esta completada pero la anterior si, está en captura
    if (stageId > 1) {
      const previousStageCompleted = isStageCompleted(stageId - 1);
      if (previousStageCompleted) {
        return EstatusEtapa.CAPTURA;
      }
    }
    return 'locked';
  };

  // Manejar apertura de sidebar para editar etapa
  const handleEditStage = (stageId: number) => {
    if (!isStageUnlocked(stageId)) {
      showMsgWarning('Etapa bloqueada', 'Complete las etapas anteriores para desbloquear esta etapa');
      return;
    }

    // Si es la etapa POA (stageId 3), redirigir a la página dedicada
    if (stageId === 3 && localProject?.uuid) {
      router.push(`/proyectos/${localProject.uuid}/poa`);
      return;
    }
    // Si es la etapa Estimación (stageId 4), redirigir a la página dedicada
    if (stageId === 4 && localProject?.uuid) {
      router.push(`/proyectos/${localProject.uuid}/beneficiarios`);
      return;
    }

    // aplicar clase a document body para evitar scroll cuando el sidebar esté abierto
    document.body.classList.add('overflow-hidden');
    setActiveStage(stageId);
    setSidebarVisible(true);
  };

  // Verificar si una etapa está en modo solo lectura (Aprobado)
  const isStageReadOnly = (stageId: number): boolean => {
    // Para proyectos nuevos, ninguna etapa está en modo solo lectura
    if (isCreating) return false;

    if (!localProject?.etapaActual || !currentEtapaEstatus) return false;

    const currentStageId = mapEtapaActualToStageId(localProject.etapaActual);

    // Si es la etapa actual y está aprobada o en revisión, es solo lectura
    if (stageId === currentStageId && (currentEtapaEstatus === EstatusEtapa.APROBADO || currentEtapaEstatus === EstatusEtapa.EN_REVISION)) {
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
    const stage = activeStage !== null ? getStageById(activeStage) : null;
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

  // Manejar cancelación
  const handleCancel = () => {
    onCancel();
  };

  return (
    <>
      <div className="wizard-container h-full">
        {/* Contenido Principal - Resumen de Etapas */}
        <div className="">
          <div className="grid">
            {PROYECTO_STAGES.map((stage) => {
              const status = getStageStatus(stage.id);
              const isLocked = status === 'locked';
              
              return (
                <div key={stage.id} className="col-12 md:col-6 lg:col-4">
                  <div
                    className={`bg-white border border-round border-gray-200 h-full border-1 cursor-pointer transition-all transition-duration-200 ${
                      status === EstatusEtapa.EN_REVISION
                        ? 'border-warning-400 bg-orange-50 hover:shadow-4'
                        : status === EstatusEtapa.OBSERVADO
                          ? 'border-danger-400 bg-red-50 hover:shadow-4'
                          : isLocked
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
                          {status === EstatusEtapa.EN_REVISION && (
                            <Badge 
                              value="Revision" 
                              severity="warning" 
                              className="text-xs"
                            />
                          )}
                          {status === EstatusEtapa.OBSERVADO && (
                            <Badge 
                              value="Observado" 
                              severity="danger" 
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
                            status === EstatusEtapa.EN_REVISION
                              ? 'Ver'
                              : status === EstatusEtapa.OBSERVADO
                                ? 'Corregir'
                                : isLocked 
                                  ? 'Bloqueado' 
                                  : status === EstatusEtapa.APROBADO 
                                    ? 'Revisar' 
                                    : 'Editar'
                          }
                          icon={
                            status === EstatusEtapa.EN_REVISION
                              ? 'pi pi-eye'
                              : status === EstatusEtapa.OBSERVADO
                                ? 'pi pi-exclamation-triangle'
                                : isLocked 
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
          (project || isCreating) ? (
            isStageReadOnly(1) && project ? (
              <ProyectoStageGeneralView
                visible={sidebarVisible}
                onHide={handleCloseSidebar}
                project={project}
              />
            ) : (
              <ProyectoStageGeneralSidebar
                visible={sidebarVisible}
                onHide={handleCloseSidebar}
                stage={getStageById(activeStage)!}
                formData={formData}
                onInputChange={handleInputChange}
                onSave={handleSaveStage}
                onCancel={handleCloseSidebar}
                unidades={unidades}
                empleados={empleados}
                tiposProyecto={tiposProyecto}
              />
            )
          ) : null
        ) : activeStage === 2 ? (
          localProject ? (
            isStageReadOnly(2) ? (
              <ProyectoStageDiagnosticoView
                visible={sidebarVisible}
                onHide={handleCloseSidebar}
                project={localProject}
                onProjectReload={onProjectReload}
              />
            ) : (
              <ProyectoStageDiagnosticoSidebar
                visible={sidebarVisible}
                onHide={handleCloseSidebar}
                stage={getStageById(activeStage)!}
                project={localProject}
                onCancel={handleCloseSidebar}
                onProjectReload={onProjectReload}
                onProjectUpdate={handleProjectUpdate}
              />
            )
          ) : null
        ) : activeStage === 3 ? (
          localProject ? (
            <ProyectoStagePoaSidebar
              visible={sidebarVisible}
              onHide={handleCloseSidebar}
              stage={getStageById(activeStage)!}
              project={localProject}
              onSave={handleSaveStage}
              onCancel={handleCloseSidebar}
            />
          ) : null
        ) : activeStage === 4 ? (
          localProject ? (
            <ProyectoStageBeneficiariosSidebar
              visible={sidebarVisible}
              onHide={handleCloseSidebar}
              stage={getStageById(activeStage)!}
              project={localProject}
              onSave={handleSaveStage}
              onCancel={handleCloseSidebar}
            />
          ) : null
        ) : activeStage === 5 ? (
          localProject ? (
            <ProyectoStageFormulacionSidebar
              visible={sidebarVisible}
              onHide={handleCloseSidebar}
              stage={getStageById(activeStage)!}
              project={localProject}
              onSave={handleSaveStage}
              onCancel={handleCloseSidebar}
            />
          ) : null
        ) : null}
      </div>
    </>
  );
};

export { ProyectoWizard };
export default ProyectoWizard;
