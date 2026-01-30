'use client';

import React from 'react';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { BeneficiarioProyecto, ActividadPoaApi } from '@/types/proyectos.d';
import BeneficiarioCard from './BeneficiarioCard';

interface ActividadBeneficiariosProps {
  actividad: ActividadPoaApi;
  beneficiarios: BeneficiarioProyecto[];
  onAddBeneficiario: (actividad: ActividadPoaApi) => void;
  onEditBeneficiario: (beneficiario: BeneficiarioProyecto) => void;
  onDeleteBeneficiario: (beneficiario: BeneficiarioProyecto) => void;
  readonly?: boolean;
}

const ActividadBeneficiarios: React.FC<ActividadBeneficiariosProps> = ({
  actividad,
  beneficiarios,
  onAddBeneficiario,
  onEditBeneficiario,
  onDeleteBeneficiario,
  readonly = false
}) => {
  const totalBeneficiarios = Array.isArray(beneficiarios) 
    ? beneficiarios.reduce((sum, b) => sum + b.cantidad, 0) 
    : 0;

  const headerTemplate = (
    <div className="flex align-items-center justify-content-between w-full">
      <div className="flex align-items-center gap-3 flex-1">
        <i className={`pi ${actividad.tipo_actividad?.nombre ? 'pi-check-circle' : 'pi-circle'} text-primary`}></i>
        <div className="flex-1">
          <div className="font-semibold text-900">{actividad.descripcion}</div>
          <div className="text-sm text-600 mt-1">
            Tipo: {actividad.tipo_actividad?.nombre || 'No especificado'}
          </div>
        </div>
      </div>
      <div className="flex align-items-center gap-2 ml-4">
        <Badge value={totalBeneficiarios} severity="success"></Badge>
        <span className="text-sm text-600">beneficiarios</span>
      </div>
    </div>
  );

  return (
    <Panel header={headerTemplate} toggleable collapsed={false} className="mb-3">
      <div className="flex flex-column gap-2">
        {!Array.isArray(beneficiarios) || beneficiarios.length === 0 ? (
          <div className="text-center p-4">
            <i className="pi pi-inbox text-4xl text-400 mb-3"></i>
            <p className="text-600 mb-3">No hay beneficiarios asignados a esta actividad</p>
            {!readonly && (
              <Button
                label="Agregar Primer Beneficiario"
                icon="pi pi-plus"
                onClick={() => onAddBeneficiario(actividad)}
                className="p-button-sm"
              />
            )}
          </div>
        ) : (
          <>
            {Array.isArray(beneficiarios) && beneficiarios.map((beneficiario) => (
              <BeneficiarioCard
                key={beneficiario.id}
                beneficiario={beneficiario}
                onEdit={onEditBeneficiario}
                onDelete={onDeleteBeneficiario}
                readonly={readonly}
              />
            ))}
            {!readonly && (
              <div className="flex justify-content-center mt-2">
                <Button
                  label="Agregar Otro Beneficiario"
                  icon="pi pi-plus"
                  onClick={() => onAddBeneficiario(actividad)}
                  className="p-button-outlined p-button-sm"
                />
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
};

export default ActividadBeneficiarios;
export { ActividadBeneficiarios };
