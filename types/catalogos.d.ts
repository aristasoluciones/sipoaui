// Estatus para los catálogos
export enum Estatus {
  Activo = 'Activo',
  Inactivo = 'Inactivo'
}


// 📥 API Response Types (snake_case)
export interface CatalogoItemApi {
  id: number;
  nombre: string;
  estatus: Estatus;
  created_at: string;
  updated_at?: string;
}

// 🏠 Domain Types (camelCase)
export interface CatalogoItem {
  id: number;
  nombre: string;
  estado: Estatus;
  createdAt: string;
  updatedAt?: string;
}

export interface UnidadResponsable extends CatalogoItem {
  descripcion: string;
}

export interface UnidadResponsableApi extends CatalogoItemApi {}

export interface ObjetivoEstrategico extends CatalogoItem{}

export interface ObjetivoEstrategicoApi extends CatalogoItemApi{}

export interface PoliticaInstitucional extends CatalogoItem{}

export interface PoliticaInstitucionalApi extends CatalogoItemApi{}

export interface ProgramaInstitucional extends CatalogoItem {
  presupuesto?: number;
  duracion: string;
  objetivos: string[];
}

export interface ProgramaInstitucionalApi extends CatalogoItemApi {
  presupuesto?: number;
  duracion: string;
  objetivos: string[];
}

export interface MarcoNormativo extends CatalogoItem {
  tipo: 'ley' | 'reglamento' | 'norma' | 'manual' | 'procedimiento';
  numeroOficial?: string;
  fechaPublicacion?: string;
  vigente: boolean;
}

export interface MarcoNormativoApi extends CatalogoItemApi {
  tipo: 'ley' | 'reglamento' | 'norma' | 'manual' | 'procedimiento';
  numero_oficial?: string;
  fecha_publicacion?: string;
  vigente: boolean;
}

export interface TipoActividad extends CatalogoItem {
  descripcion?: string;
}

export interface TipoActividadApi extends CatalogoItemApi {
  descripcion?: string;
}
export interface Entregable extends CatalogoItem {
  descripcion?: string;
  formato: string;
}

export interface EntregableApi extends CatalogoItemApi {
  descripcion?: string;
  formato: string;
}

export interface Beneficiario extends CatalogoItem {}

export interface BeneficiarioApi extends CatalogoItemApi {}

// Capítulo de Partidas Presupuestarias
export interface Capitulo extends CatalogoItem {
  codigo: string;
  descripcion?: string;
}

export interface CapituloApi extends CatalogoItemApi {
  codigo: string;
  descripcion?: string;
}

// Partida Presupuestaria (asociada a un capítulo)
export interface Partida extends CatalogoItem {
  capituloId: number;
  codigo: string;
  descripcion?: string;
}

export interface PartidaApi extends CatalogoItemApi {
  capitulo_id: number;
  codigo: string;
  descripcion?: string;
}

// Antigua definición de PartidaPresupuestaria (deprecada - usar Capitulo y Partida)
export interface PartidaPresupuestaria extends CatalogoItem {
  numero: string;
  capitulo: string;
  concepto: string;
  partida: string;
  presupuestoAsignado?: number;
}

export interface PartidaPresupuestariaApi extends CatalogoItemApi {
  numero: string;
  capitulo: string;
  concepto: string;
  partida: string;
  presupuesto_asignado?: number;
}

export interface Precio extends CatalogoItem {
  unidad: string;
  moneda: 'MXN' | 'USD' | 'EUR';
  precio: number;
  vigencia: string;
}

export interface PrecioApi extends CatalogoItemApi {
  unidad: string;
  moneda: 'MXN' | 'USD' | 'EUR';
  precio: number;
  vigencia: string;
}

export interface CargosPuestos extends CatalogoItem {
  nivel: string;
  categoria: string;
  salarioBase?: number;
  prestaciones?: string[];
}

export interface CargosPuestosApi extends CatalogoItemApi {
  nivel: string;
  categoria: string;
  salario_base?: number;
  prestaciones?: string[];
}

export interface Viatico extends CatalogoItem {
  zona: string;
  montoDesayuno: number;
  montoComida: number;
  montoCena: number;
  montoHospedaje: number;
}

export interface ViaticoApi extends CatalogoItemApi {
  zona: string;
  monto_desayuno: number;
  monto_comida: number;
  monto_cena: number;
  monto_hospedaje: number;
}

export interface Combustible extends CatalogoItem {
  tipo: 'magna' | 'premium' | 'diesel';
  precio: number;
  region: string;
  fechaActualizacion: string;
}

export interface CombustibleApi extends CatalogoItemApi {
  tipo: 'magna' | 'premium' | 'diesel';
  precio: number;
  region: string;
  fecha_actualizacion: string;
}

// Tipos para permisos
export interface Permission {
  module: string;
  action: 'create' | 'read' | 'update' | 'delete';
  allowed: boolean;
}

// Configuración de catálogos
export interface CatalogoConfig {
  key: string;
  title: string;
  category: 'organizacional' | 'planeacion' | 'recursos' | 'tabuladores';
  icon: string;
  route: string;
  apiEndpoint: string;
  columns?: ColumnConfig[];
  permissions: string[];
  hasApiAccess: boolean;
  customComponent?: boolean; // true para catálogos con UI personalizada
}

export interface ColumnConfig {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
  options?: { label: string; value: any }[];
}
