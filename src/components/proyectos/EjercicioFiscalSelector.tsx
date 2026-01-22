'use client';

import React from 'react';
import { Badge } from 'primereact/badge';
import { Dropdown } from 'primereact/dropdown';
import { EjercicioFiscal } from '@/types/ejercicios';

// Utilidades para determinar el estatus de ejercicios fiscales
const isEjercicioFiscalCerrado = (ejercicioFiscal: EjercicioFiscal): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return ejercicioFiscal.fechaCierreEjercicio < today;
};

const isEjercicioFiscalInactivo = (ejercicioFiscal: EjercicioFiscal): boolean => {
  return ejercicioFiscal.estatus === 'Inactivo';
};

const permiteCapturaProyectos = (ejercicioFiscal: EjercicioFiscal): boolean => {
  // Si el ejercicio está inactivo, no permite captura
  if (isEjercicioFiscalInactivo(ejercicioFiscal)) {
    return false;
  }
  
  const today = new Date().toISOString().split('T')[0];
  return ejercicioFiscal.fechaInicioCapturaProyecto <= today &&
         ejercicioFiscal.fechaCierreCapturaProyecto >= today;
};


interface EjercicioFiscalSelectorProps {
  selectedEjercicioFiscal: number | null;
  ejerciciosFiscales: EjercicioFiscal[];
  onEjercicioFiscalChange: (id: number) => void;
  showBanner?: boolean; // Renombrado de showWizard para mejor claridad
  totalProjects?: number;
}

const EjercicioFiscalSelector: React.FC<EjercicioFiscalSelectorProps> = ({
  selectedEjercicioFiscal,
  ejerciciosFiscales,
  onEjercicioFiscalChange,
  showBanner = true, // Por defecto se muestra
  totalProjects = 0
}) => {
  const selectedEjercicio = ejerciciosFiscales.find(e => e.id === selectedEjercicioFiscal);

  // Si showBanner es false, no mostrar nada
  if (!showBanner) {
    return null;
  }

  return (
    <div className="card mb-3" style={{background: 'var(--primary-50)', borderColor: 'var(--primary-200)'}}>
      {/* Header principal */}
      <div className="flex flex-column sm:flex-row justify-content-between align-items-start sm:align-items-center gap-3">
        <div className="flex flex-column gap-2 flex-1">
          <h2 className="text-xl font-bold text-900 m-0">Proyectos del Ejercicio Fiscal</h2>
          
          {/* Año y total de proyectos - siempre visibles */}
          <div className="flex flex-wrap align-items-center gap-2">
            <div className="flex align-items-center gap-2">
              <span className="font-semibold text-primary-700">Año:</span>
              <span className="text-2xl font-bold text-primary-800">{selectedEjercicio?.anio || 'Cargando...'}</span>
            </div>
            <div className="flex align-items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 border-round">
              <i className="pi pi-folder text-sm"></i>
              <span className="text-sm font-medium">
                {totalProjects} proyecto{totalProjects !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Dropdown selector - derecha en desktop, abajo en mobile */}
        <div className="flex flex-column gap-2 w-full sm:w-auto">
          <label htmlFor="ejercicio-fiscal-header-select" className="font-semibold text-700">
            Cambiar Ejercicio Fiscal
          </label>
          <Dropdown
            id="ejercicio-fiscal-header-select"
            value={selectedEjercicioFiscal}
            options={ejerciciosFiscales.map(e => ({
              label: e.anio.toString(),
              value: e.id
            }))}
            onChange={(e) => onEjercicioFiscalChange(e.value)}
            placeholder="Seleccionar año"
            className="w-full sm:w-12rem"
            showClear={false}
          />
        </div>
      </div>

      {/* Badges de estado - Se colapsan en mobile */}
      {selectedEjercicio && (
        <div className="flex flex-wrap gap-2">
          {/* Badge de ejercicio activo/inactivo - prioridad visual */}
          <Badge
            value={isEjercicioFiscalInactivo(selectedEjercicio) ? "Ejercicio Inactivo" : "Ejercicio Activo"}
            severity={isEjercicioFiscalInactivo(selectedEjercicio) ? "danger" : "success"}
          />
          
          {/* Badge de ejercicio cerrado/abierto */}
          <Badge
            value={isEjercicioFiscalCerrado(selectedEjercicio) ? "Ejercicio Cerrado" : "Ejercicio Abierto"}
            severity={isEjercicioFiscalCerrado(selectedEjercicio) ? "warning" : "info"}
          />
          
          {/* Badge de captura - muestra inactivo si el ejercicio está inactivo */}
          <Badge
            value={permiteCapturaProyectos(selectedEjercicio) ? "Captura Habilitada" : "Captura Deshabilitada"}
            severity={permiteCapturaProyectos(selectedEjercicio) ? "success" : "danger"}
          />
        </div>
      )}
    </div>
  );
};

export default EjercicioFiscalSelector;