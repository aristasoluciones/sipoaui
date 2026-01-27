import type { Proyecto } from '@/types/proyectos';
import type { 
  Rol, 
  Usuario, 
  Permiso
} from '@/types/usuarios';
import type { EjercicioFiscal, EjercicioFiscalStats } from '@/types/ejercicios';

// Configuración central de mocks para toda la aplicación
export const MOCK_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_USE_MOCKS === 'true',
  delays: {
    login: 1000,
    logout: 500,
    checkAuth: 500,
    api: 800,
  }
};

// Mock de usuarios con permisos detallados
export const MOCK_USERS = {
  admin: {
    id: 1,
    name: 'Administrador Demo',
    email: 'admin@demo.com',
    role: 'admin',
    permissions: [
      'catalogos.unidades.create', 'catalogos.unidades.read', 'catalogos.unidades.update', 'catalogos.unidades.delete',
      'catalogos.objetivos.create', 'catalogos.objetivos.read', 'catalogos.objetivos.update', 'catalogos.objetivos.delete',
      'catalogos.politicas.create', 'catalogos.politicas.read', 'catalogos.politicas.update', 'catalogos.politicas.delete',
      'catalogos.programas.create', 'catalogos.programas.read', 'catalogos.programas.update', 'catalogos.programas.delete',
      'catalogos.marco-normativo.create', 'catalogos.marco-normativo.read', 'catalogos.marco-normativo.update', 'catalogos.marco-normativo.delete',
      'catalogos.tipos-actividad.create', 'catalogos.tipos-actividad.read', 'catalogos.tipos-actividad.update', 'catalogos.tipos-actividad.delete',
      'catalogos.entregables.create', 'catalogos.entregables.read', 'catalogos.entregables.update', 'catalogos.entregables.delete',
      'catalogos.beneficiarios.create', 'catalogos.beneficiarios.read', 'catalogos.beneficiarios.update', 'catalogos.beneficiarios.delete',
      'catalogos.partidas.create', 'catalogos.partidas.read', 'catalogos.partidas.update', 'catalogos.partidas.delete',
      'catalogos.precios.create', 'catalogos.precios.read', 'catalogos.precios.update', 'catalogos.precios.delete',
      'catalogos.cargos.create', 'catalogos.cargos.read', 'catalogos.cargos.update', 'catalogos.cargos.delete',
      'catalogos.viaticos.create', 'catalogos.viaticos.read', 'catalogos.viaticos.update', 'catalogos.viaticos.delete',
      'catalogos.combustibles.create', 'catalogos.combustibles.read', 'catalogos.combustibles.update', 'catalogos.combustibles.delete',
      'proyectos.create', 'proyectos.read', 'proyectos.update', 'proyectos.delete', 'proyectos.manage'
    ]
  },
  user: {
    id: 2,
    name: 'Usuario Normal',
    email: 'user@demo.com',
    role: 'user',
    permissions: [
      'catalogos.unidades.read',
      'catalogos.objetivos.read', 'catalogos.objetivos.update',
      'catalogos.politicas.read',
      'catalogos.programas.read', 'catalogos.programas.update',
      'catalogos.marco-normativo.read',
      'catalogos.tipos-actividad.read', 'catalogos.tipos-actividad.update',
      'catalogos.entregables.read', 'catalogos.entregables.update',
      'catalogos.beneficiarios.read', 'catalogos.beneficiarios.update',
      'catalogos.partidas.read',
      'catalogos.precios.read',
      'catalogos.cargos.read',
      'catalogos.viaticos.read',
      'catalogos.combustibles.read',
      'proyectos.read', 'proyectos.update'
    ]
  },
  demo: {
    id: 3,
    name: 'Usuario Demo',
    email: 'demo@example.com',
    role: 'demo',
    permissions: [
      'catalogos.unidades.read',
      'catalogos.objetivos.read',
      'catalogos.politicas.read',
      'catalogos.programas.read',
      'catalogos.marco-normativo.read',
      'catalogos.tipos-actividad.read',
      'catalogos.entregables.read',
      'catalogos.beneficiarios.read',
      'catalogos.partidas.read',
      'catalogos.precios.read',
      'catalogos.cargos.read',
      'catalogos.viaticos.read',
      'catalogos.combustibles.read',
      'proyectos.read'
    ]
  }
};

// Mock de roles del sistema
export const MOCK_ROLES: Rol[] = [
  {
    id: 1,
    title: 'Super Administrador',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    permissions: ['*'], // Todos los permisos
    users_count: 1
  },
  {
    id: 2,
    title: 'Administrador',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-02-10T15:30:00Z',
    permissions: [
      'catalogos.create', 'catalogos.read', 'catalogos.update', 'catalogos.delete',
      'proyectos.create', 'proyectos.read', 'proyectos.update', 'proyectos.delete', 'proyectos.manage',
      'usuarios.read', 'usuarios.update',
      'reportes.generate', 'reportes.export'
    ],
    users_count: 3
  },
  {
    id: 3,
    title: 'Gestor de Proyectos',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-03-05T12:15:00Z',
    permissions: [
      'proyectos.create', 'proyectos.read', 'proyectos.update',
      'catalogos.read',
      'reportes.generate'
    ],
    users_count: 8
  },
  {
    id: 4,
    title: 'Usuario Consulta',
    created_at: '2024-01-15T10:00:00Z',
    permissions: [
      'proyectos.read',
      'catalogos.read',
      'reportes.view'
    ],
    users_count: 12
  },
  {
    id: 5,
    title: 'Gestor de Catálogos',
    created_at: '2024-02-01T09:00:00Z',
    updated_at: '2024-02-15T16:45:00Z',
    permissions: [
      'catalogos.create', 'catalogos.read', 'catalogos.update', 'catalogos.delete',
      'proyectos.read'
    ],
    users_count: 4
  }
];

// Mock de usuarios del sistema
export const MOCK_USUARIOS: Usuario[] = [
  {
    uuid: 'usr-001',
    nombre: 'Juan Carlos Pérez',
    email: 'juan.perez@sipoa.gob.mx',
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-09-10',
    roles: ['admin'],
    unidad: { id: 1, nombre: 'Dirección General' }
  },
  {
    uuid: 'usr-002',
    nombre: 'María González López',
    email: 'maria.gonzalez@sipoa.gob.mx',
    isActive: true,
    createdAt: '2024-02-01',
    updatedAt: '2024-08-20',
    roles: ['project_manager'],
    unidad: { id: 2, nombre: 'Unidad de Proyectos' }
  },
  {
    uuid: 'usr-003',
    nombre: 'Roberto Silva Mendoza',
    email: 'roberto.silva@sipoa.gob.mx',
    isActive: true,
    createdAt: '2024-02-15',
    updatedAt: '2024-07-30',
    roles: ['catalog_manager'],
    unidad: { id: 3, nombre: 'Unidad de Catálogos' }
  },
  {
    uuid: 'usr-004',
    nombre: 'Ana Patricia Ruiz',
    email: 'ana.ruiz@sipoa.gob.mx',
    isActive: false,
    createdAt: '2024-03-01',
    updatedAt: '2024-09-01',
    roles: ['viewer'],
    unidad: { id: 4, nombre: 'Unidad de Consultas' }
  },
  {
    uuid: 'usr-005',
    nombre: 'Carlos Alberto Torres',
    email: 'carlos.torres@sipoa.gob.mx',
    isActive: false,
    createdAt: '2024-03-15',
    updatedAt: '2024-08-15',
    roles: ['viewer'],
    unidad: { id: 5, nombre: 'Unidad de Reportes' }
  }
];

// Mock de categorías de permisos
// Mock simple de permisos para la API
export const MOCK_PERMISSIONS: Permiso[] = [
  // Módulo Proyectos (padre)
  { id: 1, name: 'proyectos', title: 'Proyectos', parent_id: null },
  { id: 2, name: 'proyectos.create', title: 'Crear Proyectos', parent_id: 1 },
  { id: 3, name: 'proyectos.read', title: 'Ver Proyectos', parent_id: 1 },
  { id: 4, name: 'proyectos.update', title: 'Editar Proyectos', parent_id: 1 },
  { id: 5, name: 'proyectos.delete', title: 'Eliminar Proyectos', parent_id: 1 },
  { id: 6, name: 'proyectos.manage', title: 'Gestionar Proyectos', parent_id: 1 },
  
  // Módulo Catálogos (padre)
  { id: 7, name: 'catalogos', title: 'Catálogos', parent_id: null },
  { id: 8, name: 'catalogos.create', title: 'Crear Catálogos', parent_id: 7 },
  { id: 9, name: 'catalogos.read', title: 'Ver Catálogos', parent_id: 7 },
  { id: 10, name: 'catalogos.update', title: 'Editar Catálogos', parent_id: 7 },
  { id: 11, name: 'catalogos.delete', title: 'Eliminar Catálogos', parent_id: 7 },
  
  // Módulo Usuarios (padre)
  { id: 12, name: 'usuarios', title: 'Usuarios', parent_id: null },
  { id: 13, name: 'usuarios.create', title: 'Crear Usuarios', parent_id: 12 },
  { id: 14, name: 'usuarios.read', title: 'Ver Usuarios', parent_id: 12 },
  { id: 15, name: 'usuarios.update', title: 'Editar Usuarios', parent_id: 12 },
  { id: 16, name: 'usuarios.delete', title: 'Eliminar Usuarios', parent_id: 12 },
  
  // Módulo Roles (padre)
  { id: 17, name: 'roles', title: 'Roles', parent_id: null },
  { id: 18, name: 'roles.create', title: 'Crear Roles', parent_id: 17 },
  { id: 19, name: 'roles.read', title: 'Ver Roles', parent_id: 17 },
  { id: 20, name: 'roles.update', title: 'Editar Roles', parent_id: 17 },
  { id: 21, name: 'roles.delete', title: 'Eliminar Roles', parent_id: 17 },
  
  // Módulo Reportes (padre)
  { id: 22, name: 'reportes', title: 'Reportes', parent_id: null },
  { id: 23, name: 'reportes.view', title: 'Ver Reportes', parent_id: 22 },
  { id: 24, name: 'reportes.generate', title: 'Generar Reportes', parent_id: 22 },
  { id: 25, name: 'reportes.export', title: 'Exportar Reportes', parent_id: 22 }
];

// Credenciales de autenticación mock
export const MOCK_CREDENTIALS = [
  { email: 'admin@demo.com', password: 'admin123', user: MOCK_USERS.admin },
  { email: 'user@demo.com', password: 'user123', user: MOCK_USERS.user },
  { email: 'demo@example.com', password: 'demo123', user: MOCK_USERS.demo }
];

// Mock de proyectos (ejemplo para futuras implementaciones)
export const MOCK_PROYECTOS = [
  {
    id: 1,
    nombre: 'Proyecto Demo 1',
    descripcion: 'Descripción del proyecto demo 1',
    estado: 'activo',
    fechaCreacion: '2025-01-01',
    responsable: MOCK_USERS.admin
  },
  {
    id: 2,
    nombre: 'Proyecto Demo 2',
    descripcion: 'Descripción del proyecto demo 2',
    estado: 'en_progreso',
    fechaCreacion: '2025-01-15',
    responsable: MOCK_USERS.user
  }
];

// Mock de personas (ejemplo para futuras implementaciones)
export const MOCK_PERSONAS = [
  {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@demo.com',
    telefono: '555-0001',
    puesto: 'Desarrollador'
  },
  {
    id: 2,
    nombre: 'María',
    apellido: 'González',
    email: 'maria.gonzalez@demo.com',
    telefono: '555-0002',
    puesto: 'Diseñadora'
  }
];

// Mock de catálogos - Organizacionales y Estratégicos
export const MOCK_CATALOGOS = {
  unidades: [
    {
      id: 1,
      nombre: 'Dirección General',
      codigo: 'DG001',
      descripcion: 'Unidad directiva principal',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-15',
      creadoPor: 'admin@demo.com',
      siglas: 'DG',
      responsable: 'Dr. Juan Pérez García',
      telefono: '555-0001',
      email: 'direccion.general@institucion.gob.mx'
    },
    {
      id: 2,
      nombre: 'Subdirección de Planeación',
      codigo: 'SP001',
      descripcion: 'Unidad encargada de la planeación estratégica',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-20',
      creadoPor: 'admin@demo.com',
      siglas: 'SP',
      responsable: 'Lic. María González López',
      telefono: '555-0002',
      email: 'planeacion@institucion.gob.mx'
    },
    {
      id: 3,
      nombre: 'Coordinación de Proyectos',
      codigo: 'CP001',
      descripcion: 'Unidad coordinadora de proyectos institucionales',
      estado: 'activo' as const,
      fechaCreacion: '2024-02-01',
      creadoPor: 'user@demo.com',
      siglas: 'CP',
      responsable: 'Ing. Carlos Ramírez Soto',
      telefono: '555-0003',
      email: 'proyectos@institucion.gob.mx'
    }
  ],

  objetivos: [
    {
      id: 1,
      nombre: 'Mejorar la Eficiencia Operativa',
      codigo: 'OE001',
      descripcion: 'Incrementar la eficiencia en todos los procesos operativos',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-10',
      creadoPor: 'admin@demo.com',
      prioridad: 'alta' as const,
      plazo: 'mediano' as const,
      indicadores: ['Tiempo de respuesta', 'Satisfacción del usuario', 'Reducción de costos']
    },
    {
      id: 2,
      nombre: 'Fortalecer la Transparencia',
      codigo: 'OE002',
      descripcion: 'Mejorar los mecanismos de transparencia y rendición de cuentas',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-15',
      creadoPor: 'admin@demo.com',
      prioridad: 'alta' as const,
      plazo: 'largo' as const,
      indicadores: ['Solicitudes atendidas', 'Tiempo de respuesta', 'Calidad de información']
    }
  ],

  politicas: [
    {
      id: 1,
      nombre: 'Política de Calidad',
      codigo: 'PC001',
      descripcion: 'Política institucional para asegurar la calidad en servicios',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-05',
      creadoPor: 'admin@demo.com',
      tipo: 'interna' as const,
      ambito: 'Institucional',
      vigencia: '2024-2027'
    },
    {
      id: 2,
      nombre: 'Política de Transparencia',
      codigo: 'PT001',
      descripcion: 'Lineamientos para garantizar la transparencia',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-08',
      creadoPor: 'admin@demo.com',
      tipo: 'externa' as const,
      ambito: 'Nacional',
      vigencia: '2024-2030'
    }
  ],

  programas: [
    {
      id: 1,
      nombre: 'Programa de Modernización',
      codigo: 'PM001',
      descripcion: 'Programa para modernizar procesos y sistemas',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-12',
      creadoPor: 'admin@demo.com',
      presupuesto: 5000000,
      duracion: '3 años',
      objetivos: ['Digitalización', 'Automatización', 'Capacitación']
    },
    {
      id: 2,
      nombre: 'Programa de Capacitación',
      codigo: 'PC001',
      descripcion: 'Programa de desarrollo de capacidades del personal',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-18',
      creadoPor: 'user@demo.com',
      presupuesto: 2000000,
      duracion: '2 años',
      objetivos: ['Formación técnica', 'Liderazgo', 'Habilidades blandas']
    }
  ],

  marcoNormativo: [
    {
      id: 1,
      nombre: 'Ley General de Transparencia',
      codigo: 'LGT2015',
      descripcion: 'Ley que regula el derecho de acceso a la información',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-01',
      creadoPor: 'admin@demo.com',
      tipo: 'ley' as const,
      numeroOficial: 'DOF 04/05/2015',
      fechaPublicacion: '2015-05-04',
      vigente: true
    },
    {
      id: 2,
      nombre: 'Manual de Procedimientos',
      codigo: 'MP001',
      descripcion: 'Manual de procedimientos administrativos',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-03',
      creadoPor: 'admin@demo.com',
      tipo: 'manual' as const,
      fechaPublicacion: '2024-01-01',
      vigente: true
    }
  ],

  tiposActividad: [
    {
      id: 1,
      nombre: 'Actividad de Supervisión',
      codigo: 'AS001',
      descripcion: 'Actividades relacionadas con supervisión y control',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-10',
      creadoPor: 'admin@demo.com',
      categoria: 'operativa' as const,
      subactividades: ['Inspección', 'Verificación', 'Monitoreo']
    },
    {
      id: 2,
      nombre: 'Actividad de Capacitación',
      codigo: 'AC001',
      descripcion: 'Actividades de formación y desarrollo',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-12',
      creadoPor: 'user@demo.com',
      categoria: 'estrategica' as const,
      subactividades: ['Cursos', 'Talleres', 'Seminarios']
    }
  ],

  entregables: [
    {
      id: 1,
      nombre: 'Informe Mensual',
      codigo: 'IM001',
      descripcion: 'Informe de actividades mensuales',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-15',
      creadoPor: 'admin@demo.com',
      tipo: 'informe' as const,
      formato: 'PDF',
      periodicidad: 'mensual' as const
    },
    {
      id: 2,
      nombre: 'Reporte Técnico',
      codigo: 'RT001',
      descripcion: 'Reporte técnico especializado',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-18',
      creadoPor: 'user@demo.com',
      tipo: 'documento' as const,
      formato: 'Word',
      periodicidad: 'unica' as const
    }
  ],

  beneficiarios: [
    {
      id: 1,
      nombre: 'Ciudadanos',
      codigo: 'CI001',
      descripcion: 'Ciudadanos en general',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-08',
      creadoPor: 'admin@demo.com',
      tipo: 'persona_fisica' as const,
      sector: 'Público general',
      region: 'Nacional'
    },
    {
      id: 2,
      nombre: 'Empresas',
      codigo: 'EM001',
      descripcion: 'Empresas del sector privado',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-10',
      creadoPor: 'user@demo.com',
      tipo: 'persona_moral' as const,
      sector: 'Privado',
      region: 'Nacional'
    }
  ],

  partidas: [
    {
      id: 1,
      nombre: 'Servicios Personales',
      codigo: '1000',
      descripcion: 'Gastos relacionados con personal',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-05',
      creadoPor: 'admin@demo.com',
      numero: '1000',
      capitulo: '1000',
      concepto: '1100',
      partida: '1131',
      presupuestoAsignado: 50000000
    },
    {
      id: 2,
      nombre: 'Materiales y Suministros',
      codigo: '2000',
      descripcion: 'Gastos en materiales y suministros',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-07',
      creadoPor: 'admin@demo.com',
      numero: '2000',
      capitulo: '2000',
      concepto: '2100',
      partida: '2111',
      presupuestoAsignado: 10000000
    }
  ],

  precios: [
    {
      id: 1,
      nombre: 'Gasolina Magna',
      codigo: 'GM001',
      descripcion: 'Precio de gasolina magna por litro',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-01',
      creadoPor: 'admin@demo.com',
      unidad: 'Litro',
      moneda: 'MXN' as const,
      precio: 24.50,
      vigencia: '2024'
    },
    {
      id: 2,
      nombre: 'Papelería Básica',
      codigo: 'PB001',
      descripcion: 'Kit básico de papelería por empleado',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-03',
      creadoPor: 'user@demo.com',
      unidad: 'Kit',
      moneda: 'MXN' as const,
      precio: 450.00,
      vigencia: '2024'
    }
  ],

  cargos: [
    {
      id: 1,
      nombre: 'Director General',
      codigo: 'DG001',
      descripcion: 'Puesto directivo máximo',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-01',
      creadoPor: 'admin@demo.com',
      nivel: 'Directivo',
      categoria: 'Confianza',
      salarioBase: 85000,
      prestaciones: ['Seguro médico', 'Vales de despensa', 'Automóvil']
    },
    {
      id: 2,
      nombre: 'Subdirector',
      codigo: 'SD001',
      descripcion: 'Puesto subdirectivo',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-02',
      creadoPor: 'admin@demo.com',
      nivel: 'Subdirectivo',
      categoria: 'Confianza',
      salarioBase: 65000,
      prestaciones: ['Seguro médico', 'Vales de despensa']
    }
  ],

  viaticos: [
    {
      id: 1,
      nombre: 'Zona Metropolitana',
      codigo: 'ZM001',
      descripcion: 'Viáticos para zona metropolitana',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-01',
      creadoPor: 'admin@demo.com',
      zona: 'Ciudad de México',
      montoDesayuno: 180,
      montoComida: 280,
      montoCena: 250,
      montoHospedaje: 1200
    },
    {
      id: 2,
      nombre: 'Zona Provincial',
      codigo: 'ZP001',
      descripcion: 'Viáticos para ciudades del interior',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-01',
      creadoPor: 'admin@demo.com',
      zona: 'Interior del País',
      montoDesayuno: 120,
      montoComida: 200,
      montoCena: 180,
      montoHospedaje: 800
    }
  ],

  combustibles: [
    {
      id: 1,
      nombre: 'Gasolina Magna CDMX',
      codigo: 'GM_CDMX',
      descripcion: 'Precio de gasolina magna en CDMX',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-01',
      creadoPor: 'admin@demo.com',
      tipo: 'magna' as const,
      precio: 24.50,
      region: 'Ciudad de México',
      fechaActualizacion: '2024-08-01'
    },
    {
      id: 2,
      nombre: 'Diesel Norte',
      codigo: 'DS_NORTE',
      descripcion: 'Precio de diesel en región norte',
      estado: 'activo' as const,
      fechaCreacion: '2024-01-01',
      creadoPor: 'admin@demo.com',
      tipo: 'diesel' as const,
      precio: 26.80,
      region: 'Norte del País',
      fechaActualizacion: '2024-08-01'
    }
  ]
};

// Utilidades para mocks
export const mockUtils = {
  // Simula delay de API
  delay: (ms: number = MOCK_CONFIG.delays.api) => 
    new Promise(resolve => setTimeout(resolve, ms)),
  
  // Valida credenciales
  validateCredentials: (email: string, password: string) => {
    return MOCK_CREDENTIALS.find(
      cred => cred.email === email && cred.password === password
    );
  },
  
  // Busca usuario por ID
  getUserById: (id: number) => {
    return Object.values(MOCK_USERS).find(user => user.id === id);
  },
  
  // Busca usuario por email
  getUserByEmail: (email: string) => {
    return Object.values(MOCK_USERS).find(user => user.email === email);
  },
  
  // Genera respuesta mock estándar
  mockResponse: <T>(data: T, success: boolean = true, message?: string) => ({
    success,
    data,
    message: message || (success ? 'Operación exitosa' : 'Error en la operación'),
    timestamp: new Date().toISOString()
  })
};

// Mock de ejercicios fiscales
export const MOCK_EJERCICIOS_FISCALES: EjercicioFiscal[] = [
  {
    id: 1,
    anio: 2024,
    fechaInicioEjercicio: '2024-01-01',
    fechaCierreEjercicio: '2024-12-31',
    fechaInicioCapturaProyecto: '2024-01-15',
    fechaCierreCapturaProyecto: '2024-11-30',
    estatus: 'Activo',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-09-15T10:30:00Z',
    totalProyectos: 45,
    montoTotal: 12500000,
    proyectosAprobados: 28,
    proyectosEnProgreso: 12,
    proyectosBorrador: 5,
    proyectosCancelados: 0
  },
  {
    id: 2,
    anio: 2025,
    fechaInicioEjercicio: '2025-01-01',
    fechaCierreEjercicio: '2025-12-31',
    fechaInicioCapturaProyecto: '2025-01-15',
    fechaCierreCapturaProyecto: '2025-11-30',
    estatus: 'Inactivo',
    createdAt: '2024-09-01T09:00:00Z',
    updatedAt: '2024-09-15T14:20:00Z',
    totalProyectos: 0,
    montoTotal: 0,
    proyectosAprobados: 0,
    proyectosEnProgreso: 0,
    proyectosBorrador: 0,
    proyectosCancelados: 0
  },
  {
    id: 3,
    anio: 2023,
    fechaInicioEjercicio: '2023-01-01',
    fechaCierreEjercicio: '2023-12-31',
    fechaInicioCapturaProyecto: '2023-01-15',
    fechaCierreCapturaProyecto: '2023-11-30',
    estatus: 'Inactivo',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-12-31T23:59:59Z',
    totalProyectos: 52,
    montoTotal: 18750000,
    proyectosAprobados: 48,
    proyectosEnProgreso: 2,
    proyectosBorrador: 2,
    proyectosCancelados: 0
  },
  {
    id: 4,
    anio: 2022,
    fechaInicioEjercicio: '2022-01-01',
    fechaCierreEjercicio: '2022-12-31',
    fechaInicioCapturaProyecto: '2022-01-15',
    fechaCierreCapturaProyecto: '2022-11-30',
    estatus: 'Inactivo',
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2022-12-31T23:59:59Z',
    totalProyectos: 38,
    montoTotal: 9500000,
    proyectosAprobados: 35,
    proyectosEnProgreso: 1,
    proyectosBorrador: 2,
    proyectosCancelados: 0
  }
];

// Estadísticas consolidadas de ejercicios fiscales
export const MOCK_EJERCICIOS_STATS: EjercicioFiscalStats = {
  totalProyectos: 135,
  montoTotal: 40750000,
  proyectosEnProgreso: 15,
  proyectosBorrador: 9,
  proyectosCancelados: 0,
  proyectosAprobados: 111
};

// Mock de POA (Programa Operativo Anual)
export const MOCK_POA = {
  id: 1,
  estatus: 'EnRevision', // Cambiar a 'Aprobado' o 'Captura' para probar diferentes estados
  proyecto: MOCK_PROYECTOS[0],
  actividades: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z'
};

// Hook para verificar si los mocks están habilitados
export const useMocks = () => MOCK_CONFIG.enabled;
