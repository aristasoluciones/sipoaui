import { CatalogoConfig } from '@/types/catalogos';

export const CATALOGOS_CONFIG: CatalogoConfig[] = [
  // Organizacionales y Estratégicos
  {
    key: 'unidades',
    title: 'Unidades Responsables',
    category: 'organizacional',
    icon: 'pi pi-building',
    route: '/catalogos/unidades',
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
    permissions: ['catalogos.organizacionales_y_estrategicos.politicas_institucionales'],
    columns: [
      { field: 'nombre', header: 'Política', sortable: true, filterable: true, type: 'text' },
      { field: 'codigo', header: 'Código', sortable: true, filterable: true, type: 'text' },
      { field: 'tipo', header: 'Tipo', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Interna', value: 'interna' }, { label: 'Externa', value: 'externa' }, { label: 'Mixta', value: 'mixta' }] },
      { field: 'ambito', header: 'Ámbito', sortable: true, filterable: true, type: 'text' },
      { field: 'vigencia', header: 'Vigencia', sortable: true, filterable: true, type: 'text' },
      { field: 'estado', header: 'Estado', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: false,
  },
  {
    key: 'programas',
    title: 'Programas Institucionales',
    category: 'organizacional',
    icon: 'pi pi-folder',
    route: '/catalogos/programas',
    permissions: ['catalogos.organizacionales_y_estrategicos.programas_institucionales'],
    columns: [
      { field: 'nombre', header: 'Programa', sortable: true, filterable: true, type: 'text' },
      { field: 'codigo', header: 'Código', sortable: true, filterable: true, type: 'text' },
      { field: 'duracion', header: 'Duración', sortable: true, filterable: true, type: 'text' },
      { field: 'presupuesto', header: 'Presupuesto', sortable: true, filterable: false, type: 'number' },
      { field: 'estado', header: 'Estado', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: false,
  },
  {
    key: 'marcoNormativo',
    title: 'Marco Normativo',
    category: 'organizacional',
    icon: 'pi pi-file',
    route: '/catalogos/marco-normativo',
    permissions: ['catalogos.organizacionales_y_estrategicos.marco_normativo'],
    columns: [
      { field: 'nombre', header: 'Documento', sortable: true, filterable: true, type: 'text' },
      { field: 'codigo', header: 'Código', sortable: true, filterable: true, type: 'text' },
      { field: 'tipo', header: 'Tipo', sortable: true, filterable: true, type: 'select',
        options: [
          { label: 'Ley', value: 'ley' }, 
          { label: 'Reglamento', value: 'reglamento' }, 
          { label: 'Norma', value: 'norma' },
          { label: 'Manual', value: 'manual' },
          { label: 'Procedimiento', value: 'procedimiento' }
        ] },
      { field: 'numeroOficial', header: 'No. Oficial', sortable: true, filterable: true, type: 'text' },
      { field: 'vigente', header: 'Vigente', sortable: true, filterable: true, type: 'boolean' },
      { field: 'estado', header: 'Estado', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: false,
  },
  
  // Planeación Técnica
  {
    key: 'tipos-actividad',
    title: 'Tipos de Actividad y Subactividad',
    category: 'planeacion',
    icon: 'pi pi-cog',
    route: '/catalogos/tipos-actividad',
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
    permissions: ['catalogos.planeacion_tecnica.entregables'],
    columns: [
      { field: 'nombre', header: 'Nombre', sortable: true, filterable: true, type: 'text' },
      { field: 'descripcion', header: 'Descripción', sortable: false, filterable: false, type: 'textarea' },
      { field: 'formato', header: 'Formato', sortable: false, filterable: false, type: 'select',
        options: [
          { label: 'Word', value: 'word' }, 
          { label: 'Excel', value: 'excel' }, 
          { label: 'Pdf', value: 'pdf' },
          { label: 'Imagen', value: 'imagen' }
        ] 
       },
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
    permissions: ['catalogos.recursos_humanos_presupuestarios_y_financieros.partidas_presupuestarias'],
    columns: [
      { field: 'nombre', header: 'Partida', sortable: true, filterable: true, type: 'text' },
      { field: 'numero', header: 'Número', sortable: true, filterable: true, type: 'text' },
      { field: 'capitulo', header: 'Capítulo', sortable: true, filterable: true, type: 'text' },
      { field: 'concepto', header: 'Concepto', sortable: true, filterable: true, type: 'text' },
      { field: 'presupuestoAsignado', header: 'Presupuesto', sortable: true, filterable: false, type: 'number' },
      { field: 'estado', header: 'Estado', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: false,
  },
  {
    key: 'precios',
    title: 'Precios',
    category: 'recursos',
    icon: 'pi pi-dollar',
    route: '/catalogos/precios',
    permissions: ['catalogos.recursos_humanos_presupuestarios_y_financieros.precios'],
    columns: [
      { field: 'nombre', header: 'Concepto', sortable: true, filterable: true, type: 'text' },
      { field: 'codigo', header: 'Código', sortable: true, filterable: true, type: 'text' },
      { field: 'precio', header: 'Precio', sortable: true, filterable: false, type: 'number' },
      { field: 'unidad', header: 'Unidad', sortable: true, filterable: true, type: 'text' },
      { field: 'moneda', header: 'Moneda', sortable: true, filterable: true, type: 'select',
        options: [
          { label: 'MXN', value: 'MXN' }, 
          { label: 'USD', value: 'USD' }, 
          { label: 'EUR', value: 'EUR' }
        ] },
      { field: 'vigencia', header: 'Vigencia', sortable: true, filterable: true, type: 'text' },
      { field: 'estado', header: 'Estado', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: false,
  },
  {
    key: 'cargos',
    title: 'Cargos y Puestos',
    category: 'recursos',
    icon: 'pi pi-id-card',
    route: '/catalogos/cargos',
    permissions: ['catalogos.recursos_humanos_presupuestarios_y_financieros.cargos_y_puestos'],
    columns: [
      { field: 'nombre', header: 'Cargo/Puesto', sortable: true, filterable: true, type: 'text' },
      { field: 'codigo', header: 'Código', sortable: true, filterable: true, type: 'text' },
      { field: 'nivel', header: 'Nivel', sortable: true, filterable: true, type: 'text' },
      { field: 'categoria', header: 'Categoría', sortable: true, filterable: true, type: 'text' },
      { field: 'salarioBase', header: 'Salario Base', sortable: true, filterable: false, type: 'number' },
      { field: 'estado', header: 'Estado', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: false,
  },

  // Tabuladores
  {
    key: 'viaticos',
    title: 'Viáticos',
    category: 'tabuladores',
    icon: 'pi pi-map',
    route: '/catalogos/viaticos',
    permissions: ['catalogos.tabuladores.viaticos'],
    columns: [
      { field: 'nombre', header: 'Zona', sortable: true, filterable: true, type: 'text' },
      { field: 'codigo', header: 'Código', sortable: true, filterable: true, type: 'text' },
      { field: 'zona', header: 'Descripción Zona', sortable: true, filterable: true, type: 'text' },
      { field: 'montoDesayuno', header: 'Desayuno', sortable: true, filterable: false, type: 'number' },
      { field: 'montoComida', header: 'Comida', sortable: true, filterable: false, type: 'number' },
      { field: 'montoCena', header: 'Cena', sortable: true, filterable: false, type: 'number' },
      { field: 'montoHospedaje', header: 'Hospedaje', sortable: true, filterable: false, type: 'number' },
      { field: 'estado', header: 'Estado', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo' }] }
    ],
    hasApiAccess: false,
  },
  {
    key: 'combustibles',
    title: 'Combustibles',
    category: 'tabuladores',
    icon: 'pi pi-car',
    route: '/catalogos/combustibles',
    permissions: ['catalogos.tabuladores.combustibles'],
    columns: [
      { field: 'nombre', header: 'Combustible', sortable: true, filterable: true, type: 'text' },
      { field: 'codigo', header: 'Código', sortable: true, filterable: true, type: 'text' },
      { field: 'tipo', header: 'Tipo', sortable: true, filterable: true, type: 'select',
        options: [
          { label: 'Magna', value: 'magna' }, 
          { label: 'Premium', value: 'premium' }, 
          { label: 'Diesel', value: 'diesel' }
        ] },
      { field: 'precio', header: 'Precio', sortable: true, filterable: false, type: 'number' },
      { field: 'region', header: 'Región', sortable: true, filterable: true, type: 'text' },
      { field: 'fechaActualizacion', header: 'Última Actualización', sortable: true, filterable: false, type: 'date' },
      { field: 'estado', header: 'Estado', sortable: true, filterable: true, type: 'select',
        options: [{ label: 'Activo', value: 'Activo' }, { label: 'Inactivo', value: 'Inactivo ' }] }
    ],
    hasApiAccess: false,
  }
];
