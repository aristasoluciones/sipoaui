'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Sidebar } from 'primereact/sidebar';
import { DataView } from 'primereact/dataview';
import { ProgramaOperativoAnualApi, ActividadPoaApi, ActividadPoa, SubactividadPoaApi, EstatusEtapa } from '@/types/proyectos.d';
import { TipoActividad, Entregable } from '@/types/catalogos';
import { useNotification } from '@/layout/context/notificationContext';
import { useProjectOperations } from '@/src/hooks/useProjectOperations';
import * as yup from 'yup';
import { formatApiError } from '../../../utils/apiErrors';
import { ProyectoService } from '@/src/services/proyecto';
import ObservacionDialog from '../ObservacionDialog';

// Función auxiliar para formatear fechas
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

interface Subactividad {
  id: string;
  subactividad: string;
  fechaInicio: Date | null;
  fechaTermino: Date | null;
  entregable: string | null;
  mesesContemplados: string[]; // Formato: ['2025-01', '2025-02', etc.]
}

// Interfaz para la UI que combina ActividadPoa con campos adicionales para la interfaz
interface ActividadUI extends Omit<ActividadPoa, 'tipoActividad'> {
  tipoActividad?: TipoActividad;
  subactividades: SubactividadPoaApi[];
  expandido: boolean;
  totalSubactividades: number;
}

interface PoaManagerProps {
  projectUuid: string;
  projectName?: string;
  poaData?: ProgramaOperativoAnualApi;
  actividades?: ActividadPoaApi[];
  tiposActividad?: TipoActividad[];
  entregables?: Entregable[];
  onCreateActividad?: (actividadData: any) => Promise<void>;
  onUpdateActividad?: (actividadId: number, actividadData: any) => Promise<void>;
  onDeleteActividad?: (actividadId: number) => Promise<void>;
  onCreateSubactividad?: (actividadId: number, subactividadData: any) => Promise<void>;
  onUpdateSubactividad?: (actividadId: number, subactividadId: number, subactividadData: any) => Promise<void>;
  onDeleteSubactividad?: (actividadId: number, subactividadId: number) => Promise<void>;
  readOnly?: boolean;
  onSolicitarRevision?: () => void;
  solicitandoRevision?: boolean;
  isEnRevision?: boolean;
  isAprobado?: boolean;
}

// Helper functions to convert catalog data to dropdown format
const getTiposActividadOptions = (tiposActividad: TipoActividad[]) => {
  if (!tiposActividad || !Array.isArray(tiposActividad)) return [];
  return tiposActividad
    .filter(item => item.estado === 'Activo')
    .map(item => ({ label: item.nombre, value: item.id.toString() }));
};

const getEntregablesOptions = (entregables: Entregable[]) => {
  if (!entregables || !Array.isArray(entregables)) return [];
  return entregables
    .filter(item => item.estado === 'Activo')
    .map(item => ({ label: item.nombre, value: item.id.toString() }));
};

// Esquema de validación para actividad
const actividadSchema = yup.object().shape({
  descripcion: yup
    .string()
    .required('La descripción de la actividad es obligatoria')
    .min(3, 'La descripción debe tener al menos 3 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  tipo_actividad_id: yup
    .number()
    .integer('El tipo de actividad debe ser un número entero')
    .required('El tipo de actividad es obligatorio')
    .positive('El tipo de actividad debe ser un número positivo')
});

// Esquema de validación para subactividad
const subactividadSchema = yup.object().shape({
  descripcion: yup
    .string()
    .required('La descripción de la subactividad es obligatoria')
    .min(3, 'La descripción debe tener al menos 3 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  tipo_actividad_id: yup
    .number()
    .integer('El tipo de actividad debe ser un número entero')
    .required('El tipo de actividad es obligatorio')
    .positive('El tipo de actividad debe ser un número positivo'),
  fecha_inicio: yup
    .date()
    .required('La fecha de inicio es obligatoria')
    .typeError('La fecha de inicio debe ser una fecha válida'),
  fecha_termino: yup
    .date()
    .required('La fecha de término es obligatoria')
    .typeError('La fecha de término debe ser una fecha válida')
    .min(yup.ref('fecha_inicio'), 'La fecha de término debe ser posterior a la fecha de inicio'),
  entregable_id: yup
    .number()
    .integer('El entregable debe ser un número entero')
    .required('El entregable es obligatorio')
    .positive('El entregable debe ser un número positivo')
});

// Componente integrado para el sidebar de subactividad
interface SubactividadSidebarProps {
  visible: boolean;
  onHide: () => void;
  subactividad: SubactividadPoaApi | null;
  tiposActividad: TipoActividad[];
  entregables: Entregable[];
  onSave: (data: any) => Promise<void>;
  isCreating: boolean;
  actividadId: number | null;
  poaId: string | number | null;
  projectUuid: string;
}

const SubactividadSidebar: React.FC<SubactividadSidebarProps> = ({
  visible,
  onHide,
  subactividad,
  tiposActividad,
  entregables,
  onSave,
  isCreating,
  actividadId,
  poaId,
  projectUuid
}) => {
  const { show } = useNotification();
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    descripcion: '',
    tipo_actividad_id: null as number | null,
    fecha_inicio: null as Date | null,
    fecha_termino: null as Date | null,
    entregable_id: null as number | null,
    meses_reporte: [] as string[]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validación en tiempo real usando useMemo para optimización
  const isFormValid = useMemo(() => {
    try {
      return subactividadSchema.isValidSync(formData);
    } catch {
      return false;
    }
  }, [formData]);

  // Función para obtener los meses entre dos fechas
  const getMesesEntreFechas = (inicio: Date | null, termino: Date | null): { label: string; value: string }[] => {
    if (!inicio || !termino || inicio > termino) return [];

    const meses = [];
    const current = new Date(inicio.getFullYear(), inicio.getMonth(), 1);

    while (current <= termino) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const monthName = current.toLocaleString('es-ES', { month: 'short' }).replace('.', '');
      const label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
      meses.push({ label, value: `${year}-${month}` });
      current.setMonth(current.getMonth() + 1);
    }

    return meses;
  };

  useEffect(() => {
    if (visible) {
      if (subactividad && !isCreating) {
        setFormData({
          descripcion: subactividad.descripcion,
          tipo_actividad_id: subactividad.tipo_actividad.id,
          fecha_inicio: new Date(subactividad.fecha_inicio),
          fecha_termino: new Date(subactividad.fecha_termino),
          entregable_id: subactividad?.entregable.id,
          meses_reporte: subactividad.meses_reporte
        });
      } else {
        setFormData({
          descripcion: '',
          tipo_actividad_id: null,
          fecha_inicio: null,
          fecha_termino: null,
          entregable_id: null,
          meses_reporte: []
        });
      }
      setValidationErrors({});
    }
  }, [visible, subactividad, isCreating]);

  // Validación detallada para mostrar errores en campos
  useEffect(() => {
    const validateForErrors = async () => {
      try {
        await subactividadSchema.validate(formData, { abortEarly: false });
        setValidationErrors({});
      } catch (error: any) {
        if (error.name === 'ValidationError') {
          const errors: Record<string, string> = {};
          error.inner.forEach((err: any) => {
            errors[err.path] = err.message;
          });
          setValidationErrors(errors);
        }
      }
    };
    validateForErrors();
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setValidationErrors({});

    try {
      // Validar con Yup
      await subactividadSchema.validate(formData, { abortEarly: false });

      const dataToSend = {
        descripcion: formData.descripcion,
        tipo_actividad_id: formData.tipo_actividad_id,
        fecha_inicio: formData.fecha_inicio?.toISOString().split('T')[0],
        fecha_termino: formData.fecha_termino?.toISOString().split('T')[0],
        entregable_id: formData.entregable_id,
        meses_reporte: formData.meses_reporte
      };

      await onSave(dataToSend);
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        // Errores de validación de Yup
        const errors: Record<string, string> = {};
        error.inner.forEach((err: any) => {
          errors[err.path] = err.message;
        });
        setValidationErrors(errors);
      } else {
        // Otros errores (API, etc.)
        const errorMessage = formatApiError(error);
        show({ severity: 'error', summary: 'Error', detail: errorMessage });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    // Dispara el submit del formulario usando el ref
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleCancel = () => {
    setValidationErrors({});
    onHide();
  };

  // Función para limpiar errores de validación al cambiar campos
  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  
  // Encabezado del sidebar con estilos conservados
  const customHeader = () => {
    return (
      <div className="flex align-items-center gap-2 py-2">
        <i className="pi pi-list text-xl text-primary-600"></i>
        <h5 className="text-xl font-semibold text-900 m-0">{isCreating ? 'Nueva Subactividad' : 'Editar Subactividad'}</h5>
      </div>
    );
  };

  return (
    <Sidebar
      visible={visible}
      onHide={handleCancel}
      position="right"
      className="w-full md:w-6"
      header={customHeader()}
      modal
      pt={{
        header: { className: 'border-bottom-1 surface-border' },
        content: { className: 'p-0' }
      }}
    >
       <div className="h-full flex flex-column">
        {/* Contenido del formulario */}
        <div className="flex-1 overflow-auto p-4">
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-column gap-4">
            <div>
              <label htmlFor="descripcion" className="block font-medium text-900 mb-2">
                Descripción <span className="text-red-600">*</span>
              </label>
              <InputTextarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, descripcion: e.target.value }));
                  clearFieldError('descripcion');
                }}
                placeholder="Describe la subactividad..."
                rows={3}
                className={`w-full ${validationErrors.descripcion ? 'p-invalid' : ''}`}
                required
              />
              {validationErrors.descripcion && (
                <small className="p-error block mt-1">{validationErrors.descripcion}</small>
              )}
            </div>

            <div>
              <label htmlFor="tipo_actividad" className="block font-medium text-900 mb-2">
                Tipo de Actividad <span className="text-red-600">*</span>
              </label>
              <Dropdown
                id="tipo_actividad"
                value={formData.tipo_actividad_id?.toString()}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, tipo_actividad_id: e.value ? parseInt(e.value) : null }));
                  clearFieldError('tipo_actividad_id');
                }}
                options={tiposActividad && Array.isArray(tiposActividad) ? tiposActividad.filter(t => t.estado === 'Activo').map(t => ({ label: t.nombre, value: t.id.toString() })) : []}
                placeholder="Selecciona un tipo"
                className={`w-full ${validationErrors.tipo_actividad_id ? 'p-invalid' : ''}`}
                showClear
              />
              {validationErrors.tipo_actividad_id && (
                <small className="p-error block mt-1">{validationErrors.tipo_actividad_id}</small>
              )}
            </div>

            <div className="grid ml-1" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label htmlFor="fecha_inicio" className="block font-medium text-900 mb-2">
                  Fecha Inicio <span className="text-red-600">*</span>
                </label>
                <Calendar
                  id="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, fecha_inicio: e.value as Date | null }));
                    clearFieldError('fecha_inicio');
                    clearFieldError('fecha_termino'); // Limpiar error de fecha_termino también
                  }}
                  dateFormat="dd/mm/yy"
                  placeholder="Selecciona fecha"
                  className={`w-full ${validationErrors.fecha_inicio ? 'p-invalid' : ''}`}
                  showIcon
                />
                {validationErrors.fecha_inicio && (
                  <small className="p-error block mt-1">{validationErrors.fecha_inicio}</small>
                )}
              </div>

              <div>
                <label htmlFor="fecha_termino" className="block font-medium text-900 mb-2">
                  Fecha Término <span className="text-red-600">*</span>
                </label>
                <Calendar
                  id="fecha_termino"
                  value={formData.fecha_termino}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, fecha_termino: e.value as Date | null }));
                    clearFieldError('fecha_termino');
                    clearFieldError('fecha_inicio'); // Limpiar error de fecha_inicio también
                  }}
                  dateFormat="dd/mm/yy"
                  placeholder="Selecciona fecha"
                  className={`w-full ${validationErrors.fecha_termino ? 'p-invalid' : ''}`}
                  showIcon
                />
                {validationErrors.fecha_termino && (
                  <small className="p-error block mt-1">{validationErrors.fecha_termino}</small>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="entregable" className="block font-medium text-900 mb-2">
                Entregable <span className="text-red-600">*</span>
              </label>
              <Dropdown
                id="entregable"
                value={formData.entregable_id?.toString()}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, entregable_id: e.value ? parseInt(e.value) : null }));
                  clearFieldError('entregable_id');
                }}
                options={entregables && Array.isArray(entregables) ? entregables.filter(e => e.estado === 'Activo').map(e => ({ label: e.nombre, value: e.id.toString() })) : []}
                placeholder="Selecciona un entregable"
                className={`w-full ${validationErrors.entregable_id ? 'p-invalid' : ''}`}
                showClear
              />
              {validationErrors.entregable_id && (
                <small className="p-error block mt-1">{validationErrors.entregable_id}</small>
              )}
            </div>

            <div>
              <label className="block font-medium text-900 mb-3">
                Meses de Reporte
              </label>
              <div className="flex flex-wrap gap-2">
                {getMesesEntreFechas(formData.fecha_inicio, formData.fecha_termino).map(mes => {
                  const isSelected = formData.meses_reporte.includes(mes.value);
                  return (
                    <div
                      key={mes.value}
                      className={`cursor-pointer border-1 border-round-lg px-3 py-2 transition-all transition-duration-200 select-none ${
                        isSelected
                          ? 'bg-primary-50 border-primary-400 text-primary-800 shadow-3 transform scale-105'
                          : 'bg-white border-200 text-700 hover:bg-primary-25 hover:border-primary-300 hover:shadow-2 hover:transform hover:scale-102'
                      }`}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          meses_reporte: isSelected
                            ? prev.meses_reporte.filter(m => m !== mes.value)
                            : [...prev.meses_reporte, mes.value]
                        }));
                      }}
                    >
                      <div className="flex align-items-center gap-2">
                        <i className={`pi pi-circle-fill text-xs transition-colors transition-duration-200 ${
                          isSelected ? 'text-primary-600' : 'text-gray-400'
                        }`}></i>
                        <span className="font-medium text-sm">{mes.label}</span>
                        {isSelected && (
                          <i className="pi pi-check text-xs text-primary-600 ml-1 animate-fadein"></i>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {getMesesEntreFechas(formData.fecha_inicio, formData.fecha_termino).length === 0 && (
                <div className="text-center py-5 border-1 border-dashed border-300 border-round-lg bg-gray-50 mt-3">
                  <i className="pi pi-calendar-times text-4xl text-gray-400 mb-3 block"></i>
                  <p className="text-600 mb-1 font-medium">No hay meses disponibles</p>
                  <small className="text-500">Selecciona fechas de inicio y término para habilitar la selección de meses</small>
                </div>
              )}
            </div>
          </form>
        </div>
        {/* Botones de acción */}
          <div className="mt-auto border-top-1 surface-border p-4">
            <div className="flex gap-2 justify-content-between md:justify-content-end">
              <Button
                type="button"
                label="Cancelar"
                icon="pi pi-times"
                severity="secondary"
                outlined
                onClick={handleCancel}
              />
              <Button
                onClick={handleSave}
                label={isCreating ? "Crear" : "Guardar"}
                icon="pi pi-check"
                loading={isSaving}
                disabled={!isFormValid || isSaving}
              />
            </div>
        </div>
      </div>
    </Sidebar>
  );
};

const PoaManager: React.FC<PoaManagerProps> = ({ 
  projectUuid, 
  projectName, 
  poaData,
  actividades: actividadesProp = [],
  tiposActividad = [],
  entregables = [],
  onCreateActividad,
  onUpdateActividad,
  onDeleteActividad,
  onCreateSubactividad,
  onUpdateSubactividad,
  onDeleteSubactividad,
  readOnly = false,
  onSolicitarRevision,
  solicitandoRevision = false,
  isEnRevision = false,
  isAprobado = false
}) => {
  const router = useRouter();
  const { show } = useNotification();
  const [actividades, setActividades] = useState<ActividadUI[]>([]);
  const [editingRowId, setEditingRowId] = useState<number | null>(null); // Nueva: edición por fila completa
  const [editingSubactividadId, setEditingSubactividadId] = useState<number | null>(null);
  const [tempActividadText, setTempActividadText] = useState('');
  const [tempSubactividadText, setTempSubactividadText] = useState('');
  const [tempTipoActividad, setTempTipoActividad] = useState<string | null>(null);
  const [isCreatingActividad, setIsCreatingActividad] = useState(false);
  const [isSavingRow, setIsSavingRow] = useState(false); // Indicador de guardado para edición por fila


  // Estados para sidebar de subactividades
  const [sidebarSubactividadVisible, setSidebarSubactividadVisible] = useState(false);
  const [editingSubactividadData, setEditingSubactividadData] = useState<SubactividadPoaApi | null>(null);
  const [isCreatingSubactividad, setIsCreatingSubactividad] = useState(false);
  const [selectedActividadId, setSelectedActividadId] = useState<number | null>(null);
  const [isLoadingSubactividades, setIsLoadingSubactividades] = useState<Record<number, boolean>>({});

  // Estados para aprobación y observación
  const [showObservacionDialog, setShowObservacionDialog] = useState(false);

  const { handleAprobar, handleObservar } = useProjectOperations({
    isCreating: false,
    selectedProject: null, // No necesitamos el proyecto completo aquí
    onSuccess: () => {
      // Recargar datos después de aprobar/observar
      window.location.reload(); // O implementar un callback más elegante
    },
    showSuccessMessages: true
  });

  useEffect(() => {
    // Cargar actividades desde props
    loadActividadesFromProps();
  }, [actividadesProp]);

  const loadActividadesFromProps = () => {
    // Convertir ActividadPoaApi[] a ActividadUI[]
    const convertedActividades: ActividadUI[] = actividadesProp.map(apiAct => ({
      id: apiAct.id,
      descripcion: apiAct.descripcion,
      tipoActividad: apiAct.tipo_actividad ? {
        id: apiAct.tipo_actividad.id,
        nombre: apiAct.tipo_actividad.nombre,
        estado: apiAct.tipo_actividad.estatus,
        createdAt: apiAct.tipo_actividad.created_at,
        updatedAt: apiAct.tipo_actividad.updated_at,
        descripcion: apiAct.tipo_actividad.descripcion
      } : undefined,
      orden: apiAct.orden,
      createdAt: apiAct.created_at,
      updatedAt: apiAct.updated_at,
      expandido: false, // Por defecto todas las actividades están colapsadas
      subactividades: [], // Las subactividades se cargarán por separado
      totalSubactividades: apiAct.total_subactividades // Usar el campo de la API
    }));
    setActividades(convertedActividades);
  };

  // Generar meses abreviados con año, filtrados por rango de fechas
  const getMesesAnioActualAbreviados = (fechaInicio: Date | null, fechaTermino: Date | null): { label: string; value: string }[] => {
    const currentYear = new Date().getFullYear();
    const mesesAbreviados = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    const todosLosMeses = mesesAbreviados.map((mes, index) => ({
      label: `${mes} ${currentYear}`,
      value: `${currentYear}-${String(index + 1).padStart(2, '0')}`,
      mesIndex: index
    }));

    // Si no hay fechas definidas, mostrar todos los meses
    if (!fechaInicio || !fechaTermino) {
      return todosLosMeses;
    }

    // Filtrar meses dentro del rango
    const inicio = new Date(fechaInicio);
    const termino = new Date(fechaTermino);
    
    return todosLosMeses.filter(mes => {
      const mesInicio = new Date(currentYear, mes.mesIndex, 1);
      const mesFin = new Date(currentYear, mes.mesIndex + 1, 0);
      
      // El mes está dentro del rango si:
      // - El inicio del mes está antes o igual al término
      // - El fin del mes está después o igual al inicio
      return mesInicio <= termino && mesFin >= inicio;
    });
  }; 

  const handleAddActividad = () => {
    // Crear actividad temporal para edición inline
    const tempId = Date.now(); // Usar timestamp como ID temporal
    const newActividad: ActividadUI = {
      id: tempId,
      descripcion: '',
      tipoActividad: undefined,
      orden: actividades.length,
      createdAt: new Date().toISOString(),
      expandido: false,
      subactividades: [],
      totalSubactividades: 0
    };

    setActividades(prev => [newActividad, ...prev]);
    setEditingRowId(tempId);
    setTempActividadText('');
    setTempTipoActividad(null);
    setIsCreatingActividad(true);
  };

  const handleSaveNewActividad = async () => {
    setIsSavingRow(true); // Activar indicador de guardado

    // Asegurar que ambos campos vengan completos antes
    if (!tempActividadText.trim() || !tempTipoActividad) {
      show({ severity: 'warn', summary: 'Campos requeridos', detail: 'La descripción y el tipo de actividad son obligatorios' });
      return;
    }

    try {
     
      // Preparar datos para validación
      const actividadData = {
        descripcion: tempActividadText.trim(),
        tipo_actividad_id: tempTipoActividad ? parseInt(tempTipoActividad) : null
      };

      // Validar con Yup
      await actividadSchema.validate(actividadData, { abortEarly: false });

      // Crear la actividad optimistamente en el estado local primero
      const tempId = Date.now();
      const newActividadLocal: ActividadUI = {
        id: tempId,
        descripcion: tempActividadText.trim(),
        tipoActividad: undefined,
        orden: actividades.length,
        createdAt: new Date().toISOString(),
        expandido: false, // Por defecto todas las actividades están colapsadas
        subactividades: [],
        totalSubactividades: 0
      };

      // Intentar guardar en el servidor
      await onCreateActividad?.({
        descripcion: tempActividadText.trim(),
        tipo_actividad_id: parseInt(tempTipoActividad!),
        orden: 0 // Las nuevas actividades van al inicio
      });

      // Éxito: actualizar desde props del padre (que ahora incluye la nueva actividad)
      loadActividadesFromProps();
      setIsCreatingActividad(false);
      setEditingRowId(null);
      setTempActividadText('');
      setTempTipoActividad(null);

      show({ severity: 'success', summary: 'Éxito', detail: 'Actividad creada exitosamente' });

    } catch (error: any) {
      // Error: remover la actividad temporal del estado local
      const tempId = Date.now();
      setActividades(prev => prev.filter(act => act.id !== tempId));

      // Usar formatApiError para formatear cualquier tipo de error
      const errorMessage = formatApiError(error);
      show({ severity: 'error', summary: 'Error', detail: errorMessage });

      // No limpiamos los estados aquí para mantener la fila editable
    } finally {
      setIsSavingRow(false); // Desactivar indicador de guardado
    }
  };

  const handleCancelNewActividad = () => {
    // Remover la actividad temporal
    setActividades(prev => prev.filter(act => act.id !== editingRowId));
    setEditingRowId(null);
    setTempActividadText('');
    setTempTipoActividad(null);
    setIsCreatingActividad(false);
  };

  const handleAddSubactividad = (actividadId: number) => {
    setSelectedActividadId(actividadId);
    setEditingSubactividadData(null);
    setIsCreatingSubactividad(true);
    setSidebarSubactividadVisible(true);
  };

  // Función para cargar subactividades de una actividad desde la API
  const loadSubactividades = async (actividadId: number) => {
    if (!poaData?.id) return;

    setIsLoadingSubactividades(prev => ({ ...prev, [actividadId]: true }));
    try {
      const response = await ProyectoService.getSubactividadPorActividadId(
        projectUuid,
        poaData.id,
        actividadId
      );
      // Asumir que la respuesta es un array de subactividades
      const subactividades = Array.isArray(response) ? response : [];
      
      // Actualizar las subactividades de la actividad específica
      setActividades(prev => prev.map(act => 
        act.id === actividadId 
          ? { ...act, subactividades }
          : act
      ));
    } catch (error) {
      show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las subactividades' });
      // En caso de error, limpiar las subactividades de la actividad específica
      setActividades(prev => prev.map(act => 
        act.id === actividadId 
          ? { ...act, subactividades: [] }
          : act
      ));
    } finally {
      setIsLoadingSubactividades(prev => ({ ...prev, [actividadId]: false }));
    }
  };  // Función para abrir el sidebar de edición de subactividad
  const handleEditSubactividad = (subactividad: SubactividadPoaApi) => {
    setEditingSubactividadData(subactividad);
    setIsCreatingSubactividad(false);
    setSidebarSubactividadVisible(true);
  };

  // Función para guardar subactividad
  const handleSaveSubactividad = async (subactividadData: any) => {

    if (!selectedActividadId || !poaData?.id) return;
 
    try {
      if (isCreatingSubactividad) {
        const newSubactividad = await ProyectoService.createSubactividadPorActividadId(
          projectUuid,
          poaData.id,
          selectedActividadId,
          subactividadData
        );
        // Agregar la nueva subactividad a la actividad específica
        setActividades(prev => prev.map(act => 
          act.id === selectedActividadId 
            ? { 
                ...act, 
                subactividades: [...act.subactividades, newSubactividad],
                totalSubactividades: act.totalSubactividades + 1
              }
            : act
        ));
        show({ severity: 'success', summary: 'Éxito', detail: 'Subactividad creada exitosamente' });
      } else if (editingSubactividadData) {
        await ProyectoService.updateSubactividadPorActividadId(
          projectUuid,
          poaData.id,
          selectedActividadId,
          editingSubactividadData.id,
          subactividadData
        );
        // Actualizar la subactividad en la actividad específica
        setActividades(prev => prev.map(act => 
          act.id === selectedActividadId 
            ? { 
                ...act, 
                subactividades: act.subactividades.map(sub => 
                  sub.id === editingSubactividadData.id 
                    ? { ...sub, ...subactividadData }
                    : sub
                )
              }
            : act
        ));
        show({ severity: 'success', summary: 'Éxito', detail: 'Subactividad actualizada exitosamente' });
      }
      
      setSidebarSubactividadVisible(false);
    } catch (error: any) {
      const errorMessage = formatApiError(error);
      show({ severity: 'error', summary: 'Error', detail: errorMessage });
    }
  };

  // Función para eliminar subactividad
  const handleDeleteSubactividadApi = async (subactividadId: number) => {
    if (!selectedActividadId || !poaData?.id) return;

    confirmDialog({
      message: '¿Está seguro de eliminar esta subactividad?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await ProyectoService.deleteSubactividadPorActividadId(
            projectUuid,
            poaData.id,
            selectedActividadId,
            subactividadId
          );
          // Eliminar la subactividad de la actividad específica y decrementar contador
          setActividades(prev => prev.map(act => 
            act.id === selectedActividadId 
              ? { 
                  ...act, 
                  subactividades: act.subactividades.filter(sub => sub.id !== subactividadId),
                  totalSubactividades: Math.max(0, act.totalSubactividades - 1)
                }
              : act
          ));
          show({ severity: 'success', summary: 'Eliminado', detail: 'Subactividad eliminada exitosamente' });
        } catch (error: any) {
          const errorMessage = formatApiError(error);
          show({ severity: 'error', summary: 'Error', detail: errorMessage });
        }
      }
    });
  };

  const handleDeleteActividad = (actividadId: number) => {
    confirmDialog({
      message: '¿Está seguro de eliminar esta actividad y todas sus subactividades?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: () => {
        setActividades(prev => prev.filter(act => act.id !== actividadId));
        show({ severity: 'success', summary: 'Eliminado', detail: 'Actividad eliminada' });
      }
    });
  };

  const handleDeleteSubactividad = (actividadId: number, subactividadId: number) => {
    confirmDialog({
      message: '¿Está seguro de eliminar esta subactividad?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: () => {
        setActividades(prev => prev.map(act => {
          if (act.id === actividadId) {
            return {
              ...act,
              subactividades: act.subactividades.filter(sub => sub.id !== subactividadId)
            };
          }
          return act;
        }));
        show({ severity: 'success', summary: 'Eliminado', detail: 'Subactividad eliminada' });
      }
    });
  };

  const updateActividadField = (actividadId: number, field: keyof ActividadUI, value: any) => {
    setActividades(prev => prev.map(act => 
      act.id === actividadId ? { ...act, [field]: value } : act
    ));
  };

  const updateSubactividadField = (actividadId: number, subactividadId: number, field: keyof SubactividadPoaApi, value: any) => {
    setActividades(prev => prev.map(act => {
      if (act.id === actividadId) {
        return {
          ...act,
          subactividades: act.subactividades.map(sub => {
            if (sub.id === subactividadId) {
              const updated = { ...sub, [field]: value };
              
              // Si cambian las fechas, filtrar los meses contemplados que ya no estén en el rango
              if (field === 'fecha_inicio' || field === 'fecha_termino') {
                const mesesAnteriores = sub.meses_reporte;
                
                if (updated.fecha_inicio && updated.fecha_termino) {
                  // Convertir fechas string a Date para comparación
                  const fechaInicio = new Date(updated.fecha_inicio);
                  const fechaTermino = new Date(updated.fecha_termino);
                  
                  if (fechaInicio <= fechaTermino) {
                    // Fechas válidas: filtrar meses que estén dentro del rango
                    const mesesValidos = getMesesAnioActualAbreviados(fechaInicio, fechaTermino).map(m => m.value);
                    updated.meses_reporte = updated.meses_reporte.filter((mes: string) => mesesValidos.includes(mes));
                    
                    // Notificar si se eliminaron meses
                    const mesesEliminados = mesesAnteriores.filter((mes: string) => !updated.meses_reporte.includes(mes));
                    if (mesesEliminados.length > 0) {
                      show({
                        severity: 'warn',
                        summary: 'Meses ajustados',
                        detail: `Se eliminaron ${mesesEliminados.length} mes(es) que ya no están en el rango de fechas.`,
                        life: 5000
                      });
                    }
                  }
                } else {
                  // Fechas inválidas o incompletas: limpiar todos los meses
                  updated.meses_reporte = [];
                  
                  if (mesesAnteriores.length > 0) {
                    show({
                      severity: 'info',
                      summary: 'Meses limpiados',
                      detail: 'Los meses seleccionados se limpiaron porque el rango de fechas no es válido.',
                      life: 4000
                    });
                  }
                }
              }
              
              return updated;
            }
            return sub;
          })
        };
      }
      return act;
    }));
  };

  // Handlers para aprobación y observación
  const handleAprobarPoa = async () => {
    try {
      await handleAprobar(projectUuid);
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleObservarPoa = async (observacion: string) => {
    try {
      await handleObservar(projectUuid, observacion);
      setShowObservacionDialog(false);
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  // Verificar si el POA está en revisión
  const isPoaEnRevision = poaData?.estatus === EstatusEtapa.EN_REVISION;

  const toggleExpand = async (actividadId: number) => {
    const actividad = actividades.find(act => act.id === actividadId);
    const willExpand = !actividad?.expandido;

    setActividades(prev => prev.map(act => 
      act.id === actividadId ? { ...act, expandido: willExpand } : act
    ));

    // Si se está expandiendo, cargar subactividades desde la API
    if (willExpand) {
      setSelectedActividadId(actividadId);
      await loadSubactividades(actividadId);
    }
  };

  // Función para iniciar edición por fila
  const startRowEditing = (actividadId: number) => {
    const actividad = actividades.find(act => act.id === actividadId);
    if (actividad) {
      setEditingRowId(actividadId);
      setTempActividadText(actividad.descripcion);
      setTempTipoActividad(actividad.tipoActividad?.id.toString() || null);
    }
  };

  // Función para cancelar edición por fila
  const cancelRowEditing = () => {
    setEditingRowId(null);
    setTempActividadText('');
    setTempTipoActividad(null);
  };

  // Función para guardar edición por fila
  const saveRowEditing = async () => {
    if (!editingRowId) return;

    setIsSavingRow(true); // Activar indicador de guardado

    try {
      // Validar campos
      if (!tempActividadText.trim()) {
        show({ severity: 'warn', summary: 'Campo requerido', detail: 'La descripción de la actividad es obligatoria' });
        return;
      }

      if (!tempTipoActividad) {
        show({ severity: 'warn', summary: 'Campo requerido', detail: 'El tipo de actividad es obligatorio' });
        return;
      }

      // Actualizar la actividad
      updateActividadField(editingRowId, 'descripcion', tempActividadText.trim());
      // Para el tipo de actividad, necesitamos encontrar el objeto TipoActividad completo
      const tipoActividadSeleccionado = tiposActividad.find(t => t.id.toString() === tempTipoActividad);
      if (tipoActividadSeleccionado) {
        updateActividadField(editingRowId, 'tipoActividad', tipoActividadSeleccionado);
      }

      setEditingRowId(null);
      setTempActividadText('');
      setTempTipoActividad(null);

      show({ severity: 'success', summary: 'Éxito', detail: 'Actividad actualizada exitosamente' });
    } catch (error) {
      show({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la actividad' });
    } finally {
      setIsSavingRow(false); // Desactivar indicador de guardado
    }
  };

  const handleSubactividadBlur = (actividadId: number) => {
    if (editingSubactividadId && tempSubactividadText.trim()) {
      updateSubactividadField(actividadId, editingSubactividadId, 'descripcion', tempSubactividadText.trim());
    }
    setEditingSubactividadId(null);
    setTempSubactividadText('');
  };


  const getTipoActividadLabel = (tipoActividad: TipoActividad | undefined) => {
    if (!tipoActividad) return '';
    return tipoActividad.nombre;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
  };

  // Función para renderizar el header del DataView con acciones y columnas
  const renderDataViewHeader = () => (
    <>
      {/* Header con acciones y estado */}
      <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
        <div className="flex align-items-center gap-2 flex-wrap">
          {isEnRevision && (
            <Tag value="En Revisión" severity="warning" icon="pi pi-clock" />
          )}
          {isAprobado && (
            <Tag value="Aprobado" severity="success" icon="pi pi-check" />
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Desktop buttons */}
          <div className="hidden md:flex gap-2">
            {onSolicitarRevision && actividadesProp.length > 0 && !readOnly && (
              <Button
                label="Solicitar Revisión"
                icon="pi pi-send"
                onClick={onSolicitarRevision}
                loading={solicitandoRevision}
                className="p-button-outlined"
              />
            )}
            {isPoaEnRevision && (
              <>
                <Button
                  label="Observar"
                  icon="pi pi-eye"
                  severity="warning"
                  onClick={() => setShowObservacionDialog(true)}
                  className="p-button-outlined"
                />
                <Button
                  label="Aprobar"
                  icon="pi pi-check"
                  severity="success"
                  onClick={handleAprobarPoa}
                />
              </>
            )}
            <Button
              label="Nueva Actividad"
              icon="pi pi-plus"
              size="small"
              onClick={handleAddActividad}
              disabled={readOnly}
            />
          </div>

          {/* Mobile buttons - icon only */}
          <div className="flex md:hidden gap-1">
            {onSolicitarRevision && actividadesProp.length > 0 && !readOnly && (
              <Button
                icon="pi pi-send"
                tooltip="Solicitar Revisión"
                tooltipOptions={{ position: 'bottom' }}
                onClick={onSolicitarRevision}
                loading={solicitandoRevision}
                className="p-button-outlined p-button-sm"
              />
            )}
            {isPoaEnRevision && (
              <>
                <Button
                  icon="pi pi-eye"
                  tooltip="Observar"
                  tooltipOptions={{ position: 'bottom' }}
                  severity="warning"
                  onClick={() => setShowObservacionDialog(true)}
                  className="p-button-outlined p-button-sm"
                />
                <Button
                  icon="pi pi-check"
                  tooltip="Aprobar"
                  tooltipOptions={{ position: 'bottom' }}
                  severity="success"
                  onClick={handleAprobarPoa}
                  className="p-button-sm"
                />
              </>
            )}
            <Button
              icon="pi pi-plus"
              tooltip="Nueva Actividad"
              tooltipOptions={{ position: 'bottom' }}
              size="small"
              onClick={handleAddActividad}
              disabled={readOnly}
              className="p-button-sm"
            />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {actividades.length === 0 ? (
        // Zero State cuando no hay actividades
        <>
          <div className="flex flex-column align-items-center justify-content-center p-2 text-center border-2 border-dashed border-300 border-round-lg bg-white">
            <i className="pi pi-list text-6xl text-primary mb-3"></i>
            <h3 className="text-xl font-semibold text-900 mb-2">No hay actividades</h3>
            <p className="text-600 mb-4">
              Aún no se han definido actividades para este Programa Operativo Anual.
              Comienza creando tu primera actividad para organizar el trabajo.
            </p>
            <Button
              label="Crear Primera Actividad"
              icon="pi pi-plus"
              onClick={handleAddActividad}
              size="large"
            />
          </div>
        </>
      ) : (
        // Contenido normal cuando hay actividades
        <div className="">
          {/* DataView con Master-Detail */}
          <DataView
            value={actividades}
            layout="list"
            paginator
            rows={10}
            itemTemplate={(actividad) => {
              const actIndex = actividades.indexOf(actividad);
              return (
                <div key={actividad.id} style={{ width: '100%' }}>
                  {/* Fila de Actividad - Desktop */}
                  <div 
                    className="px-2 py-1 hover:surface-100 transition-colors transition-duration-150 hidden md:block"
                    style={{ backgroundColor: actIndex % 2 === 0 ? 'var(--surface-0)' : 'var(--surface-50)' }}
                  >
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '36px minmax(300px, 500px) minmax(140px, 200px) 1fr 60px',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      {/* Botón expandir/colapsar */}
                      <div className="flex align-items-center justify-content-center">
                        <Button
                          icon={actividad.expandido ? 'pi pi-chevron-down' : 'pi pi-chevron-right'}
                          className="p-button-text p-button-sm p-0"
                          style={{ width: '1.75rem', height: '1.75rem' }}
                          onClick={() => toggleExpand(actividad.id)}
                        />
                      </div>

                      {/* Actividad */}
                      <div>
                        {editingRowId === actividad.id ? (
                          <InputTextarea
                            value={tempActividadText}
                            onChange={(e) => setTempActividadText(e.target.value)}
                            placeholder="Escriba la actividad..."
                            rows={1}
                            autoResize
                            className="w-full p-inputtext-sm"
                          />
                        ) : (
                          <div
                            onDoubleClick={() => startRowEditing(actividad.id)}
                            className="p-2 cursor-pointer hover:surface-200 border-round transition-colors transition-duration-150"
                            style={{ minHeight: '2.5rem', display: 'flex', alignItems: 'center' }}
                          >
                            <span className="text-900">
                              {actividad.descripcion || <span className="text-400">Doble click para editar...</span>}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tipo de Actividad */}
                      <div>
                        {editingRowId === actividad.id ? (
                          <Dropdown
                            value={tempTipoActividad}
                            onChange={(e) => setTempTipoActividad(e.value)}
                            options={getTiposActividadOptions(tiposActividad)}
                            placeholder="Tipo..."
                            className="w-full p-inputtext-sm"
                            showClear
                          />
                        ) : (
                          <div
                            onDoubleClick={() => startRowEditing(actividad.id)}
                            className="p-2 cursor-pointer hover:surface-200 border-round transition-colors transition-duration-150"
                            style={{ minHeight: '2.5rem', display: 'flex', alignItems: 'center' }}
                          >
                            <span className="text-900">
                              {getTipoActividadLabel(actividad.tipoActividad) || <span className="text-400">Doble click...</span>}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Badge de subactividades */}
                      <div className="flex align-items-center gap-2">
                        <Badge 
                          value={actividad.totalSubactividades} 
                          severity="info"
                          className="text-xs"
                        />
                        <span className="text-600 text-xs">subactividades</span>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-1 justify-content-end">
                        {editingRowId === actividad.id ? (
                          <>
                            <Button
                              icon={isSavingRow ? "" : "pi pi-check"}
                              className="p-button-text p-button-sm p-button-success p-0"
                              tooltip={isCreatingActividad ? "Guardar actividad" : "Guardar cambios"}
                              tooltipOptions={{ position: 'top' }}
                              onClick={isCreatingActividad ? handleSaveNewActividad : saveRowEditing}
                              style={{ width: '1.75rem', height: '1.75rem' }}
                              disabled={!tempActividadText.trim() || !tempTipoActividad || isSavingRow}
                              loading={isSavingRow}
                            />
                            <Button
                              icon="pi pi-times"
                              className="p-button-text p-button-sm p-button-danger p-0"
                              tooltip="Cancelar edición"
                              tooltipOptions={{ position: 'top' }}
                              onClick={isCreatingActividad ? handleCancelNewActividad : cancelRowEditing}
                              style={{ width: '1.75rem', height: '1.75rem' }}
                              disabled={isSavingRow}
                            />
                          </>
                        ) : (
                          <>
                            <Button
                              icon="pi pi-pencil"
                              className="p-button-text p-button-sm p-button-secondary p-0"
                              tooltip="Editar actividad"
                              tooltipOptions={{ position: 'top' }}
                              onClick={() => startRowEditing(actividad.id)}
                              style={{ width: '1.75rem', height: '1.75rem' }}
                              disabled={readOnly}
                            />
                            <Button
                              icon="pi pi-plus"
                              className="p-button-text p-button-sm p-button-success p-0"
                              tooltip="Agregar subactividad"
                              tooltipOptions={{ position: 'top' }}
                              onClick={() => handleAddSubactividad(actividad.id)}
                              style={{ width: '1.75rem', height: '1.75rem' }}
                              disabled={readOnly}
                            />
                            <Button
                              icon="pi pi-trash"
                              className="p-button-text p-button-sm p-button-danger p-0"
                              tooltip="Eliminar actividad"
                              tooltipOptions={{ position: 'top' }}
                              onClick={() => handleDeleteActividad(actividad.id)}
                              style={{ width: '1.75rem', height: '1.75rem' }}
                              disabled={readOnly}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fila de Actividad - Mobile */}
                  <div 
                    className="p-3 border-bottom-1 surface-border hover:surface-100 transition-colors transition-duration-150 block md:hidden"
                    style={{ backgroundColor: actIndex % 2 === 0 ? 'var(--surface-0)' : 'var(--surface-50)' }}
                  >
                    <div className="flex flex-column gap-3">
                      {/* Header con expandir y acciones */}
                      <div className="flex justify-content-between align-items-start">
                        <div className="flex align-items-center gap-2">
                          <Button
                            icon={actividad.expandido ? 'pi pi-chevron-down' : 'pi pi-chevron-right'}
                            className="p-button-text p-button-sm p-0"
                            style={{ width: '1.75rem', height: '1.75rem' }}
                            onClick={() => toggleExpand(actividad.id)}
                          />
                          <Badge 
                            value={actividad.totalSubactividades} 
                            severity="info"
                            className="text-xs"
                          />
                        </div>
                        <div className="flex gap-1">
                          {editingRowId === actividad.id ? (
                            <>
                              <Button
                                icon={isSavingRow ? "" : "pi pi-check"}
                                className="p-button-text p-button-sm p-button-success p-0"
                                tooltip={isCreatingActividad ? "Guardar actividad" : "Guardar cambios"}
                                tooltipOptions={{ position: 'top' }}
                                onClick={isCreatingActividad ? handleSaveNewActividad : saveRowEditing}
                                style={{ width: '1.75rem', height: '1.75rem' }}
                                disabled={!tempActividadText.trim() || !tempTipoActividad || isSavingRow}
                                loading={isSavingRow}
                              />
                              <Button
                                icon="pi pi-times"
                                className="p-button-text p-button-sm p-button-danger p-0"
                                tooltip="Cancelar edición"
                                tooltipOptions={{ position: 'top' }}
                                onClick={isCreatingActividad ? handleCancelNewActividad : cancelRowEditing}
                                style={{ width: '1.75rem', height: '1.75rem' }}
                                disabled={isSavingRow}
                              />
                            </>
                          ) : (
                            <>
                              <Button
                                icon="pi pi-pencil"
                                className="p-button-text p-button-sm p-button-secondary p-0"
                                tooltip="Editar actividad"
                                tooltipOptions={{ position: 'top' }}
                                onClick={() => startRowEditing(actividad.id)}
                                style={{ width: '1.75rem', height: '1.75rem' }}
                                disabled={readOnly}
                              />
                              <Button
                                icon="pi pi-plus"
                                className="p-button-text p-button-sm p-button-success p-0"
                                tooltip="Agregar subactividad"
                                tooltipOptions={{ position: 'top' }}
                                onClick={() => handleAddSubactividad(actividad.id)}
                                style={{ width: '1.75rem', height: '1.75rem' }}
                                disabled={readOnly}
                              />
                              <Button
                                icon="pi pi-trash"
                                className="p-button-text p-button-sm p-button-danger p-0"
                                tooltip="Eliminar actividad"
                                tooltipOptions={{ position: 'top' }}
                                onClick={() => handleDeleteActividad(actividad.id)}
                                style={{ width: '1.75rem', height: '1.75rem' }}
                                disabled={readOnly}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Contenido de la actividad */}
                      <div className="flex flex-column gap-2 pl-4">
                        <div>
                          <div className="text-600 text-xs font-semibold mb-1">Actividad:</div>
                          {editingRowId === actividad.id ? (
                            <InputTextarea
                              value={tempActividadText}
                              onChange={(e) => setTempActividadText(e.target.value)}
                              placeholder="Escriba la actividad..."
                              rows={2}
                              autoResize
                              className="w-full p-inputtext-sm"
                            />
                          ) : (
                            <div
                              onClick={() => startRowEditing(actividad.id)}
                              className="p-2 cursor-pointer hover:surface-200 border-round transition-colors transition-duration-150"
                            >
                              <span className="text-900">
                                {actividad.descripcion || <span className="text-400">Toca para editar...</span>}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-600 text-xs font-semibold mb-1">Tipo:</div>
                          {editingRowId === actividad.id ? (
                            <Dropdown
                              value={tempTipoActividad}
                              onChange={(e) => setTempTipoActividad(e.value)}
                              options={getTiposActividadOptions(tiposActividad)}
                              placeholder="Tipo..."
                              className="w-full p-inputtext-sm"
                              showClear
                            />
                          ) : (
                            <div
                              onClick={() => startRowEditing(actividad.id)}
                              className="p-2 cursor-pointer hover:surface-200 border-round transition-colors transition-duration-150"
                            >
                              <span className="text-900">
                                {getTipoActividadLabel(actividad.tipoActividad) || <span className="text-400">Toca para editar...</span>}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección de Subactividades */}
                  {actividad.expandido && (
                    <div className="border-1 surface-border border-round mx-3 my-2">
                      {/* Header de subactividades */}
                      <div className="surface-100 px-3 py-2 border-bottom-1 surface-border">
                        <div className="flex justify-content-between align-items-center">
                          <div className="flex align-items-center gap-2">
                            <i className="pi pi-list text-primary"></i>
                            <h6 className="text-sm font-semibold text-900 m-0">Subactividades</h6>
                            {isLoadingSubactividades[actividad.id] && <ProgressSpinner style={{ width: '20px', height: '20px' }} />}
                          </div>
                          <div className="flex gap-2">
                            {/* Desktop button */}
                            <div className="hidden md:block">
                              <Button
                                label="Nueva Subactividad"
                                icon="pi pi-plus"
                                size="small"
                                onClick={() => handleAddSubactividad(actividad.id)}
                                disabled={readOnly}
                              />
                            </div>
                            
                            {/* Mobile button */}
                            <div className="block md:hidden">
                              <Button
                                icon="pi pi-plus"
                                tooltip="Nueva Subactividad"
                                tooltipOptions={{ position: 'bottom' }}
                                size="small"
                                onClick={() => handleAddSubactividad(actividad.id)}
                                disabled={readOnly}
                                className="p-button-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lista de subactividades */}
                      <div className="p-0">
                        {actividad.subactividades.length === 0 ? (
                          <div className="text-center py-4">
                            <i className="pi pi-list text-400 mb-2" style={{ fontSize: '2rem' }}></i>
                            <p className="text-600 m-0">No hay subactividades</p>
                            <small className="text-500">Haz click en &quot;Nueva Subactividad&quot; para agregar una</small>
                          </div>
                        ) : (
                          actividad.subactividades.map((subactividad: SubactividadPoaApi, subIndex: number) => (
                            <div 
                              key={subactividad.id}
                              className="px-3 py-3 border-bottom-1 surface-border hover:surface-50 transition-colors transition-duration-150"
                            >
                              <div className="grid" style={{ gridTemplateColumns: 'auto 1fr auto auto', gap: '1rem', alignItems: 'center' }}>
                                {/* Número de subactividad */}
                                <div className="flex align-items-center justify-content-center">
                                  <div className="border-circle bg-primary text-0 font-semibold" 
                                       style={{ width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                    {subIndex + 1}
                                  </div>
                                </div>

                                {/* Información de subactividad */}
                                <div className="flex flex-column gap-1">
                                  <div className="text-900 font-medium">
                                    {subactividad.descripcion.length > 80 
                                      ? `${subactividad.descripcion.substring(0, 80)}...` 
                                      : subactividad.descripcion}
                                  </div>
                                  <div className="flex align-items-center gap-3 text-sm">
                                    <span className="text-600">
                                      <i className="pi pi-tag mr-1"></i>
                                      {subactividad.tipo_actividad.nombre}
                                    </span>
                                    <span className="text-600">
                                      <i className="pi pi-calendar mr-1"></i>
                                      {formatDate(new Date(subactividad.fecha_inicio))} - {formatDate(new Date(subactividad.fecha_termino))}
                                    </span>
                                  </div>
                                </div>

                                {/* Estado */}
                                <div>
                                  <Badge 
                                    value={subactividad.estatus} 
                                    severity={subactividad.estatus === 'Validada' ? 'success' : 'warning'}
                                    className="text-xs"
                                  />
                                </div>

                                {/* Acciones */}
                                <div className="flex gap-1">
                                  <Button
                                    icon="pi pi-pencil"
                                    className="p-button-text p-button-sm"
                                    tooltip="Editar subactividad"
                                    tooltipOptions={{ position: 'top' }}
                                    onClick={() => handleEditSubactividad(subactividad)}
                                    disabled={readOnly}
                                  />
                                  <Button
                                    icon="pi pi-trash"
                                    className="p-button-text p-button-sm p-button-danger"
                                    tooltip="Eliminar subactividad"
                                    tooltipOptions={{ position: 'top' }}
                                    onClick={() => handleDeleteSubactividadApi(subactividad.id)}
                                    disabled={readOnly}
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
            emptyMessage="No hay actividades. Agregue una para comenzar."
            className="border-1 surface-border border-round overflow-hidden"
            pt={{
              content: { className: 'p-0' }
            }}
            header={renderDataViewHeader()}
          />
        </div>
      )}
      
      {/* Sidebar integrado para edición de subactividades */}
      <SubactividadSidebar
        visible={sidebarSubactividadVisible}
        onHide={() => setSidebarSubactividadVisible(false)}
        subactividad={editingSubactividadData}
        tiposActividad={tiposActividad}
        entregables={entregables}
        onSave={handleSaveSubactividad}
        isCreating={isCreatingSubactividad}
        actividadId={selectedActividadId}
        poaId={poaData?.id || null}
        projectUuid={projectUuid}
      />
      
      {/* Dialog para observaciones */}
      <ObservacionDialog
        visible={showObservacionDialog}
        onHide={() => setShowObservacionDialog(false)}
        onSubmit={handleObservarPoa}
      />
    </>
  );
};

export { PoaManager };
export default PoaManager;
