import { EtapaProyectoEnum } from '@/types/proyectos.d';

export interface ProyectoStage {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  required: boolean;
  etapaEnum: EtapaProyectoEnum;
  shortLabel: string; // Etiqueta corta para dashboards
}

// Definición de etapas del proyecto
export const PROYECTO_STAGES: ProyectoStage[] = [
  {
    id: 1,
    title: 'Información General',
    description: 'Datos básicos del proyecto',
    icon: 'pi pi-info-circle',
    color: 'blue',
    required: true,
    etapaEnum: EtapaProyectoEnum.INFORMACION_GENERAL,
    shortLabel: 'Info General'
  },
  {
    id: 2,
    title: 'Diagnóstico del Problema',
    description: 'Identificación y análisis del problema principal',
    icon: 'pi pi-search',
    color: 'orange',
    required: true,
    etapaEnum: EtapaProyectoEnum.DIAGNOSTICO_PROBLEMA,
    shortLabel: 'Diagnóstico'
  },
  {
    id: 3,
    title: 'Programa Operativo Anual',
    description: 'Captura de Actividades, Subactividades y periodos de ejecución',
    icon: 'pi pi-list',
    color: 'purple',
    required: true,
    etapaEnum: EtapaProyectoEnum.PROGRAMA_OPERATIVO_ANUAL,
    shortLabel: 'Programa'
  },
  {
    id: 4,
    title: 'Estimación de Beneficiarios',
    description: 'Análisis de población objetivo y beneficiarios',
    icon: 'pi pi-users',
    color: 'green',
    required: true,
    etapaEnum: EtapaProyectoEnum.ESTIMACION_BENEFICIARIOS,
    shortLabel: 'Beneficiarios'
  },
  {
    id: 5,
    title: 'Formulación Cuantitativa',
    description: 'Análisis financiero y evaluación económica',
    icon: 'pi pi-calculator',
    color: 'teal',
    required: false,
    etapaEnum: EtapaProyectoEnum.FORMULACION_CUANTITATIVA,
    shortLabel: 'Formulación'
  }
];

// Mapeo de etapa_actual (string) a ID de stage
export const mapEtapaActualToStageId = (etapaActual: string): number => {
  const etapaMap: Record<string, number> = {
    'InformacionGeneral': 1,
    'DiagnosticoProblema': 2,
    'ProgramaOperativoAnual': 3,
    'EstimacionBeneficiarios': 4,
    'FormulacionCuantitativa': 5
  };
  return etapaMap[etapaActual] ?? 1;
};

// Mapeo inverso: ID de stage a etapa_actual (string)
export const mapStageIdToEtapaActual = (stageId: number): string => {
  const stageMap: Record<number, string> = {
    1: 'InformacionGeneral',
    2: 'DiagnosticoProblema',
    3: 'ProgramaOperativoAnual',
    4: 'EstimacionBeneficiarios',
    5: 'FormulacionCuantitativa'
  };
  return stageMap[stageId] ?? 'InformacionGeneral';
};

// Mapeo de ID de stage a EtapaProyectoEnum
export const mapStageIdToEtapaEnum = (stageId: number): EtapaProyectoEnum => {
  const stage = PROYECTO_STAGES.find(s => s.id === stageId);
  return stage?.etapaEnum ?? EtapaProyectoEnum.INFORMACION_GENERAL;
};

// Mapeo de EtapaProyectoEnum a ID de stage
export const mapEtapaEnumToStageId = (etapaEnum: EtapaProyectoEnum): number => {
  const stage = PROYECTO_STAGES.find(s => s.etapaEnum === etapaEnum);
  return stage?.id ?? 1;
};

// Obtener stage por ID
export const getStageById = (stageId: number): ProyectoStage | undefined => {
  return PROYECTO_STAGES.find(stage => stage.id === stageId);
};

// Obtener stage por EtapaProyectoEnum
export const getStageByEtapaEnum = (etapaEnum: EtapaProyectoEnum): ProyectoStage | undefined => {
  return PROYECTO_STAGES.find(stage => stage.etapaEnum === etapaEnum);
};

// Obtener todas las etapas requeridas
export const getRequiredStages = (): ProyectoStage[] => {
  return PROYECTO_STAGES.filter(stage => stage.required);
};

// Verificar si una etapa es requerida
export const isStageRequired = (stageId: number): boolean => {
  const stage = getStageById(stageId);
  return stage?.required ?? false;
};

// Obtener las claves para estadísticas de etapas (para dashboards)
export const getEtapaStatsKeys = (): string[] => {
  return ['InformacionGeneral', 'DiagnosticoProblema', 'ProgramaOperativoAnual', 'EstimacionBeneficiarios', 'FormulacionCuantitativa'];
};

// Mapeo de ID de stage a clave de estadísticas
export const mapStageIdToStatsKey = (stageId: number): string => {
  return mapStageIdToEtapaActual(stageId);
};

// Mapeo inverso: clave de estadísticas a ID de stage
export const mapStatsKeyToStageId = (statsKey: string): number => {
  return mapEtapaActualToStageId(statsKey);
};