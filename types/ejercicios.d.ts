// Tipos para el sistema de ejercicios fiscales
// Los ejercicios fiscales funcionan como repositorios que acumulan proyectos
// Contienen información básica del ejercicio y estadísticas agregadas de proyectos

export interface EjercicioFiscalApi {
  id: number;
  anio: number;
  fecha_inicio_ejercicio: string; // Fecha de inicio del ejercicio fiscal
  fecha_cierre_ejercicio: string; // Fecha de cierre del ejercicio fiscal
  fecha_inicio_captura_proyecto: string; // Fecha de inicio para capturas de proyectos
  fecha_cierre_captura_proyecto: string; // Fecha de cierre para capturas de proyectos
  estatus: 'Activo' | 'Inactivo'; // Indica si es el ejercicio fiscal activo
  created_at: string;
  updated_at: string;
  // Estadísticas agregadas (calculadas desde proyectos)
  total_proyectos: number;
  monto_total: number;
  proyectos_aprobados: number;
  proyectos_cancelados: number;
  proyectos_en_progreso: number;
  proyectos_borrador: number;
}

export interface EjercicioFiscal {
  id: number;
  anio: number;
  fechaInicioEjercicio: string; // Fecha de inicio del ejercicio fiscal
  fechaCierreEjercicio: string; // Fecha de cierre del ejercicio fiscal
  fechaInicioCapturaProyecto: string; // Fecha de inicio para capturas de proyectos
  fechaCierreCapturaProyecto: string; // Fecha de cierre para capturas de proyectos
  estatus: 'Activo' | 'Inactivo'; // Indica si es el ejercicio fiscal activo
  createdAt: string;
  updatedAt: string;
  // Estadísticas agregadas (calculadas desde proyectos)
  totalProyectos: number;
  montoTotal: number;
  proyectosAprobados: number;
  proyectosCancelados: number;
  proyectosEnProgreso: number;
  proyectosBorrador: number;
}

export interface EjercicioFiscalFormData {
  anio: number;
  fechaInicioEjercicio: Date | null;
  fechaCierreEjercicio: Date | null;
  fechaInicioCapturaProyecto: Date | null;
  fechaCierreCapturaProyecto: Date | null;
  estatus: 'Activo' | 'Inactivo' | null;
}

export interface EjercicioFiscalFormDataToApi {
  anio: number;
  fecha_inicio_ejercicio: string;
  fecha_cierre_ejercicio: string;
  fecha_inicio_captura_proyecto: string;
  fecha_cierre_captura_proyecto: string;
  estatus: 'Activo' | 'Inactivo' | null;
}


export interface EjercicioFiscalCreateData {
  anio: number;
  fechaInicioEjercicio: string;
  fechaCierreEjercicio: string;
  fechaInicioCapturaProyecto: string;
  fechaCierreCapturaProyecto: string;
}

export interface EjercicioFiscalUpdateData {
  anio: number;
  fechaInicioEjercicio: string;
  fechaCierreEjercicio: string;
  fechaInicioCapturaProyecto: string;
  fechaCierreCapturaProyecto: string;
  estatus: 'Activo' | 'Inactivo';
}

export interface EjercicioFiscalStats {
  totalProyectos: number;
  montoTotal: number;
  proyectosEnProgreso: number;
  proyectosBorrador: number;
  proyectosCancelados: number;
  proyectosAprobados: number;
}