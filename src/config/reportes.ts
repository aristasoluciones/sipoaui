import type { ReporteConfig } from '@/types/reportes';

export const REPORTES_CONFIG: ReporteConfig[] = [
  // Cartera de Proyectos
  {
    id: 'cartera-proyectos',
    title: 'Cartera de Proyectos',
    description: 'Reporte general de todos los proyectos registrados en el sistema con su estado actual',
    icon: 'pi-briefcase',
    color: 'blue',
    permissions: ['centro_de_reportes.reportes.cartera_proyectos'],
    category: 'Proyectos',
    route: '/reportes/cartera-proyectos',
    comingSoon: true
  },

  // Indicadores
  {
    id: 'indicadores',
    title: 'Indicadores',
    description: 'Métricas y KPIs de desempeño de proyectos y cumplimiento de objetivos',
    icon: 'pi-chart-line',
    color: 'green',
    permissions: ['centro_de_reportes.reportes.indicadores_y_analisis.indicadores'],
    category: 'Indicadores',
    route: '/reportes/indicadores',
    disabled: true // Este reporte está completamente deshabilitado y no se mostrará
  },

  // Beneficiarios
  {
    id: 'beneficiarios',
    title: 'Beneficiarios',
    description: 'Análisis de población objetivo y beneficiarios atendidos por los proyectos',
    icon: 'pi-users',
    color: 'purple',
    permissions: ['centro_de_reportes.reportes.indicadores_y_analisis.beneficiarios'],
    category: 'Indicadores',
    route: '/reportes/beneficiarios',
    comingSoon: true
  },

  // Comparativos
  {
    id: 'comparativos',
    title: 'Comparativos',
    description: 'Comparación de resultados entre ejercicios fiscales y unidades responsables',
    icon: 'pi-chart-bar',
    color: 'cyan',
    permissions: ['centro_de_reportes.reportes.indicadores_y_analisis.comparativos'],
    category: 'Indicadores',
    route: '/reportes/comparativos',
    comingSoon: true
  },

  // Nóminas
  {
    id: 'nominas',
    title: 'Nóminas',
    description: 'Reporte de gastos de personal y nómina por proyecto y unidad responsable',
    icon: 'pi-money-bill',
    color: 'orange',
    permissions: ['centro_de_reportes.reportes.reportes_financieros.nominas'],
    category: 'Financiero',
    route: '/reportes/nominas',
    disabled: true
  },

  // Viáticos
  {
    id: 'viaticos',
    title: 'Viáticos',
    description: 'Control y seguimiento de gastos de viáticos y comisiones',
    icon: 'pi-car',
    color: 'teal',
    permissions: ['centro_de_reportes.reportes.reportes_financieros.viaticos'],
    category: 'Financiero',
    route: '/reportes/viaticos',
    comingSoon: true
  },

  // Combustibles
  {
    id: 'combustibles',
    title: 'Combustibles',
    description: 'Reporte de consumo y costos de combustible por proyecto y unidad',
    icon: 'pi-bolt',
    color: 'red',
    permissions: ['centro_de_reportes.reportes.reportes_financieros.combustibles'],
    category: 'Financiero',
    route: '/reportes/combustibles',
    comingSoon: true
  },

  // POA
  {
    id: 'poa',
    title: 'Programa Operativo Anual',
    description: 'Seguimiento del cumplimiento del POA y avance de objetivos',
    icon: 'pi-calendar',
    color: 'indigo',
    permissions: ['centro_de_reportes.reportes.reportes_operativos.programa_operativo_anual'],
    category: 'Operativo',
    route: '/reportes/poa',
    comingSoon: true
  },

  // Adquisiciones
  {
    id: 'adquisiciones',
    title: 'Adquisiciones',
    description: 'Reporte de compras, licitaciones y proceso de adquisiciones por proyecto',
    icon: 'pi-shopping-cart',
    color: 'pink',
    permissions: ['centro_de_reportes.reportes.reportes_operativos.adquisiciones'],
    category: 'Operativo',
    route: '/reportes/adquisiciones',
    comingSoon: true // Este reporte está completamente deshabilitado y no se mostrará
  }
];

export const CATEGORIAS_REPORTES = {
  Proyectos: {
    label: 'Cartera de Proyectos',
    icon: 'pi-briefcase',
    color: 'blue'
  },
  Indicadores: {
    label: 'Indicadores y Análisis',
    icon: 'pi-chart-line',
    color: 'green'
  },
  Financiero: {
    label: 'Reportes Financieros',
    icon: 'pi-dollar',
    color: 'orange'
  },
  Operativo: {
    label: 'Reportes Operativos',
    icon: 'pi-cog',
    color: 'purple'
  }
};