'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { ProgressSpinner } from 'primereact/progressspinner';
import { CatalogoService } from '@/src/services/catalogos.service';
import { TiposProyectoService } from '@/src/services/tiposProyecto.service';
import { Proyecto, Prioridad } from '@/types/proyectos.d';

interface ProyectoStageGeneralViewProps {
  visible: boolean;
  onHide: () => void;
  project: Proyecto;
}

const ProyectoStageGeneralView: React.FC<ProyectoStageGeneralViewProps> = ({
  visible,
  onHide,
  project
}) => {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [tiposProyecto, setTiposProyecto] = useState<any[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // Cargar datos de catálogos para mostrar nombres en lugar de IDs
  useEffect(() => {
    const loadCatalogos = async () => {
      setLoadingCatalogos(true);
      try {
        // Cargar unidades desde catálogo
        const unidadesService = new CatalogoService('unidades');
        const unidadesData = await unidadesService.getAll();
        setUnidades(Array.isArray(unidadesData) ? unidadesData : []);

        // Usar mocks para empleados y tipos de proyecto (igual que en el componente de edición)
        setEmpleados([
          { id: 1, nombre: 'Juan Pérez' },
          { id: 2, nombre: 'María García' },
          { id: 3, nombre: 'Carlos López' },
          { id: 4, nombre: 'Ana Martínez' },
          { id: 5, nombre: 'Pedro Sánchez' }
        ]);

        // Cargar tipos de proyecto desde el API
        const tiposData = await TiposProyectoService.getAll();
        setTiposProyecto(Array.isArray(tiposData) ? tiposData : []);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      } finally {
        setLoadingCatalogos(false);
      }
    };

    if (visible) {
      loadCatalogos();
    }
  }, [visible]);

  // Función para obtener el nombre de la prioridad
  const getPrioridadLabel = (prioridad: string) => {
    switch (prioridad) {
      case Prioridad.CRITICA: return 'Crítica';
      case Prioridad.ALTA: return 'Alta';
      case Prioridad.MEDIA: return 'Media';
      case Prioridad.BAJA: return 'Baja';
      default: return prioridad;
    }
  };

  // Función para obtener el color de la prioridad
  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case Prioridad.CRITICA: return 'red';
      case Prioridad.ALTA: return 'orange';
      case Prioridad.MEDIA: return 'yellow';
      case Prioridad.BAJA: return 'green';
      default: return 'gray';
    }
  };

  // Función para obtener el nombre de la unidad
  const getUnidadNombre = (unidadId: number | null) => {
    if (!unidadId) return 'No especificada';
    if (!unidades || !Array.isArray(unidades)) return 'Cargando...';
    const unidad = unidades.find(u => u.id === unidadId);
    return unidad ? unidad.nombre : 'Unidad no encontrada';
  };

  // Función para obtener el nombre del responsable
  const getResponsableNombre = (responsableId: number | null) => {
    if (!responsableId) return 'No especificado';
    if (!empleados || !Array.isArray(empleados)) return 'Cargando...';
    const empleado = empleados.find(e => e.id === responsableId);
    return empleado ? empleado.nombre : 'Responsable no encontrado';
  };

  // Función para obtener el nombre del tipo de proyecto
  const getTipoProyectoNombre = (tipoProyectoId: number | null) => {
    if (!tipoProyectoId) return 'No especificado';
    if (!tiposProyecto || !Array.isArray(tiposProyecto)) return 'Cargando...';
    const tipo = tiposProyecto.find(t => t.id === tipoProyectoId);
    return tipo ? tipo.nombre : 'Tipo no encontrado';
  };

  // Encabezado del sidebar
  const customHeader = () => {
    return (
      <div className="flex align-items-center gap-2 py-2">
        <i className="pi pi-eye text-xl text-primary-600"></i>
        <h3 className="text-lg font-semibold text-900 m-0">Información General del Proyecto</h3>
      </div>
    );
  };

  return (
    <Sidebar
      visible={visible}
      onHide={onHide}
      position="right"
      className="w-full md:w-4"
      header={customHeader()}
      modal
      pt={{
        header: { className: 'border-bottom-1 surface-border' },
        content: { className: 'p-0' }
      }}
    >
      <div className="h-full flex flex-column">
        {/* Contenido principal */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loadingCatalogos ? (
            <div className="flex justify-content-center align-items-center h-20rem">
              <ProgressSpinner />
            </div>
          ) : (
            <div className="flex flex-column gap-3">

              {/* Código del Proyecto */}
              <div className="bg-blue-50 border-round p-2 border-1 border-blue-200">
                <label className="block font-medium text-700 mb-2">Código del Proyecto</label>
                <div className="text-900 font-medium text-lg">{project.codigo || 'No especificado'}</div>
              </div>

              {/* Ejercicio Fiscal */}
              <div className="bg-blue-50 border-round p-2 border-1 border-blue-200">
                <label className="block font-medium text-700 mb-2">Ejercicio Fiscal</label>
                <div className="text-900 font-medium text-lg">{project.ejercicioFiscal || 'No especificado'}</div>
              </div>

              {/* Nombre del Proyecto */}
              <div className="bg-blue-50 border-round p-2 border-1 border-blue-200">
                <label className="block font-medium text-700 mb-2">Nombre del Proyecto</label>
                <div className="text-900 font-medium text-lg">{project.nombre || 'No especificado'}</div>
              </div>

              {/* Descripción */}
              

              {/* Unidad Responsable */}
              <div className="bg-blue-50 border-round p-2 border-1 border-blue-200">
                <label className="block font-medium text-700 mb-2">Unidad Responsable</label>
                <div className="text-900 font-medium text-lg">{getUnidadNombre(project.unidad?.id || null)}</div>
              </div>

              {/* Responsable del Proyecto */}
              <div className="bg-blue-50 border-round p-2 border-1 border-blue-200">
                <label className="block font-medium text-700 mb-2">Responsable del Proyecto</label>
                <div className="text-900 font-medium text-lg">{getResponsableNombre(project.responsable?.id || null)}</div>
              </div>

              {/* Tipo de Proyecto */}
              <div className="bg-blue-50 border-round p-2 border-1 border-blue-200">
                <label className="block font-medium text-700 mb-2">Tipo de Proyecto</label>
                <div className="text-900 font-medium text-lg">{getTipoProyectoNombre(project.tipoProyecto?.id || null)}</div>
              </div>

              {/* Prioridad */}
              <div className="bg-blue-50 border-round p-2 border-1 border-blue-200">
                <label className="block font-medium text-700 mb-2">Prioridad</label>
                <div className="flex align-items-center gap-2">
                  <Chip
                    label={getPrioridadLabel(project.prioridad)}
                    className={`bg-${getPrioridadColor(project.prioridad)}-500 text-white`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botón de cerrar */}
        <div className="p-3 border-top-1 surface-border bg-surface-50">
          <div className="flex justify-content-end">
            <Button
              label="Cerrar"
              icon="pi pi-times"
              severity="secondary"
              onClick={onHide}
            />
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default ProyectoStageGeneralView;