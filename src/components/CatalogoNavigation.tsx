'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useState } from 'react';
import { CATALOGOS_CONFIG } from '@/src/config/catalogos';
import { useAuth } from '@/layout/context/authContext';

const CatalogoNavigation = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCatalogo, setSelectedCatalogo] = useState(null);

  // Filtrar catálogos según permisos
  const availableCatalogos = CATALOGOS_CONFIG.filter(config => {
    const permission = `catalogos.${config.key}.read`;
    return user?.permissions?.includes(permission);
  }).map(config => ({
    label: config.title,
    value: config.route,
    icon: config.icon,
    category: config.category
  }));

  const navigateToCatalogo = () => {
    if (selectedCatalogo) {
      router.push(selectedCatalogo);
    }
  };

  const getCategoryGroups = () => {
    const groups = availableCatalogos.reduce((acc, catalogo) => {
      const categoryName = getCategoryTitle(catalogo.category);
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(catalogo);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(groups).map(([category, items]) => ({
      label: category,
      items: items
    }));
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'organizacional':
        return 'Organizacionales y Estratégicos';
      case 'planeacion':
        return 'Planeación Técnica';
      case 'recursos':
        return 'Recursos Humanos, Presupuestarios y Financieros';
      case 'tabuladores':
        return 'Tabuladores';
      default:
        return category;
    }
  };

  const itemTemplate = (option: any) => {
    return (
      <div className="flex align-items-center">
        <i className={`${option.icon} mr-2`}></i>
        <span>{option.label}</span>
      </div>
    );
  };

  if (availableCatalogos.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 surface-50">
      <div className="flex align-items-center gap-3">
        <i className="pi pi-compass text-2xl text-primary"></i>
        <div className="flex-1">
          <h6 className="m-0 mb-2">Navegación Rápida</h6>
          <div className="flex gap-2 align-items-center">
            <Dropdown
              value={selectedCatalogo}
              options={getCategoryGroups()}
              onChange={(e) => setSelectedCatalogo(e.value)}
              optionLabel="label"
              optionValue="value"
              optionGroupLabel="label"
              optionGroupChildren="items"
              placeholder="Seleccionar catálogo..."
              className="w-full md:w-20rem"
              itemTemplate={itemTemplate}
              filter
              filterPlaceholder="Buscar catálogo..."
            />
            <Button
              label="Ir"
              icon="pi pi-arrow-right"
              disabled={!selectedCatalogo}
              onClick={navigateToCatalogo}
              className="p-button-sm"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CatalogoNavigation;
