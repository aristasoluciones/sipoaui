'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CatalogoManager from '@/src/components/CatalogoManager';
import { CATALOGOS_CONFIG } from '@/src/config/catalogos';
import { useAuth } from '@/layout/context/authContext';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';

import { CatalogoService } from '@/src/services/catalogos.service';

import { usePermissions } from '@/src/hooks/usePermissions';
import { AccessDenied } from './AccessDeneid';

interface CatalogoPageProps {
  catalogoKey: string;
  title: string;
  description: string;
}

const CatalogoBasePage: React.FC<CatalogoPageProps> = ({ catalogoKey, title, description }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [catalogoService, setCatalogoService] = useState<CatalogoService | null>(null);

  const { hasAnyPermission } = usePermissions();

  const config = CATALOGOS_CONFIG.find(c => c.key === catalogoKey);

  useEffect(() => {
    if (config) {
      const service = new CatalogoService(catalogoKey);
      setCatalogoService(service);
    }
  }, [catalogoKey, config]);

  const loadData = useCallback(async () => {
    try {
      if (catalogoService) {
        const items = await catalogoService.getAll();
        setData(Array.isArray(items) ? items : []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [catalogoService]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (catalogoService) {
      loadData();
    }
  }, [isAuthenticated, router, catalogoService, loadData]);

  const handleSave = async (item: any) => {
    if (catalogoService) {
      const { estado, ...otros } = item;
      const payload = { ...otros, estatus: estado };

      if (item.id) {
        await catalogoService.update(item.id, payload);
      } else {
        await catalogoService.create(payload);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (catalogoService) {
      await catalogoService.delete(id);
    }
  };

  const getCategoryPath = () => {
    if (!config) return '';
    switch (config.category) {
      case 'organizacional':
        return 'Organizacionales y Estrategicos';
      case 'planeacion':
        return 'Planeacion Tecnica';
      case 'recursos':
        return 'Recursos Humanos, Presupuestarios y Financieros';
      case 'tabuladores':
        return 'Tabuladores';
      default:
        return '';
    }
  };

  const breadcrumbItems = [
    { label: 'Inicio', command: () => router.push('/') },
    {
      label: 'Catalogos',
      command: () => router.push('/catalogos'),
      className: 'text-primary font-medium'
    },
    { label: getCategoryPath() },
    {
      label: title,
      className: 'font-bold text-900'
    }
  ];

  const home = { icon: 'pi pi-home', command: () => router.push('/') };

  if (!config) {
    return (
      <div className="card">
        <h5>Error: Configuracion no encontrada</h5>
      </div>
    );
  }

  const hasReadPermission = hasAnyPermission(config.permissions);

  if (!hasReadPermission) {
    return (
      <div className="card">
        <AccessDenied message="No tienes permisos para acceder a este catalogo." variant="detailed" />
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="col-12">
        <BreadCrumb model={breadcrumbItems} home={home} className="mb-4" />
        <div className="flex align-items-center justify-content-between mb-4">
          <div className="flex align-items-center">
            <i className={`${config.icon} text-3xl text-primary mr-3`}></i>
            <div>
              <h2 className="text-2xl font-bold text-900 m-0">{config.title}</h2>
              <p className="text-600 m-0">{description}</p>
            </div>
          </div>
          <Button
            label="Regresar a catalogos"
            icon="pi pi-arrow-left"
            className="p-button-outlined"
            onClick={() => router.push('/catalogos')}
          />
        </div>

        <CatalogoManager config={config} data={data} onSave={handleSave} onDelete={handleDelete} onRefresh={loadData} />
      </div>
    </div>
  );
};

export default CatalogoBasePage;
