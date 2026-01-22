'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { classNames } from 'primereact/utils';
import type { ReporteCardProps } from '@/types/reportes';

const ReportCard: React.FC<ReporteCardProps> = ({ 
  reporte, 
  hasPermission, 
  onReportClick 
}) => {
  const handleClick = () => {
    if (hasPermission && !reporte.comingSoon) {
      onReportClick(reporte);
    }
  };

  const cardClassName = classNames(
    'report-card cursor-pointer transition-all duration-200',
    {
      'hover:shadow-lg': hasPermission && !reporte.comingSoon,
      'opacity-50 cursor-not-allowed': !hasPermission || reporte.comingSoon,
      [`border-${reporte.color}-200`]: true,
      [`hover:border-${reporte.color}-400`]: hasPermission && !reporte.comingSoon
    }
  );

  const iconClassName = classNames(
    'pi text-4xl mb-3',
    reporte.icon,
    {
      [`text-${reporte.color}-500`]: hasPermission && !reporte.comingSoon,
      'text-400': !hasPermission || reporte.comingSoon
    }
  );

  return (
    <Card 
      className={cardClassName}
      onClick={handleClick}
      style={{ height: '100%' }}
    >
      <div className="flex flex-column align-items-center text-center h-full">
        {/* Icono */}
        <i className={iconClassName}></i>
        
        {/* Título */}
        <h4 className={classNames(
          'mb-2 font-semibold',
          {
            'text-900': hasPermission && !reporte.comingSoon,
            'text-600': !hasPermission || reporte.comingSoon
          }
        )}>
          {reporte.title}
        </h4>
        
        {/* Descripción */}
        <p className={classNames(
          'text-sm mb-4 flex-1',
          {
            'text-600': hasPermission && !reporte.comingSoon,
            'text-400': !hasPermission || reporte.comingSoon
          }
        )}>
          {reporte.description}
        </p>
        
        {/* Categoría Badge */}
        <Badge 
          value={reporte.category}
          severity={hasPermission && !reporte.comingSoon ? 'info' : null}
          className="mb-3"
        />
        
        {/* Estados y botones */}
        {reporte.comingSoon ? (
          <Badge 
            value="Próximamente"
            severity="warning"
            className="w-full"
          />
        ) : !hasPermission ? (
          <div className="flex align-items-center text-500 text-sm">
            <i className="pi pi-lock mr-2"></i>
            <span>Sin permisos</span>
          </div>
        ) : (
          <Button
            label="Ver Reporte"
            icon="pi pi-external-link"
            className={`w-full bg-${reporte.color}-500 border-${reporte.color}-500`}
            size="small"
          />
        )}
      </div>
    </Card>
  );
};

export default ReportCard;