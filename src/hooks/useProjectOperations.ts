'use client';

import { useCallback } from 'react';
import { ProyectoService } from '@/src/services/proyecto';
import { useNotification } from '@/layout/context/notificationContext';
import { formatApiError } from '@/src/utils';
import type { Proyecto, ProyectoFormData, ProyectoApi, DiagnosticoData } from '@/types/proyectos.d';

interface UseProjectOperationsProps {
  isCreating: boolean;
  selectedProject: Proyecto | null;
  onSuccess?: () => void;
  onCloseWizard?: () => void;
  onReloadProjects?: () => void;
  onProjectSaved?: (savedProject: ProyectoApi) => void;
  onSavingStart?: () => void;
  onSavingEnd?: () => void;
  showSuccessMessages?: boolean; // Nuevo parámetro para controlar mensajes de éxito
}

interface UseProjectOperationsReturn {
  handleSaveProject: (data: ProyectoFormData, keepWizardOpen?: boolean) => Promise<void>;
  handleSaveDiagnostico: (projectUuid: string, diagnosticoData: DiagnosticoData) => Promise<void>;
  handleGetDiagnostico: (projectUuid: string) => Promise<DiagnosticoData | null>;
  handleSolicitarRevision: (projectUuid: string) => Promise<void>;
  handleAprobar: (projectUuid: string) => Promise<void>;
  handleObservar: (projectUuid: string, observacion: string) => Promise<void>;
}

export const useProjectOperations = ({
  isCreating,
  selectedProject,
  onSuccess,
  onCloseWizard,
  onReloadProjects,
  onProjectSaved,
  onSavingStart,
  onSavingEnd,
  showSuccessMessages = true
}: UseProjectOperationsProps): UseProjectOperationsReturn => {
  const { success, error } = useNotification();

  // Guardar proyecto
  const handleSaveProject = useCallback(async (data: ProyectoFormData, keepWizardOpen = false) => {
    onSavingStart?.();
    try {
      if (isCreating) {
        const createdProject = await ProyectoService.createProyecto(data);
     
        if (showSuccessMessages) {
          success('Éxito', 'Proyecto creado correctamente');
        }
        // Notificar que se guardó el proyecto (creado o actualizado)
        if (onProjectSaved) {
          onProjectSaved(createdProject);
        }
      } else {
        // TODO: Integrar con servicio real cuando esté disponible
        const updatedProject = await ProyectoService.updateProyecto(selectedProject!.uuid, data);
        if (showSuccessMessages) {
          success('Éxito', 'Proyecto actualizado correctamente');
        }
        // Notificar que se guardó el proyecto (creado o actualizado)
        if (onProjectSaved) {
          onProjectSaved(updatedProject);
        }
      }

      if (!keepWizardOpen && onCloseWizard) {
        onCloseWizard();
      }

      // Si el padre maneja el estado local (onProjectSaved), no recargar
      // Si no, recargar la lista completa
      if (!onProjectSaved && onReloadProjects) {
        onReloadProjects();
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      throw err; // Re-lanzar la excepción para que el llamador pueda manejarla
    } finally {
      onSavingEnd?.();
    }
  }, [isCreating, selectedProject, success, error, onCloseWizard, onReloadProjects, onSuccess, onSavingStart, onSavingEnd, showSuccessMessages, onProjectSaved]);

  // Guardar o actualizar diagnóstico
  const handleSaveDiagnostico = useCallback(async (
    projectUuid: string, 
    diagnosticoData: DiagnosticoData
  ) => {
    onSavingStart?.();
    try {
      // Preparar datos en el formato que espera la API
      const diagnosticoPayload = {
        diagnostico: diagnosticoData.diagnostico,
        efectos: diagnosticoData.efectos,
        fines: diagnosticoData.fines,
        poblacion_afectada: diagnosticoData.poblacionAfectada,
        poblacion_objetivo: diagnosticoData.poblacionObjetivo,
        descripcion_problema: diagnosticoData.descripcionProblema,
        descripcion_resultado_esperado: diagnosticoData.descripcionResultadoEsperado,
        magnitud_linea_base: diagnosticoData.magnitudLineaBase,
        magnitud_resultado_esperado: diagnosticoData.magnitudResultadoEsperado,
        causas: diagnosticoData.causas,
        medios: diagnosticoData.medios
      };

      // Intentar actualizar primero, si falla crear uno nuevo
      try {
        await ProyectoService.updateDiagnosticoPorProyectoUuid(
          projectUuid,
          diagnosticoPayload
        );
        if (showSuccessMessages) {
          success('Diagnóstico actualizado', 'Los datos del diagnóstico se han actualizado correctamente');
        }
      } catch (updateError: any) {
        // Si el update falla (404 o similar), intentar crear
        if (updateError?.response?.status === 404 || updateError?.response?.status === 422) {
          await ProyectoService.createDiagnosticoPorProyecto(
            projectUuid,
            diagnosticoPayload
          );
          if (showSuccessMessages) {
            success('Diagnóstico guardado', 'Los datos del diagnóstico se han guardado correctamente');
          }
        } else {
          throw updateError;
        }
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = formatApiError(err);
      error('Error al guardar', errorMessage);
      throw err;
    } finally {
      onSavingEnd?.();
    }
  }, [success, error, onSuccess, onSavingStart, onSavingEnd, showSuccessMessages]);

  // Obtener el diagnóstico de un proyecto por uuid
  const handleGetDiagnostico = useCallback(async (projectUuid: string): Promise<DiagnosticoData | null> => {
    try {
      const response = await ProyectoService.getDiagnosticoPorProyectoUuid(projectUuid);
      
      // Transformar la respuesta de la API al formato DiagnosticoData
      const diagnosticoData: DiagnosticoData = {
        diagnostico: response.diagnostico || '',
        efectos: response.efectos || '',
        fines: response.fines || '',
        poblacionAfectada: response.poblacion_afectada || '',
        poblacionObjetivo: response.poblacion_objetivo || '',
        descripcionProblema: response.descripcion_problema || '',
        descripcionResultadoEsperado: response.descripcion_resultado_esperado || '',
        magnitudResultadoEsperado: response.magnitud_resultado_esperado || '',
        magnitudLineaBase: response.magnitud_linea_base || '',
        causas: response.causas || [],
        medios: response.medios || [],
      };

      return diagnosticoData;
    } catch (err: any) {
      // Si es un 404, significa que no hay diagnóstico aún
      if (err?.response?.status === 404) {
        return null;
      }
      
      const errorMessage = formatApiError(err);
      error('Error al cargar', errorMessage);
      throw err;
    }
  }, [error]);

  // Solicitar revisión de etapa
  const handleSolicitarRevision = useCallback(async (projectUuid: string) => {
    onSavingStart?.();
    try {
      await ProyectoService.solicitarRevisionPoa(projectUuid);
      if (showSuccessMessages) {
        success('Éxito', 'Revisión solicitada correctamente');
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = formatApiError(err);
      error('Error al solicitar revisión', errorMessage);
      throw err;
    } finally {
      onSavingEnd?.();
    }
  }, [success, error, onSuccess, onSavingStart, onSavingEnd, showSuccessMessages]);

  // Aprobar etapa
  const handleAprobar = useCallback(async (projectUuid: string) => {
    onSavingStart?.();
    try {
      await ProyectoService.aprobarEtapa(projectUuid);
      if (showSuccessMessages) {
        success('Éxito', 'Etapa aprobada correctamente');
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = formatApiError(err);
      error('Error al aprobar', errorMessage);
      throw err;
    } finally {
      onSavingEnd?.();
    }
  }, [success, error, onSuccess, onSavingStart, onSavingEnd, showSuccessMessages]);

  // Observar etapa
  const handleObservar = useCallback(async (projectUuid: string, observacion: string) => {
    onSavingStart?.();
    try {
      await ProyectoService.observarEtapa(projectUuid, observacion);
      if (showSuccessMessages) {
        success('Éxito', 'Observación registrada correctamente');
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = formatApiError(err);
      error('Error al observar', errorMessage);
      throw err;
    } finally {
      onSavingEnd?.();
    }
  }, [success, error, onSuccess, onSavingStart, onSavingEnd, showSuccessMessages]);

  return {
    handleSaveProject,
    handleSaveDiagnostico,
    handleGetDiagnostico,
    handleSolicitarRevision,
    handleAprobar,
    handleObservar,
  };
};