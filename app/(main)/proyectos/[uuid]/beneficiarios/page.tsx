'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Skeleton } from 'primereact/skeleton';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { usePermissions } from '@/src/hooks/usePermissions';
import { PageAccessDenied } from '@/src/components/AccessDeneid';
import { ProyectoService } from '@/src/services/proyecto';
import { CatalogoService } from '@/src/services/catalogos.service';
import { useProjectOperations } from '@/src/hooks/useProjectOperations';
import ActividadBeneficiarios from '@/src/components/proyectos/ActividadBeneficiarios';
import BeneficiariosForm from '@/src/components/proyectos/BeneficiariosForm';
import ObservacionDialog from '@/src/components/proyectos/ObservacionDialog';
import { 
  ActividadPoaApi, 
  BeneficiarioProyecto, 
  CreateBeneficiarioRequest, 
  UpdateBeneficiarioRequest,
  ProyectoApi,
  EstatusEtapa,
  BeneficiariosResponse
} from '@/types/proyectos.d';
import { Beneficiario } from '@/types/catalogos';
import { toCamelCase } from '@/src/utils/transformers';
import { useNotification } from '@/layout/context/notificationContext';

const BeneficiariosPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const projectUuid = params?.uuid as string;
  const { hasAnyPermission } = usePermissions();
  const { success: showMsgSuccess, error: showMsgError } = useNotification();
  const toast = useRef<Toast>(null);
  
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [project, setProject] = useState<ProyectoApi | null>(null);
  const [estatusEtapa, setEstatusEtapa] = useState<string>('');
  const [actividades, setActividades] = useState<ActividadPoaApi[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<BeneficiarioProyecto[]>([]);
  const [catalogoBeneficiarios, setCatalogoBeneficiarios] = useState<Beneficiario[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<ActividadPoaApi | null>(null);
  const [beneficiarioEdit, setBeneficiarioEdit] = useState<BeneficiarioProyecto | null>(null);
  const [observacionDialogVisible, setObservacionDialogVisible] = useState(false);
  
  const isLoadingRef = useRef(false);

  const loadData = async () => {
    try {
      isLoadingRef.current = true;
      setLoading(true);
      
      await Promise.all([
        loadProyecto(),
        loadActividades(),
        loadBeneficiarios(),
        loadCatalogoBeneficiarios()
      ]);
      
    } catch (error) {
      showMsgError('Error', 'No se pudo cargar la información');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const { handleSolicitarRevision, handleAprobar, handleObservar } = useProjectOperations({
    isCreating: false,
    selectedProject: null,
    onSuccess: () => {
      // Recargar datos después de cambiar estado
      loadData();
    }
  });

  useEffect(() => {
    if (isLoadingRef.current) return;

    const loadData = async () => {
      try {
        isLoadingRef.current = true;
        setLoading(true);
        
        await Promise.all([
          loadProyecto(),
          loadActividades(),
          loadBeneficiarios(),
          loadCatalogoBeneficiarios()
        ]);
        
      } catch (error) {
        showMsgError('Error', 'No se pudo cargar la información');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadData();
  }, []);

  const loadProyecto = async () => {
    try {
      const proyecto = await ProyectoService.getProyecto(projectUuid);
      setProjectName(proyecto.nombre);
      setProject(proyecto);
    } catch (error) {
      console.error('Error loading proyecto:', error);
      throw error;
    }
  };

  const loadActividades = async () => {
    try {
      const poaData = await ProyectoService.getPoaConActividades(projectUuid);
      setActividades(Array.isArray(poaData?.actividades) ? poaData.actividades : []);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setActividades([]);
      } else {
        console.error('Error loading actividades:', error);
        throw error;
      }
    }
  };

  const loadBeneficiarios = async () => {
    try {
      const response = await ProyectoService.getBeneficiariosPorProyecto(projectUuid);
      console.log('Beneficiarios response:', response);
      const beneficiariosConverted = toCamelCase<BeneficiarioProyecto[]>(response.data || []);
      setBeneficiarios(Array.isArray(beneficiariosConverted) ? beneficiariosConverted : []);
      
      // Extraer el estatus_etapa del meta
      if (response.meta && response.meta.estatus_etapa) {
        setEstatusEtapa(response.meta.estatus_etapa);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setBeneficiarios([]);
        setEstatusEtapa('');
      } else {
        console.error('Error loading beneficiarios:', error);
        throw error;
      }
    }
  };

  const loadCatalogoBeneficiarios = async () => {
    try {
      const service = new CatalogoService('beneficiarios');
      const data = await service.getAll();
      const converted = toCamelCase<Beneficiario[]>(data || []);
      setCatalogoBeneficiarios(Array.isArray(converted) ? converted : []);
    } catch (error) {
      console.error('Error loading catálogo beneficiarios:', error);
      throw error;
    }
  };

  const handleAddBeneficiario = (actividad: ActividadPoaApi) => {
    setSelectedActividad(actividad);
    setBeneficiarioEdit(null);
    setFormVisible(true);
  };

  const handleEditBeneficiario = (beneficiario: BeneficiarioProyecto) => {
    if (!Array.isArray(actividades)) return;
    const actividad = actividades.find(a => a.id === beneficiario.poaActividadId);
    if (actividad) {
      setSelectedActividad(actividad);
      setBeneficiarioEdit(beneficiario);
      setFormVisible(true);
    }
  };

  const handleDeleteBeneficiario = (beneficiario: BeneficiarioProyecto) => {
    confirmDialog({
      message: `¿Está seguro de eliminar este beneficiario (${beneficiario.beneficiarioNombre})?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await ProyectoService.deleteBeneficiario(projectUuid, beneficiario.id);
          await loadBeneficiarios();
          showMsgSuccess('Eliminado', 'Beneficiario eliminado correctamente');
        } catch (error) {
          showMsgError('Error', 'No se pudo eliminar el beneficiario');
          console.error('Error deleting beneficiario:', error);
        }
      }
    });
  };

  const handleSaveBeneficiario = async (
    data: CreateBeneficiarioRequest | UpdateBeneficiarioRequest, 
    isEdit: boolean
  ) => {
    try {
      if (isEdit && beneficiarioEdit) {
        await ProyectoService.updateBeneficiario(
          projectUuid, 
          beneficiarioEdit.id, 
          data as UpdateBeneficiarioRequest
        );
        showMsgSuccess('Actualizado', 'Beneficiario actualizado correctamente');
      } else {
        await ProyectoService.createBeneficiario(
          projectUuid, 
          data as CreateBeneficiarioRequest
        );
        showMsgSuccess('Creado', 'Beneficiario agregado correctamente');
      }
      await loadBeneficiarios();
    } catch (error) {
      showMsgError('Error', 'No se pudo guardar el beneficiario');
      console.error('Error saving beneficiario:', error);
      throw error;
    }
  };

  const getBeneficiariosPorActividad = (actividadId: number): BeneficiarioProyecto[] => {
    console.log('Filtering beneficiarios for actividadId:', beneficiarios, actividadId);
    if (!Array.isArray(beneficiarios)) return [];
    return beneficiarios.filter(b => b.poaActividadId === actividadId);
  };

  const todasLasActividadesTienenBeneficiarios = (): boolean => {
    if (!Array.isArray(actividades) || !Array.isArray(beneficiarios)) return false;
    return actividades.every(actividad => {
      const beneficiariosActividad = getBeneficiariosPorActividad(actividad.id);
      return beneficiariosActividad.length > 0;
    });
  };

  const handleEnviarRevision = async () => {
    try {
      await handleSolicitarRevision(projectUuid);
    } catch (error) {
      console.error('Error sending to revision:', error);
    }
  };

  const handleAprobarBeneficiarios = async () => {
    try {
      await handleAprobar(projectUuid);
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleObservarBeneficiarios = async (observacion: string) => {
    try {
      await handleObservar(projectUuid, observacion);
      setObservacionDialogVisible(false);
    } catch (error) {
      console.error('Error observing:', error);
    }
  };

  const totalGeneralBeneficiarios = Array.isArray(beneficiarios) 
    ? beneficiarios.reduce((sum, b) => sum + b.cantidad, 0) 
    : 0;

  const isAprobado = estatusEtapa === EstatusEtapa.APROBADO;

  const breadcrumbHome = { icon: 'pi pi-home', url: '/' };
  const breadcrumbItems = [
    { label: 'Proyectos', url: '/proyectos' },
    { label: projectName || 'Cargando...' },
    { label: 'Beneficiarios' }
  ];

  if (!hasAnyPermission(['proyectos.read', 'proyectos.manage'])) {
    return <PageAccessDenied />;
  }

  if (loading) {
    return (
      <div className="surface-ground p-4">
        <div className="surface-card p-4 shadow-2 border-round">
          <Skeleton width="200px" height="2rem" className="mb-3" />
          <Skeleton width="100%" height="4rem" className="mb-3" />
          <Skeleton width="100%" height="4rem" className="mb-3" />
          <Skeleton width="100%" height="4rem" />
        </div>
      </div>
    );
  }

  if (actividades.length === 0) {
    return (
      <div className="surface-ground p-4">
        <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} className="mb-3" />
        
        <div className="surface-card p-5 shadow-2 border-round text-center">
          <i className="pi pi-info-circle text-6xl text-400 mb-4"></i>
          <h3 className="text-900 mb-2">No hay actividades en el POA</h3>
          <p className="text-600 mb-4">
            Debe crear al menos una actividad en el Programa Operativo Anual antes de poder asignar beneficiarios.
          </p>
          <Button
            label="Ir a POA"
            icon="pi pi-arrow-left"
            onClick={() => router.push(`/proyectos/${projectUuid}/poa`)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="surface-ground p-4">
        <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} className="mb-3" />

        {/* Header con total */}
        <div className="p-3 border-1 surface-border border-round-lg bg-white p-3 shadow-2 border-round mb-3">
          <div className="flex align-items-center justify-content-between">
            <div>
              <h2 className="text-lg font-bold text-900 mb-1">Estimación de Beneficiarios</h2>
              <p className="text-600 m-0">Asigne beneficiarios a cada actividad del POA</p>
            </div>
            <div className="flex align-items-center gap-2">
              <span className="text-600 font-semibold">Total General:</span>
              <Badge value={totalGeneralBeneficiarios} severity="info" size="large"></Badge>
            </div>
          </div>
        </div>

        {/* Lista de actividades con sus beneficiarios */}
        <div className="surface-card shadow-2 border-round">
          {/* Header con botones del workflow */}
          <div className="p-3 border-bottom-1 border-200 bg-gray-50 flex justify-content-between align-items-center">
            <div className="flex align-items-center gap-3">
              <h3 className="text-lg font-semibold text-900 m-0">Lista de actividades con sus beneficiarios</h3>
              {isAprobado && (
                <Badge value="APROBADO" severity="success" className="text-sm font-semibold" />
              )}
            </div>
            <div className="flex gap-2">
              {/* Ver observación - solo si está observado */}
              {estatusEtapa === EstatusEtapa.OBSERVADO && (
                <Button
                  label="Ver observación"
                  icon="pi pi-eye"
                  className="p-button-outlined p-button-sm"
                  onClick={() => {
                    // TODO: Implementar vista de observación
                    showMsgError('Funcionalidad pendiente', 'Vista de observación no implementada aún');
                  }}
                />
              )}
              
              {/* Observar - solo si no está aprobado */}
              {estatusEtapa !== EstatusEtapa.APROBADO && hasAnyPermission(['proyectos.manage']) && (
                <Button
                  label="Observar"
                  icon="pi pi-exclamation-triangle"
                  className="p-button-warning p-button-sm"
                  onClick={() => setObservacionDialogVisible(true)}
                />
              )}
              
              {/* Aprobar - solo si está en revisión */}
              {estatusEtapa === EstatusEtapa.EN_REVISION && hasAnyPermission(['proyectos.manage']) && (
                <Button
                  label="Aprobar"
                  icon="pi pi-check"
                  className="p-button-success p-button-sm"
                  onClick={handleAprobarBeneficiarios}
                />
              )}
              
              {/* Enviar a revisión - solo si todas las actividades tienen beneficiarios y está en captura */}
              {todasLasActividadesTienenBeneficiarios() && estatusEtapa === EstatusEtapa.CAPTURA && (
                <Button
                  label="Enviar a revisión"
                  icon="pi pi-send"
                  className="p-button-primary p-button-sm"
                  onClick={handleEnviarRevision}
                />
              )}
            </div>
          </div>
          
          {/* Contenido de actividades */}
          <div className="p-4">
            {Array.isArray(actividades) && actividades.map((actividad) => {
              const beneficiariosActividad = getBeneficiariosPorActividad(actividad.id);
              return (
                <ActividadBeneficiarios
                  key={actividad.id}
                  actividad={actividad}
                  beneficiarios={beneficiariosActividad}
                  onAddBeneficiario={handleAddBeneficiario}
                  onEditBeneficiario={handleEditBeneficiario}
                  onDeleteBeneficiario={handleDeleteBeneficiario}
                  readonly={isAprobado}
                />
              );
            })}
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-content-between mt-4">
          <Button
            label="Volver a POA"
            icon="pi pi-arrow-left"
            onClick={() => router.push(`/proyectos/${projectUuid}/poa`)}
            className="p-button-outlined"
          />
        </div>
      </div>

      {/* Formulario de beneficiarios */}
      <BeneficiariosForm
        visible={formVisible}
        onHide={() => setFormVisible(false)}
        onSave={handleSaveBeneficiario}
        actividad={selectedActividad}
        beneficiarioEdit={beneficiarioEdit}
        catalogoBeneficiarios={catalogoBeneficiarios}
        beneficiariosExistentes={beneficiarios}
        readonly={isAprobado}
      />

      {/* Diálogo de observaciones */}
      <ObservacionDialog
        visible={observacionDialogVisible}
        onHide={() => setObservacionDialogVisible(false)}
        onSubmit={handleObservarBeneficiarios}
      />
    </>
  );
};

export default BeneficiariosPage;
