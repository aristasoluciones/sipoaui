'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { BeneficiarioProyecto } from '@/types/proyectos.d';

interface BeneficiarioCardProps {
  beneficiario: BeneficiarioProyecto;
  onEdit: (beneficiario: BeneficiarioProyecto) => void;
  onDelete: (beneficiario: BeneficiarioProyecto) => void;
  readonly?: boolean;
}

const BeneficiarioCard: React.FC<BeneficiarioCardProps> = ({
  beneficiario,
  onEdit,
  onDelete,
  readonly = false
}) => {
  return (
    <div className="flex align-items-center justify-content-between p-3 border-1 border-round surface-border bg-white hover:surface-50 transition-colors transition-duration-200 mb-2">
      <div className="flex align-items-center gap-3">
        <i className="pi pi-users text-primary text-lg"></i>
        <div>
          <span className="font-medium text-900">{beneficiario.beneficiarioNombre}</span>
        </div>
      </div>
      
      <div className="flex align-items-center gap-3">
        <Badge value={beneficiario.cantidad} severity="info"></Badge>
        
        <div className="flex gap-1">
          <Button
            icon="pi pi-pencil"
            className="p-button-text p-button-sm p-button-rounded"
            tooltip="Editar"
            tooltipOptions={{ position: 'top' }}
            onClick={() => onEdit(beneficiario)}
          />
          {!readonly && (
            <Button
              icon="pi pi-trash"
              className="p-button-text p-button-danger p-button-sm p-button-rounded"
              tooltip="Eliminar"
              tooltipOptions={{ position: 'top' }}
              onClick={() => onDelete(beneficiario)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BeneficiarioCard;
export { BeneficiarioCard };
