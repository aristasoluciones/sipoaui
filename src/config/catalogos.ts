import { CatalogoConfig } from '@/types/catalogos';

export const CATALOGOS_CONFIG: CatalogoConfig[] = [
  // Organizacionales y Estratégicos
  {
    key: 'unidades',
    title: 'Unidades Responsables',
    category: 'organizacional',
    icon: 'pi pi-building',
    route: '/catalogos/unidades',
    apiEndpoint: '/api/catalogos/unidades',
    permissions: ['catalogos.organizacionales_y_estrategicos.unidades_responsables'],
    columns: [
      { field: 'nombre', header: 'Nombre', sortable: true, filterable: false, type: 'text' },
      { field: 'codigo', header: 'Código', sortable: false, filterable: false, type: 'text' },
      { field: 'estado', header: 'Estado', sortable: false, filterable: false, type: 'select', 
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: true,
  },
  {
    key: 'objetivos',
    title: 'Objetivos Estratégicos',
    category: 'organizacional',
    icon: 'pi pi-book',
    route: '/catalogos/objetivos',
    apiEndpoint: '/api/catalogos/objetivos-estrategicos',
    permissions: ['catalogos.organizacionales_y_estrategicos.objetivos_estrategicos'],
    columns: [
      { field: 'nombre', header: 'Objetivo', sortable: true, filterable: true, type: 'text' },
      { field: 'estado', header: 'Estado', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: true,
  },
  {
    key: 'politicas',
    title: 'Políticas Institucionales',
    category: 'organizacional',
    icon: 'pi pi-book',
    route: '/catalogos/politicas',
    apiEndpoint: '/api/catalogos/politicas',
    permissions: ['catalogos.organizacionales_y_estrategicos.politicas_institucionales'],
    columns: [
      { field: 'nombre', header: 'Política', sortable: true, filterable: true, type: 'text' },
      { field: 'estado', header: 'Estado', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: true,
  },
  {
    key: 'programas',
    title: 'Programas Institucionales',
    category: 'organizacional',
    icon: 'pi pi-folder',
    route: '/catalogos/programas',
    apiEndpoint: '/api/catalogos/programas',
    permissions: ['catalogos.organizacionales_y_estrategicos.programas_institucionales'],
    columns: [
      { field: 'nombre', header: 'Programa', sortable: true, filterable: true, type: 'text' },
      { field: 'estado', header: 'Estado', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: true,
  },
  {
    key: 'marcoNormativo',
    title: 'Marco Normativo',
    category: 'organizacional',
    icon: 'pi pi-file',
    route: '/catalogos/marco-normativo',
    apiEndpoint: '/api/catalogos/marcos-normativos',
    permissions: ['catalogos.organizacionales_y_estrategicos.marco_normativo'],
    columns: [
      { field: 'nombre', header: 'Documento', sortable: true, filterable: true, type: 'text' },
      { field: 'descripcion', header: 'Descripción', sortable: false, filterable: false, type: 'textarea' },
      { field: 'estado', header: 'Estado', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: true,
  },
  
  // Planeación Técnica
  {
    key: 'tipos-actividad',
    title: 'Tipos de Actividad',
    category: 'planeacion',
    icon: 'pi pi-cog',
    route: '/catalogos/tipos-actividad',
    apiEndpoint: '/api/catalogos/tipos-actividad',
    permissions: ['catalogos.planeacion_tecnica.tipos_de_actividad_y_subactividad'],
    columns: [
      { field: 'nombre', header: 'Nombre', sortable: false, filterable: false, type: 'text' },
      { field: 'descripcion', header: 'Descripción', sortable: false, filterable: false, type: 'textarea' },
      { field: 'estado', header: 'Estado', sortable: false, filterable: false, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: true,
  },
  {
    key: 'entregables',
    title: 'Entregables',
    category: 'planeacion',
    icon: 'pi pi-inbox',
    route: '/catalogos/entregables',
    apiEndpoint: '/api/catalogos/entregables',
    permissions: ['catalogos.planeacion_tecnica.entregables'],
    columns: [
      { field: 'nombre', header: 'Nombre', sortable: true, filterable: true, type: 'text' },
      { field: 'descripcion', header: 'Descripción', sortable: false, filterable: false, type: 'textarea' },
      { field: 'estado', header: 'Estado', sortable: false, filterable: false, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: true,
  },
  {
    key: 'beneficiarios',
    title: 'Beneficiarios',
    category: 'planeacion',
    icon: 'pi pi-users',
    route: '/catalogos/beneficiarios',
    apiEndpoint: '/api/catalogos/beneficiarios',
    permissions: ['catalogos.planeacion_tecnica.beneficiarios'],
    columns: [
      { field: 'nombre', header: 'Nombre', sortable: false, filterable: false, type: 'text' },
      { field: 'estado', header: 'Estado', sortable: false, filterable: false, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: true,
  },

  // Recursos Humanos, Presupuestarios y Financieros
  {
    key: 'partidas',
    title: 'Partidas Presupuestarias',
    category: 'recursos',
    icon: 'pi pi-calculator',
    route: '/catalogos/partidas',
    apiEndpoint: '/api/catalogos/partidas',
    permissions: ['catalogos.recursos_humanos_presupuestarios_y_financieros.partidas_presupuestarias'],
    hasApiAccess: false,
    customComponent: true, // Catálogo con interfaz personalizada
  },
  {
    key: 'precios',
    title: 'Precios',
    category: 'recursos',
    icon: 'pi pi-dollar',
    route: '/catalogos/precios',
    apiEndpoint: '/api/catalogos/precios',
    permissions: ['catalogos.recursos_humanos_presupuestarios_y_financieros.precios'],
    hasApiAccess: false,
    customComponent: true, // Catálogo con interfaz personalizada
  },
  {
    key: 'cargos',
    title: 'Cargos y Puestos',
    category: 'recursos',
    icon: 'pi pi-id-card',
    route: '/catalogos/cargos',
    apiEndpoint: '/api/catalogos/cargos',
    permissions: ['catalogos.recursos_humanos_presupuestarios_y_financieros.cargos_y_puestos'],
    hasApiAccess: false,
    customComponent: true, // Catálogo con interfaz personalizada
  },

  // Tabuladores
  {
    key: 'viaticos',
    title: 'Viáticos',
    category: 'tabuladores',
    icon: 'pi pi-map',
    route: '/catalogos/viaticos',
    apiEndpoint: '/api/catalogos/viaticos',
    permissions: ['catalogos.tabuladores.viaticos'],
    hasApiAccess: false,
    customComponent: true, // Catálogo con interfaz personalizada
  },
  {
    key: 'combustibles',
    title: 'Combustibles',
    category: 'tabuladores',
    icon: 'pi pi-car',
    route: '/catalogos/combustibles',
    apiEndpoint: '/api/catalogos/combustibles',
    permissions: ['catalogos.tabuladores.combustibles'],
    hasApiAccess: false,
    customComponent: true, // Catálogo con interfaz personalizada
  }
];
