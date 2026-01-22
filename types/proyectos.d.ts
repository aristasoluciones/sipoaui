// Tipos para el sistema de proyectos
// Define los estados posibles de un proyecto, partiendo de que primero se registra el proyecto y luego se va avanzando en etapas
// a travez de un wizard donde constara de 5 etapas, la primera es el registro del proyecto y las siguientes 4 etapas son las fases del proyecto
// (Diagnostico del problema, Programa operativo anual, Estimacion de beneficiarios y Formulacion del proyecto cuantitativo)
// Cada etapa tendra un porcentaje de avance y al finalizar la etapa se podra avanzar a la siguiente
// Los estatus de las etapas son: Captura, EnRevision, Observado, Aprobado

import { EntregableApi, TipoActividad, TipoActividadApi } from "./catalogos";

export enum EstatusEtapa {
  CAPTURA = 'Captura',
  EN_REVISION = 'EnRevision',
  OBSERVADO = 'Observado',
  APROBADO = 'Aprobado'
}

export enum EstatusSubactividad {
  PENDIENTE = 'Captura',
  VALIDADA  = 'Validada'
}

export enum EstatusProyecto {
  BORRADOR = 'Borrador',
  EN_PROGRESO = 'En Progreso',
  COMPLETADO = 'Completado',
  CANCELADO = 'Cancelado',
  EN_REVISION = 'En Revisión',
  APROBADO = 'Aprobado',
  RECHAZADO = 'Rechazado'
}

export enum EtapaProyectoEnum {
  INFORMACION_GENERAL = 'InformacionGeneral',
  DIAGNOSTICO_PROBLEMA = 'DiagnosticoProblema',
  PROGRAMA_OPERATIVO_ANUAL = 'ProgramaOperativoAnual',
  ESTIMACION_BENEFICIARIOS = 'EstimacionBeneficiarios',
  FORMULACION_CUANTITATIVA = 'FormulacionCuantitativa'
}

export enum Prioridad {
  BAJA = 'Baja',
  MEDIA = 'Media',
  ALTA = 'Alta',
  CRITICA = 'Crítica'
}
interface Unidad {
  id: number;
  nombre: string;
}
interface Usuario {
  id: number;
  nombre: string;
}
interface TipoProyecto {
  id: number;
  nombre: string;
}
interface Responsable {
  id: number;
  nombre: string;
}
 
interface PresupuestoDetallado {
  descripcion: string;
  total: number;
}

interface EtapaCompletada {
  id: number;
  nombre: string;
  estatus: EstatusEtapa;
}

export interface ProyectoApi {
  uuid: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  prioridad: string;
  ejercicio_fiscal: number;
  ejercicio_id: number;
  created_at: string;
  updated_at?: string;
  estatus: EstatusProyecto;
  etapa_actual: EtapaProyectoEnum;
  estatus_etapa_actual: EstatusEtapa;
  creador: string;
  ultimo_actualizador: string;
  // Entidades relacionadas
  unidad: Unidad;
  responsable: Responsable;
  tipo_proyecto:TipoProyecto;

  // Campos calculados
  etapas_completadas: EtapaCompletada[];
  porcentaje_avance: number;
  presupuesto_total?: number;
  presupuesto_detallado?: PresupuestoDetallado[];
}

export interface Proyecto {
  uuid: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  prioridad: string;
  ejercicioFiscal: number;
  ejercicioId: number;
  createdAt: string;
  updatedAt?: string;
  estatus: EstatusProyecto;
  etapaActual: EtapaProyectoEnum;
  estatusEtapaActual: EstatusEtapa;
  creador: string;
  ultimoActualizador: string;
  // Entidades relacionadas
  unidad: Unidad;
  responsable: Responsable;
  tipoProyecto: TipoProyecto;

  // Campos calculados
  etapasCompletadas: EtapaCompletada[];
  porcentajeAvance: number;
  presupuestoTotal?: number;
  presupuestoDetallado?: PresupuestoDetallado[];
}

// Datos del formulario para crear/editar proyecto
export interface ProyectoFormData {
  uuid?: string; // Opcional para edición
  codigo: string;
  nombre: string;
  descripcion?: string;
  prioridad: Prioridad;
  ejercicio_id: number;
  unidad_id: number | null;
  responsable_id: number | null;
  tipo_proyecto_id: number | null;
}
 
export interface EtapaProyecto {
  numero: number;
  nombre: string;
  descripcion: string;
  icono: string;
  completada: boolean;
  activa: boolean;
  fechaCompletado?: string;
  datosGuardados?: any;
}

// Etapa 1: Diagnóstico del Problema
export interface DiagnosticoProblema {
  problemaPrincipal: string;
  causasRaiz: string[];
  efectos: string[];
  poblacionAfectada: number;
  ubicacionGeografica: string[];
  magnitudProblema: 'alto' | 'medio' | 'bajo';
  urgencia: 'alta' | 'media' | 'baja';
  evidenciasDocumentales: string[];
  analisisCausas: string;
  justificacion: string;
}

export interface DiagnosticoApi {
  diagnostico: string;
  efectos: string;
  fines: string;
  poblacion_afectada: string;
  poblacion_objetivo: string;
  descripcion_problema: string;
  descripcion_resultado_esperado: string;
  magnitud_linea_base: string;
  magnitud_resultado_esperado: string;
  causas: string[];
  medios: string[];
}
// Formulario de Diagnóstico (para el componente de captura)
export interface DiagnosticoData {
  diagnostico: string;
  efectos: string;
  fines: string;
  poblacionAfectada: string;
  poblacionObjetivo: string;
  descripcionProblema: string;
  descripcionResultadoEsperado: string;
  magnitudLineaBase: string;
  magnitudResultadoEsperado: string;
  causas: string[];
  medios: string[];
}

// Etapa 2: Programa Operativo Anual
export interface ProgramaOperativoAnualApi {
  id: number;
  estatus: EstatusEtapa;
  proyecto: any;
  actividades: ActividadPoaApi[];
  created_at: string;
  updated_at?: string;
}

export interface ProgramaOperativoAnual {
  objetivoGeneral: string;
  objetivosEspecificos: string[];
  metas: Meta[];
  actividades: Actividad[];
  cronograma: ItemCronograma[];
  recursos: RecursoNecesario[];
  indicadores: Indicador[];
}

export interface Meta {
  id: number;
  descripcion: string;
  valor: number;
  unidadMedida: string;
  fechaLimite: string;
  responsable: string;
}

export interface ActividadPoaApi {
  id: number;
  descripcion: string;
  tipo_actividad: TipoActividadApi;
  orden: number;
  total_subactividades: number;
  created_at: string;
  updated_at: string;
}

export interface ActividadPoa {
  id: number;
  descripcion: string;
  tipoActividad: TipoActividad;
  orden: number;
  totalSubactividades: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SubactividadPoaApi {
  id: number;
  actividad_id: number;
  descripcion: string;
  tipo_actividad: TipoActividadApi;
  fecha_inicio: string;
  fecha_termino: string;
  estatus: EstatusSubactividad;
  entregable: EntregableApi;
  meses_reporte: string[];
  created_at: string;
  updated_at?: string;
}
export interface SubactividadPoa {
  id: number;
  actividadId: number;
  descripcion: string;
  tipoActividad: TipoActividad;
  fechaInicio: string;
  fechaTermino: string;
  estatus: EstatusSubactividad;
  entregableId: number;
  mesesReporte: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ItemCronograma {
  mes: number;
  actividades: number[];
  hitos: string[];
}

export interface RecursoNecesario {
  id: number;
  tipo: 'humano' | 'material' | 'tecnologico' | 'financiero';
  descripcion: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  costoTotal: number;
  proveedor?: string;
}

// Etapa 3: Estimación de Beneficiarios
export interface EstimacionBeneficiarios {
  beneficiariosDirectos: GrupoBeneficiarios[];
  beneficiariosIndirectos: GrupoBeneficiarios[];
  criterioPriorizacion: string[];
  metodologiaCalculo: string;
  fuentesInformacion: string[];
  supuestos: string[];
  riesgos: string[];
  impactoEsperado: string;
}

export interface GrupoBeneficiarios {
  id: number;
  tipo: string;
  descripcion: string;
  cantidad: number;
  caracteristicas: string[];
  ubicacion: string[];
  necesidadesEspecificas: string[];
}

// Etapa 4: Formulación de Proyecto Cuantitativo
export interface FormulacionCuantitativa {
  matrizLogica: MatrizLogica;
  presupuesto: PresupuestoDetallado;
  evaluacionEconomica: EvaluacionEconomica;
  analisisRiesgo: AnalisisRiesgo[];
  planImplementacion: PlanImplementacion;
  sistemaMonitoreo: SistemaMonitoreo;
}

export interface MatrizLogica {
  fin: ComponenteMatriz;
  proposito: ComponenteMatriz;
  componentes: ComponenteMatriz[];
  actividades: ComponenteMatriz[];
}

export interface ComponenteMatriz {
  descripcion: string;
  indicadores: string[];
  mediosVerificacion: string[];
  supuestos: string[];
}

export interface PresupuestoDetallado {
  resumen: ResumenPresupuestal;
  desglosePorPartida: DesglosePorPartida[];
  cronogramaEjecucion: CronogramaPresupuestal[];
  fuentesFinanciamiento: FuenteFinanciamiento[];
}

export interface ResumenPresupuestal {
  totalProyecto: number;
  aporteInstitucional: number;
  aporteExterno: number;
  contrapartida: number;
}

export interface DesglosePorPartida {
  partida: string;
  concepto: string;
  monto: number;
  porcentaje: number;
}

export interface CronogramaPresupuestal {
  año: number;
  trimestre: number;
  monto: number;
  acumulado: number;
}

export interface FuenteFinanciamiento {
  fuente: string;
  monto: number;
  porcentaje: number;
  condiciones?: string;
}

export interface EvaluacionEconomica {
  vp: number; // Valor Presente
  tir: number; // Tasa Interna de Retorno
  van: number; // Valor Actual Neto
  beneficioCosto: number;
  periodoRecuperacion: number;
  analisisSensibilidad: AnalisisSensibilidad[];
}

export interface AnalisisSensibilidad {
  variable: string;
  escenario: 'optimista' | 'realista' | 'pesimista';
  impacto: number;
  probabilidad: number;
}

export interface AnalisisRiesgo {
  id: number;
  riesgo: string;
  probabilidad: 'alta' | 'media' | 'baja';
  impacto: 'alto' | 'medio' | 'bajo';
  estrategiaMitigacion: string;
  responsable: string;
  fechaEvaluacion: string;
}

export interface PlanImplementacion {
  fases: FaseImplementacion[];
  hitosControl: HitoControl[];
  equipoProyecto: MiembroEquipo[];
  cronogramaGeneral: ItemCronogramaGeneral[];
}

export interface FaseImplementacion {
  numero: number;
  nombre: string;
  descripcion: string;
  duracion: number;
  actividades: string[];
  entregables: string[];
}

export interface HitoControl {
  nombre: string;
  fecha: string;
  criteriosAceptacion: string[];
  responsable: string;
}

export interface MiembroEquipo {
  nombre: string;
  rol: string;
  responsabilidades: string[];
  dedicacion: number; // porcentaje
}

export interface ItemCronogramaGeneral {
  actividad: string;
  fechaInicio: string;
  fechaFin: string;
  duracion: number;
  responsable: string;
  precedentes: string[];
  recursos: string[];
}

export interface SistemaMonitoreo {
  indicadoresDesempeño: IndicadorDesempeño[];
  frecuenciaReporte: string;
  responsableMonitoreo: string;
  herramientasMonitoreo: string[];
  procedimientosEvaluacion: string[];
}

export interface IndicadorDesempeño {
  nombre: string;
  descripcion: string;
  formula: string;
  unidadMedida: string;
  frecuencia: string;
  meta: number;
  responsable: string;
}

export interface Indicador {
  id: number;
  nombre: string;
  descripcion: string;
  formula: string;
  unidadMedida: string;
  meta: number;
  valorBase: number;
  frecuenciaMedicion: string;
}

// Interfaces para navegación y estado
export interface ProyectoWizardState {
  proyectoId?: number;
  etapaActual: number;
  datosGuardados: {
    diagnostico?: Partial<DiagnosticoProblema>;
    programa?: Partial<ProgramaOperativoAnual>;
    beneficiarios?: Partial<EstimacionBeneficiarios>;
    formulacion?: Partial<FormulacionCuantitativa>;
  };
}

export interface ProyectoFilter {
  año?: number;
  unidad?: string;
  estado?: string;
  busqueda?: string;
  etapa?: number;
  porcentajeMin?: number;
  porcentajeMax?: number;
}

