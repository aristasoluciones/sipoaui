'use client';

import React, { useState, useMemo } from 'react';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Badge } from 'primereact/badge';
import { useRouter } from 'next/navigation';

// Components
import { PermissionGuard } from '@/src/components/PermissionGuard';
import { PageAccessDenied } from '@/src/components/AccessDeneid';
import { ReportCard } from '@/src/components/reportes';

// Configuration and Types
import { REPORTES_CONFIG, CATEGORIAS_REPORTES } from '@/src/config/reportes';
import type { ReporteConfig } from '@/types/reportes';

// Hooks
import { usePermissions } from '@/src/hooks/usePermissions';

const ReportesPage: React.FC = () => {
  const router = useRouter();
  const { hasAnyPermission } = usePermissions();
  
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Breadcrumb
  const breadcrumbItems = [
    { label: 'Centro de Reportes', command: () => window.location.href = '/reportes', className: 'text-primary font-medium' },
    { label: 'Reportes' }
  ];
  const breadcrumbHome = { icon: 'pi pi-home', url: '/' };

  // Opciones para filtro de categorías
  const categoryOptions = [
    { label: 'Todas las categorías', value: 'all' },
    ...Object.entries(CATEGORIAS_REPORTES).map(([key, value]) => ({
      label: value.label,
      value: key
    }))
  ];

  // Filtrar reportes por búsqueda y categoría
  const filteredReportes = useMemo(() => {
    let filtered = REPORTES_CONFIG;

    // Excluir reportes deshabilitados
    filtered = filtered.filter(reporte => !reporte.disabled);

    // Filtro por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(reporte => reporte.category === selectedCategory);
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reporte =>
        reporte.title.toLowerCase().includes(term) ||
        reporte.description.toLowerCase().includes(term) ||
        reporte.category.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [searchTerm, selectedCategory]);

  // Verificar permisos para cada reporte
  const reportesWithPermissions = useMemo(() => {
    return filteredReportes.map(reporte => ({
      ...reporte,
      hasPermission: hasAnyPermission(reporte.permissions)
    }));
  }, [filteredReportes, hasAnyPermission]);

  // Estadísticas del dashboard
  const stats = useMemo(() => {
    const reportesActivos = REPORTES_CONFIG.filter(reporte => !reporte.disabled);
    const totalReportes = reportesActivos.length;
    const reportesConPermiso = reportesActivos.filter(reporte => 
      hasAnyPermission(reporte.permissions)
    ).length;
    const reportesProximamente = reportesActivos.filter(reporte => reporte.comingSoon).length;
    
    return {
      totalReportes,
      reportesConPermiso,
      reportesSinPermiso: totalReportes - reportesConPermiso,
      reportesProximamente
    };
  }, [hasAnyPermission]);

  // Manejar click en reporte
  const handleReportClick = (reporte: ReporteConfig) => {
    if (reporte.route) {
      router.push(reporte.route);
    } else {
      // Por ahora, mostrar mensaje de que no está implementado
      console.log(`Navegando a reporte: ${reporte.title}`);
    }
  };

  // Agrupar reportes por categoría para mostrar secciones
  const reportesPorCategoria = useMemo(() => {
    const grupos: { [key: string]: (ReporteConfig & { hasPermission: boolean })[] } = {};
    
    reportesWithPermissions.forEach(reporte => {
      if (!grupos[reporte.category]) {
        grupos[reporte.category] = [];
      }
      grupos[reporte.category].push(reporte);
    });
    
    return grupos;
  }, [reportesWithPermissions]);

  // Verificar permiso general para acceder a la sección de reportes
  if (!hasAnyPermission(['centro_de_reportes.reportes'])) {
    return <PageAccessDenied />;
  }

  return (
    <PermissionGuard permissions={['reportes.read']} fallback={<PageAccessDenied />}>
      <div className="grid">
        {/* Breadcrumb */}
        <div className="col-12">
          <BreadCrumb
            model={breadcrumbItems}
            home={breadcrumbHome}
            className="mb-4"
          />
          {
            /* Header con estadísticas */}
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-4">
                <div className="flex align-items-center">
                    <i className={`pi pi-report text-3xl text-primary mr-2`}></i>
                    <div>
                        <h2 className="text-2xl font-bold text-900 m-0">Reportes disponibles</h2>
                        <p className="text-600 m-0">Reportes disponibles para su visualización y análisis.</p>
                </div>
                </div>
                <div className="flex gap-4 mt-3 md:mt-0">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalReportes}</div>
                        <div className="text-sm text-500">Total Reportes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.reportesConPermiso}</div>
                        <div className="text-sm text-500">Disponibles</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{stats.reportesSinPermiso}</div>
                        <div className="text-sm text-500">Restringidos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.reportesProximamente}</div>
                        <div className="text-sm text-500">Próximamente</div>
                    </div>
                </div>
            </div>
        </div>

        

        {/* Filtros */}
        <div className="col-12">
          <Card className="mb-4">
            <div className="flex flex-column md:flex-row gap-3 align-items-center">
              <div className="flex-1">
                <span className="p-input-icon-left w-full">
                  <i className="pi pi-search" />
                  <InputText
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar reportes..."
                    className="w-full"
                  />
                </span>
              </div>
              <Dropdown
                value={selectedCategory}
                options={categoryOptions}
                onChange={(e) => setSelectedCategory(e.value)}
                placeholder="Filtrar por categoría"
                className="w-full md:w-auto"
              />
            </div>
          </Card>
        </div>

        {/* Reportes agrupados por categoría */}
        {selectedCategory === 'all' ? (
          // Mostrar por categorías cuando no hay filtro específico
          Object.entries(reportesPorCategoria).map(([categoria, reportes]) => (
            <div key={categoria} className="col-12">
              <div className="flex align-items-center gap-3 mb-3">
                <i className={`pi ${CATEGORIAS_REPORTES[categoria as keyof typeof CATEGORIAS_REPORTES]?.icon} text-2xl text-${CATEGORIAS_REPORTES[categoria as keyof typeof CATEGORIAS_REPORTES]?.color}-500`}></i>
                <h3 className="text-xl font-semibold text-900 m-0">
                  {CATEGORIAS_REPORTES[categoria as keyof typeof CATEGORIAS_REPORTES]?.label}
                </h3>
                <Badge 
                  value={reportes.length} 
                  severity="info"
                />
              </div>
              
              <div className="grid">
                {reportes.map(reporte => (
                  <div key={reporte.id} className="col-12 md:col-6 lg:col-4 xl:col-3">
                    <ReportCard
                      reporte={reporte}
                      hasPermission={reporte.hasPermission}
                      onReportClick={handleReportClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // Mostrar solo la categoría seleccionada
          <div className="col-12">
            <div className="grid">
              {reportesWithPermissions.map(reporte => (
                <div key={reporte.id} className="col-12 md:col-6 lg:col-4 xl:col-3">
                  <ReportCard
                    reporte={reporte}
                    hasPermission={reporte.hasPermission}
                    onReportClick={handleReportClick}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay resultados */}
        {filteredReportes.length === 0 && (
          <div className="col-12">
            <Card>
              <div className="text-center p-5">
                <i className="pi pi-search text-4xl text-400 mb-3"></i>
                <h4 className="text-500">No se encontraron reportes</h4>
                <p className="text-600">
                  Prueba con otros términos de búsqueda o selecciona una categoría diferente
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default ReportesPage;