export interface ReporteConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  permissions: string[];
  category: 'Proyectos' | 'Indicadores' | 'Financiero' | 'Operativo';
  route?: string;
  comingSoon?: boolean;
  disabled?: boolean;
}

export interface ReporteDashboardStats {
  totalReportes: number;
  reportesDisponibles: number;
  ultimaActualizacion: string;
}

export interface ReporteCardProps {
  reporte: ReporteConfig;
  hasPermission: boolean;
  onReportClick: (reporte: ReporteConfig) => void;
}

export interface ReportesDashboardProps {
  className?: string;
}