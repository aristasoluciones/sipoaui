'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CatalogoManager from '@/src/components/CatalogoManager';
import { CATALOGOS_CONFIG } from '@/src/config/catalogos';
import { MOCK_CONFIG, MOCK_CATALOGOS, mockUtils } from '@/src/mocks';
import { useAuth } from '@/layout/context/authContext';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';

import { CatalogoService } from '@/src/services/catalogos.service';

import { usePermissions }  from '@/src/hooks/usePermissions';
import { AccessDenied } from './AccessDeneid';

interface CatalogoPageProps {
  catalogoKey: string;
  title: string;
  description: string;
}

const CatalogoBasePage: React.FC<CatalogoPageProps> = ({ catalogoKey, title, description }) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogoService, setCatalogoService] = useState<CatalogoService | null>(null);

  const { hasAnyPermission } = usePermissions()

  const config = CATALOGOS_CONFIG.find(c => c.key === catalogoKey);

  // Crear instancia del servicio al cargar el componente
  useEffect(() => {
    if (config && config.hasApiAccess !== false) {
      const service = new CatalogoService(catalogoKey);
      setCatalogoService(service);
    }
  }, [catalogoKey, config]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (config?.hasApiAccess === false) {
        await mockUtils.delay();
        const mockKey = catalogoKey === 'marcoNormativo' ? 'marcoNormativo' : catalogoKey;
        const mockData = (MOCK_CATALOGOS as any)[mockKey] || [];
        setData(mockData);
      } else {
        // Usar la instancia del servicio creada previamente
        if (catalogoService) {
          const items = await catalogoService.getAll();
          setData(items);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    // Solo cargar datos si el servicio ya está inicializado o si usa mocks
    if (catalogoService || config?.hasApiAccess === false) {
      loadData();
    }
  }, [isAuthenticated, router, catalogoService, config]);

  
  const handleSave = async (item: any) => {
    if (MOCK_CONFIG.enabled || config?.hasApiAccess === false) {
      await mockUtils.delay(500);
      
      const mockKey = catalogoKey === 'marcoNormativo' ? 'marcoNormativo' : catalogoKey;
      const mockData = (MOCK_CATALOGOS as any)[mockKey];
      
      if (item.id) {
        // Actualizar
        const index = mockData.findIndex((u: any) => u.id === item.id);
        if (index !== -1) {
          mockData[index] = {
            ...item
          };
        }
      } else {
        // Crear nuevo
        const newItem = {
          ...item,
          id: Math.max(...mockData.map((u: any) => u.id), 0) + 1
        };
        mockData.push(newItem);
      }
    } else {
      // Usar la instancia del servicio
      if (catalogoService) {

        const { estado, ...otros } = item;
        const payload = { ...otros, estatus: estado };
    
        if (item.id) {
          await catalogoService.update(item.id, payload);
        } else {
          await catalogoService.create(payload);
        }
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (MOCK_CONFIG.enabled || config?.hasApiAccess === false) {
      await mockUtils.delay(300);
      const mockKey = catalogoKey === 'marcoNormativo' ? 'marcoNormativo' : catalogoKey;
      const mockData = (MOCK_CATALOGOS as any)[mockKey];
      const index = mockData.findIndex((u: any) => u.id === id);
      if (index !== -1) {
        mockData.splice(index, 1);
      }
    } else {
      // Usar la instancia del servicio
      if (catalogoService) {
        await catalogoService.delete(id);
      }
    }
  };

  const getCategoryPath = () => {
    if (!config) return '';
    switch (config.category) {
      case 'organizacional':
        return 'Organizacionales y Estratégicos';
      case 'planeacion':
        return 'Planeación Técnica';
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
      label: 'Catálogos', 
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
        <h5>Error: Configuración no encontrada</h5>
      </div>
    );
  }

  // Verificar permisos básicos de lectura
  const hasReadPermission = hasAnyPermission(config.permissions);
  
  if (!hasReadPermission) {
    return (
      <div className="card">
        <AccessDenied message='No tienes permisos para acceder a este catálogo.' variant='detailed'  />
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="col-12">
        <BreadCrumb model={breadcrumbItems} home={home} className="mb-4" />
          {/* Título y descripción del módulo */}
        <div className="flex align-items-center justify-content-between mb-4">
          <div className="flex align-items-center">
              <i className={`${config.icon} text-3xl text-primary mr-3`}></i>
              <div>
                <h2 className="text-2xl font-bold text-900 m-0">{config.title}</h2>
                <p className="text-600 m-0">{description}</p>
              </div>
          </div>
            <Button
              label="Regresar a catálogos"
              icon="pi pi-arrow-left"
              className="p-button-outlined"
              onClick={() => router.push('/catalogos')}
            />
        </div>
        
     
        <CatalogoManager
            config={config}
            data={data}
            onSave={handleSave}
            onDelete={handleDelete}
            onRefresh={loadData}
          />
      </div>
    </div>
  );
};

export default CatalogoBasePage;
