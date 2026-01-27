/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { ProgressBar } from 'primereact/progressbar';
import { getEtapaStatsKeys, PROYECTO_STAGES, getStageById, mapStageIdToStatsKey } from '@/src/config/proyectos';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { LayoutContext } from '../../layout/context/layoutcontext';
import { ChartData, ChartOptions } from 'chart.js';
import type { Proyecto } from '@/types/proyectos';



// Interfaces para el dashboard
interface UnidadMetricas {
  nombre: string;
  totalProyectos: number;
  presupuestoTotal: number;
  presupuestoEjecutado: number;
  promedioAvance: number;
  proyectosPorEtapa: {
    InformacionGeneral: number;
    DiagnosticoProblema: number;
    ProgramaOperativoAnual: number;
    EstimacionBeneficiarios: number;
    FormulacionCuantitativa: number;
  };
}

interface ResumenInstitucional {
  totalProyectos: number;
  presupuestoTotal: number;
  presupuestoEjecutado: number;
  avancePromedio: number;
  proyectosPorEstado: {
    borrador: number;
    en_progreso: number;
    revision: number;
    completado: number;
    suspendido: number;
    pausado: number;
    cancelado: number;
  };
}

const Dashboard = () => {
  const [ejercicioFiscal, setEjercicioFiscal] = useState<number>(2025);
  const [unidadesData, setUnidadesData] = useState<UnidadMetricas[]>([]);
  const [resumenInstitucional, setResumenInstitucional] = useState<ResumenInstitucional | null>(null);
  const [chartOptions, setChartOptions] = useState<ChartOptions>({});
  const { layoutConfig } = useContext(LayoutContext);

  // Opciones de ejercicio fiscal
  const ejercicioOptions = [
    { label: '2023', value: 2023 },
    { label: '2024', value: 2024 },
    { label: '2025', value: 2025 },
    { label: '2026', value: 2026 }
  ];

  // Datos simulados - en producción estos vendrían de una API
  const generarDatosSimulados = (año: number): { unidades: UnidadMetricas[], resumen: ResumenInstitucional } => {
    const unidades: UnidadMetricas[] = [
      {
        nombre: 'Dirección de Planeación',
        totalProyectos: 45,
        presupuestoTotal: 2500000,
        presupuestoEjecutado: 1800000,
        promedioAvance: 72,
        proyectosPorEtapa: { InformacionGeneral: 5, DiagnosticoProblema: 12, ProgramaOperativoAnual: 15, EstimacionBeneficiarios: 8, FormulacionCuantitativa: 5 }
      },
      {
        nombre: 'Secretaría de Obras Públicas',
        totalProyectos: 38,
        presupuestoTotal: 4200000,
        presupuestoEjecutado: 3100000,
        promedioAvance: 74,
        proyectosPorEtapa: { InformacionGeneral: 3, DiagnosticoProblema: 10, ProgramaOperativoAnual: 12, EstimacionBeneficiarios: 9, FormulacionCuantitativa: 4 }
      },
      {
        nombre: 'Dirección de Desarrollo Social',
        totalProyectos: 32,
        presupuestoTotal: 1800000,
        presupuestoEjecutado: 1200000,
        promedioAvance: 67,
        proyectosPorEtapa: { InformacionGeneral: 4, DiagnosticoProblema: 8, ProgramaOperativoAnual: 11, EstimacionBeneficiarios: 6, FormulacionCuantitativa: 3 }
      },
      {
        nombre: 'Secretaría de Educación',
        totalProyectos: 28,
        presupuestoTotal: 3500000,
        presupuestoEjecutado: 2400000,
        promedioAvance: 69,
        proyectosPorEtapa: { InformacionGeneral: 2, DiagnosticoProblema: 7, ProgramaOperativoAnual: 10, EstimacionBeneficiarios: 6, FormulacionCuantitativa: 3 }
      },
      {
        nombre: 'Dirección de Salud',
        totalProyectos: 25,
        presupuestoTotal: 2100000,
        presupuestoEjecutado: 1500000,
        promedioAvance: 71,
        proyectosPorEtapa: { InformacionGeneral: 3, DiagnosticoProblema: 6, ProgramaOperativoAnual: 8, EstimacionBeneficiarios: 5, FormulacionCuantitativa: 3 }
      }
    ];

    const resumen: ResumenInstitucional = {
      totalProyectos: unidades.reduce((sum, u) => sum + u.totalProyectos, 0),
      presupuestoTotal: unidades.reduce((sum, u) => sum + u.presupuestoTotal, 0),
      presupuestoEjecutado: unidades.reduce((sum, u) => sum + u.presupuestoEjecutado, 0),
      avancePromedio: Math.round(unidades.reduce((sum, u) => sum + u.promedioAvance, 0) / unidades.length),
      proyectosPorEstado: {
        borrador: 15,
        en_progreso: 89,
        revision: 23,
        completado: 31,
        suspendido: 4,
        pausado: 6,
        cancelado: 0
      }
    };

    return { unidades, resumen };
  };

  const applyChartTheme = () => {
    const isDark = layoutConfig.colorScheme === 'dark';
    
    const options: ChartOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: isDark ? '#ebedef' : '#495057'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: isDark ? '#ebedef' : '#495057'
          },
          grid: {
            color: isDark ? 'rgba(160, 167, 181, .3)' : '#ebedef'
          }
        },
        y: {
          ticks: {
            color: isDark ? '#ebedef' : '#495057'
          },
          grid: {
            color: isDark ? 'rgba(160, 167, 181, .3)' : '#ebedef'
          }
        }
      }
    };

    setChartOptions(options);
  };

  // Cargar datos cuando cambie el ejercicio fiscal
  useEffect(() => {
    const { unidades, resumen } = generarDatosSimulados(ejercicioFiscal);
    setUnidadesData(unidades);
    setResumenInstitucional(resumen);
  }, [ejercicioFiscal]);

  // Aplicar tema de gráficos
  useEffect(() => {
    applyChartTheme();
  }, [layoutConfig.colorScheme]);

  // Datos para gráfico de barras - Proyectos por Unidad
  const proyectosPorUnidadData: ChartData = {
    labels: unidadesData.map(u => u.nombre.split(' ').slice(0, 2).join(' ')),
    datasets: [
      {
        label: 'Total Proyectos',
        data: unidadesData.map(u => u.totalProyectos),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        borderColor: ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'],
        borderWidth: 1
      }
    ]
  };

  // Datos para gráfico de dona - Estados de Proyectos
  const estadosProyectosData: ChartData = {
    labels: ['En Progreso', 'Completados', 'Revisión', 'Borrador', 'Pausados', 'Suspendidos'],
    datasets: [
      {
        data: resumenInstitucional ? [
          resumenInstitucional.proyectosPorEstado.en_progreso,
          resumenInstitucional.proyectosPorEstado.completado,
          resumenInstitucional.proyectosPorEstado.revision,
          resumenInstitucional.proyectosPorEstado.borrador,
          resumenInstitucional.proyectosPorEstado.pausado,
          resumenInstitucional.proyectosPorEstado.suspendido
        ] : [],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#6B7280', '#EF4444', '#8B5CF6'],
        borderWidth: 2
      }
    ]
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getEstadoBadge = (cantidad: number, tipo: string) => {
    const severityMap: { [key: string]: "success" | "info" | "warning" | "danger" } = {
      completado: 'success',
      en_progreso: 'info',
      revision: 'warning',
      borrador: 'info',
      pausado: 'warning',
      suspendido: 'danger'
    };
    
    return (
      <Badge 
        value={cantidad} 
        severity={severityMap[tipo] || 'info'} 
        className="mr-2"
      />
    );
  };

  return (
    <div className="grid">
      {/* Header con filtro de ejercicio fiscal */}
      <div className="col-12">
        <div className="card">
          <div className="flex justify-content-between align-items-center">
            <div>
              <h2 className="text-2xl font-bold m-0">Dashboard SFPI</h2>
              <p className="text-600 m-0 mt-1">Sistema de Formulación de Proyectos Institucionales</p>
            </div>
            <div className="flex align-items-center gap-2">
              <label htmlFor="ejercicio" className="font-medium">Ejercicio Fiscal:</label>
              <Dropdown
                id="ejercicio"
                value={ejercicioFiscal}
                options={ejercicioOptions}
                onChange={(e) => setEjercicioFiscal(e.value)}
                className="w-8rem"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Métricas institucionales */}
      {resumenInstitucional && (
        <>
          <div className="col-12 lg:col-3">
            <div className="card mb-0">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">Total Proyectos</span>
                  <div className="text-900 font-medium text-xl">{resumenInstitucional.totalProyectos}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-briefcase text-blue-500 text-xl" />
                </div>
              </div>
              <span className="text-blue-500 font-medium">{resumenInstitucional.avancePromedio}% </span>
              <span className="text-500">avance promedio</span>
            </div>
          </div>

          <div className="col-12 lg:col-3">
            <div className="card mb-0">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">Presupuesto Total</span>
                  <div className="text-900 font-medium text-xl">{formatCurrency(resumenInstitucional.presupuestoTotal)}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-green-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-dollar text-green-500 text-xl" />
                </div>
              </div>
              <span className="text-green-500 font-medium">{formatCurrency(resumenInstitucional.presupuestoEjecutado)} </span>
              <span className="text-500">ejecutado</span>
            </div>
          </div>

          <div className="col-12 lg:col-3">
            <div className="card mb-0">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">Proyectos Activos</span>
                  <div className="text-900 font-medium text-xl">{resumenInstitucional.proyectosPorEstado.en_progreso}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-clock text-orange-500 text-xl" />
                </div>
              </div>
              <span className="text-orange-500 font-medium">{resumenInstitucional.proyectosPorEstado.revision} </span>
              <span className="text-500">en revisión</span>
            </div>
          </div>

          <div className="col-12 lg:col-3">
            <div className="card mb-0">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">Proyectos Completados</span>
                  <div className="text-900 font-medium text-xl">{resumenInstitucional.proyectosPorEstado.completado}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-check-circle text-cyan-500 text-xl" />
                </div>
              </div>
              <span className="text-cyan-500 font-medium">
                {formatPercentage((resumenInstitucional.proyectosPorEstado.completado / resumenInstitucional.totalProyectos) * 100)} 
              </span>
              <span className="text-500">del total</span>
            </div>
          </div>
        </>
      )}

      {/* Gráficos */}
      <div className="col-12 xl:col-8">
        <div className="card">
          <div className="flex justify-content-between align-items-center mb-5">
            <h5>Proyectos por Unidad Responsable</h5>
            <Badge value={`${ejercicioFiscal}`} severity="info" />
          </div>
          <Chart type="bar" data={proyectosPorUnidadData} options={chartOptions} height="300px" />
        </div>
      </div>

      <div className="col-12 xl:col-4">
        <div className="card">
          <h5>Estado de Proyectos</h5>
          <Chart type="doughnut" data={estadosProyectosData} options={{ maintainAspectRatio: false }} height="300px" />
        </div>
      </div>

      {/* Top 5 Unidades */}
      <div className="col-12 xl:col-6">
        <div className="card">
          <h5>Top 5 Unidades con Más Proyectos</h5>
          <DataTable value={unidadesData.slice(0, 5)} responsiveLayout="scroll">
            <Column 
              field="nombre" 
              header="Unidad" 
              style={{ width: '40%' }}
              body={(rowData) => (
                <div>
                  <div className="font-medium">{rowData.nombre}</div>
                  <div className="text-sm text-600">{rowData.totalProyectos} proyectos</div>
                </div>
              )}
            />
            <Column 
              header="Presupuesto" 
              style={{ width: '30%' }}
              body={(rowData) => (
                <div>
                  <div className="font-medium">{formatCurrency(rowData.presupuestoTotal)}</div>
                  <div className="text-sm text-600">{formatCurrency(rowData.presupuestoEjecutado)} ejecutado</div>
                </div>
              )}
            />
            <Column 
              header="Avance" 
              style={{ width: '30%' }}
              body={(rowData) => (
                <div>
                  <div className="mb-2">{rowData.promedioAvance}%</div>
                  <ProgressBar value={rowData.promedioAvance} className="h-1rem" />
                </div>
              )}
            />
          </DataTable>
        </div>
      </div>

      {/* Presupuesto por Unidad */}
      <div className="col-12 xl:col-6">
        <div className="card">
          <h5>Presupuesto por Unidad Responsable</h5>
          <div className="space-y-3">
            {unidadesData.map((unidad, index) => {
              const porcentajeEjecucion = (unidad.presupuestoEjecutado / unidad.presupuestoTotal) * 100;
              return (
                <div key={index} className="border-bottom-1 surface-border pb-3 mb-3">
                  <div className="flex justify-content-between align-items-center mb-2">
                    <span className="font-medium text-900">{unidad.nombre}</span>
                    <span className="text-600">{formatPercentage(porcentajeEjecucion)}</span>
                  </div>
                  <div className="flex justify-content-between align-items-center mb-2">
                    <span className="text-sm text-600">
                      {formatCurrency(unidad.presupuestoEjecutado)} / {formatCurrency(unidad.presupuestoTotal)}
                    </span>
                    <span className="text-sm font-medium">{unidad.totalProyectos} proyectos</span>
                  </div>
                  <ProgressBar 
                    value={porcentajeEjecucion} 
                    className="h-1rem"
                    color={porcentajeEjecucion > 75 ? '#10B981' : porcentajeEjecucion > 50 ? '#F59E0B' : '#EF4444'}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resumen de Etapas */}
      <div className="col-12">
        <div className="card">
          <h5>Proyectos por Etapa de Desarrollo</h5>
          <div className="grid">
            {unidadesData.map((unidad, index) => (
              <div key={index} className="col-12 md:col-6 lg:col-4">
                <div className="border-1 surface-border border-round p-3">
                  <h6 className="mt-0 mb-3">{unidad.nombre}</h6>
                  <div className="grid text-center">
                    {PROYECTO_STAGES.map((stage) => {
                      const statsKey = mapStageIdToStatsKey(stage.id);
                      return (
                        <div key={stage.id} className="col">
                          <div className="text-900 font-bold">
                            {unidad.proyectosPorEtapa[statsKey as keyof typeof unidad.proyectosPorEtapa]}
                          </div>
                          <div className="text-xs text-600">{stage.shortLabel}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
