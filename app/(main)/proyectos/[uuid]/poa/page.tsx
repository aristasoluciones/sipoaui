'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BreadCrumb } from 'primereact/breadcrumb';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import PoaManager from '@/src/components/proyectos/poa/PoaManager';
import { usePermissions } from '@/src/hooks/usePermissions';
import { PageAccessDenied } from '@/src/components/AccessDeneid';
import { ProyectoService } from '@/src/services/proyecto';
import { ProgramaOperativoAnualApi, ActividadPoaApi, SubactividadPoaApi } from '@/types/proyectos';
import { TipoActividad, Entregable, TipoActividadApi, EntregableApi } from '@/types/catalogos';
import { useNotification } from '@/layout/context/notificationContext';
import { CatalogoService } from '@/src/services/catalogos.service';
import { toCamelCase } from '@/src/utils/transformers';

const PoaPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const projectUuid = params?.uuid as string;
  const { hasAnyPermission } = usePermissions();
  const { success:showMsgSuccess, error:showMsgError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [poa, setPoa] = useState<ProgramaOperativoAnualApi | null>(null);
  const [actividades, setActividades] = useState<ActividadPoaApi[]>([]);
  const [poaLoading, setPoaLoading] = useState(false);
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [entregables, setEntregables] = useState<Entregable[]>([]);
  const [catalogosLoading, setCatalogosLoading] = useState(false);
  const isLoadingRef = useRef(false); // Ref para controlar race conditions

  useEffect(() => {
    if (poa !== null || isLoadingRef.current) return; // Ya se cargó o está cargando, no hacer nada

    const loadData = async () => {
      try {
        isLoadingRef.current = true; // Marcar como cargando
        setLoading(true);
        
        // Cargar catálogos primero
        await loadCatalogos();
        
        // Intentar cargar el POA
        await loadPoa();
        
      } catch (error) {
        showMsgError('Error', 'No se pudo cargar la información del proyecto');
      } finally {
        setLoading(false);
        isLoadingRef.current = false; // Marcar como no cargando
      }
    };

    loadData();
  }, [poa]); // Dependencia en poa

  const loadPoa = async () => {
    try {
      const poaData = await ProyectoService.getPoaConActividades(projectUuid);
      // Setear el nombre del proyecto desde el POA cargado
      if (poaData.proyecto && poaData.proyecto.nombre) {
        setProjectName(poaData.proyecto.nombre);
      }
      setPoa(poaData);
      setActividades(poaData.actividades || []);
    } catch (error: any) {
      // Si es 404, significa que no existe POA - esto es normal
      if (error.response?.status === 404) {
        setPoa(null);
        setActividades([]);
      } else {
        // Otro tipo de error
        console.error('Error loading POA:', error);
        showMsgError('Error', 'No se pudo cargar el Programa Operativo Anual');
      }
    }
  };

  const loadCatalogos = async () => {
    try {
      setCatalogosLoading(true);
      
      // Cargar tipos de actividad
      const tiposActividadService = new CatalogoService('tipos-actividad');
      const tiposActividadApiData = await tiposActividadService.getAll();
      const tiposActividadConverted = toCamelCase<TipoActividad[]>(tiposActividadApiData);
      setTiposActividad(tiposActividadConverted);
      
      // Cargar entregables
      const entregablesService = new CatalogoService('entregables');
      const entregablesApiData = await entregablesService.getAll();
      const entregablesConverted = toCamelCase<Entregable[]>(entregablesApiData);
      setEntregables(entregablesConverted);
      
    } catch (error: any) {
      console.error('Error loading catalogs:', error);
      showMsgError('Error', 'No se pudieron cargar los catálogos');
    } finally {
      setCatalogosLoading(false);
    }
  };

  const handleCreatePoa = async () => {
    if (isLoadingRef.current) return; // Si ya hay una operación en curso, no hacer nada

    try {
      isLoadingRef.current = true; // Marcar como cargando
      setPoaLoading(true);
      const newPoa = await ProyectoService.createPoaPorProyectoUuid(projectUuid);
      setPoa(newPoa);
      setActividades(newPoa.actividades || []);
      showMsgSuccess('Éxito', 'Programa Operativo Anual creado exitosamente');
    } catch (error: any) {
      showMsgError('Error', 'No se pudo crear el Programa Operativo Anual');
    } finally {
      setPoaLoading(false);
      isLoadingRef.current = false; // Marcar como no cargando
    }
  };

  // Funciones CRUD para actividades
  const handleCreateActividad = async (actividadData: any) => {
    if (!poa) return;
    
    try {
      const newActividad = await ProyectoService.createActividadPorPoaId(
        projectUuid, 
        poa.id, 
        actividadData
      );
      setActividades(prev => [...prev, newActividad]);
    } catch (error: any) {
      // El hijo se encargará de mostrar el error
      throw error;
    }
  };

  const handleUpdateActividad = async (actividadId: number, actividadData: any) => {
    if (!poa) return;
    
    try {
      const updatedActividad = await ProyectoService.updateActividadPorPoaId(
        projectUuid, 
        poa.id, 
        actividadId, 
        actividadData
      );
      setActividades(prev => prev.map(act => 
        act.id === actividadId ? updatedActividad : act
      ));
      showMsgSuccess('Éxito', 'Actividad actualizada exitosamente');
    } catch (error: any) {
      console.error('Error updating actividad:', error);
      showMsgError('Error', 'No se pudo actualizar la actividad');
    }
  };

  const handleDeleteActividad = async (actividadId: number) => {
    if (!poa) return;
    
    try {
      await ProyectoService.deleteActividadPorPoaId(projectUuid, poa.id, actividadId);
      setActividades(prev => prev.filter(act => act.id !== actividadId));
      showMsgSuccess('Éxito', 'Actividad eliminada exitosamente');
    } catch (error: any) {
      console.error('Error deleting actividad:', error);
      showMsgError('Error', 'No se pudo eliminar la actividad');
    }
  };

  // Funciones CRUD para subactividades
  const handleCreateSubactividad = async (actividadId: number, subactividadData: any) => {
    if (!poa) return;
    
    try {
      const newSubactividad = await ProyectoService.createSubactividadPorActividadId(
        projectUuid, 
        poa.id, 
        actividadId, 
        subactividadData
      );
      // Las subactividades se manejarán en el PoaManager
      showMsgSuccess('Éxito', 'Subactividad creada exitosamente');
    } catch (error: any) {
      console.error('Error creating subactividad:', error);
      showMsgError('Error', 'No se pudo crear la subactividad');
    }
  };

  const handleUpdateSubactividad = async (actividadId: number, subactividadId: number, subactividadData: any) => {
    if (!poa) return;
    
    try {
      const updatedSubactividad = await ProyectoService.updateSubactividadPorActividadId(
        projectUuid, 
        poa.id, 
        actividadId, 
        subactividadId, 
        subactividadData
      );
      // Las subactividades se manejarán en el PoaManager
      showMsgSuccess('Éxito', 'Subactividad actualizada exitosamente');
    } catch (error: any) {
      console.error('Error updating subactividad:', error);
      showMsgError('Error', 'No se pudo actualizar la subactividad');
    }
  };

  const handleDeleteSubactividad = async (actividadId: number, subactividadId: number) => {
    if (!poa) return;
    
    try {
      await ProyectoService.deleteSubactividadPorActividadId(
        projectUuid, 
        poa.id, 
        actividadId, 
        subactividadId
      );
      // Las subactividades se manejarán en el PoaManager
      showMsgSuccess('Éxito', 'Subactividad eliminada exitosamente');
    } catch (error: any) {
      console.error('Error deleting subactividad:', error);
      showMsgError('Error', 'No se pudo eliminar la subactividad');
    }
  };

  const breadcrumbItems = [
    { label: 'Inicio', url: '/' },
    { label: 'Proyectos', url: '/proyectos' },
    { label: projectName || 'Proyecto', url: `/proyectos/${projectUuid}` },
    { label: 'Programa Operativo Anual' }
  ];

  const breadcrumbHome = { icon: 'pi pi-home', url: '/' };

  if (!hasAnyPermission(['proyectos.read', 'proyectos.update'])) {
    return <PageAccessDenied />;
  }

  if (loading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
        <p className="mt-3 text-600">Cargando Programa Operativo Anual...</p>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="col-12">
        <BreadCrumb
          model={breadcrumbItems}
          home={breadcrumbHome}
          className="mb-3"
        />
      </div>

      <div className="col-12">
        {poa ? (
          <PoaManager 
            projectUuid={projectUuid} 
            projectName={projectName} 
            poaData={poa}
            actividades={actividades}
            tiposActividad={tiposActividad}
            entregables={entregables}
            onCreateActividad={handleCreateActividad}
            onUpdateActividad={handleUpdateActividad}
            onDeleteActividad={handleDeleteActividad}
            onCreateSubactividad={handleCreateSubactividad}
            onUpdateSubactividad={handleUpdateSubactividad}
            onDeleteSubactividad={handleDeleteSubactividad}
          />
        ) : (
          <div className="flex flex-column align-items-center justify-content-center p-8 text-center border-2 border-dashed border-300 border-round-lg">
              
                <i className="pi pi-calendar text-6xl text-primary mb-3"></i>
                <h3 className="text-900 mb-2">Programa Operativo Anual</h3>
                <p className="text-600 mb-4">
                  No se ha creado el Programa Operativo Anual para este proyecto.
                  Comienza definiendo las actividades y subactividades que se realizarán durante el año.
                </p>
                <Button
                  label="Comenzar"
                  icon="pi pi-plus"
                  onClick={handleCreatePoa}
                  loading={poaLoading}
                  className="p-button-primary"
                  size="large"
                />
          </div>
        )}
      </div>
    </div>
  );
};

export default PoaPage;
