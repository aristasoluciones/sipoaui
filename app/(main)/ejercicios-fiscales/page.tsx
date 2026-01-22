'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { DataView } from 'primereact/dataview';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { BreadCrumb } from 'primereact/breadcrumb';
import { classNames } from 'primereact/utils';

// Components
import { PermissionGuard } from '@/src/components/PermissionGuard';
import { AccessDenied } from '@/src/components/AccessDeneid';

// Services and Types
import { EjercicioFiscalService } from '@/src/services/ejercicios';
import { ProyectoService } from '@/src/services/proyecto';
import type { EjercicioFiscalApi, EjercicioFiscal, EjercicioFiscalFormData, EjercicioFiscalFormDataToApi, EjercicioFiscalStats } from '@/types/ejercicios';

// Hooks and Context
import { useNotification } from '@/layout/context/notificationContext';
import { usePermissions } from '@/src/hooks/usePermissions';

import { toCamelCase, toSnakeCase } from '@/src/utils/transformers';

const EjerciciosFiscalesPage: React.FC = () => {
  const { canCreate, canUpdate, canDelete } = usePermissions();

  const accessCreate = canCreate('cartera_de_proyectos.ejercicios_fiscales');
  const accessEdit = canUpdate('cartera_de_proyectos.ejercicios_fiscales');
  const accessDelete = canDelete('cartera_de_proyectos.ejercicios_fiscales');

  const { success, error: showError } = useNotification();
  const toast = useRef<Toast>(null);

  // Estados principales
  const [ejercicios, setEjercicios] = useState<EjercicioFiscal[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingEjercicio, setEditingEjercicio] = useState<EjercicioFiscal | null>(null);
  const [layout, setLayout] = useState<'list' | 'grid'>('list');

  // Estado del formulario
  const [formData, setFormData] = useState<EjercicioFiscalFormData>({
    anio: new Date().getFullYear(),
    fechaInicioEjercicio: null,
    fechaCierreEjercicio: null,
    fechaInicioCapturaProyecto: null,
    fechaCierreCapturaProyecto: null,
    estatus: null
  });

  // Estadísticas
  const [stats, setStats] = useState<EjercicioFiscalStats | null>(null);

  // Funciones de transformación
  const transformApiToFrontend = (apiData: EjercicioFiscalApi): EjercicioFiscal => {
    return toCamelCase<EjercicioFiscal>(apiData);
  };

  // Función para calcular si el ejercicio está cerrado (fechaCierreEjercicio no vencida)
  const calcularEstadoEjercicioCerrado = (fechaCierreEjercicio: string): boolean => {
    const hoy = new Date();
    const fechaCierre = new Date(fechaCierreEjercicio);
    // El ejercicio está cerrado si la fecha de cierre ya pasó
    return fechaCierre < hoy;
  };

  // Función para calcular si permite captura de proyectos
  const calcularPermiteCaptura = (fechaInicioCaptura: string, fechaCierreCaptura: string): boolean => {
    const hoy = new Date();
    const fechaInicio = new Date(fechaInicioCaptura);
    const fechaCierre = new Date(fechaCierreCaptura);
    // Permite captura si hoy está dentro del rango de fechas de captura
    return hoy >= fechaInicio && hoy <= fechaCierre;
  };

  // Función para transformar datos de API a frontend con estados calculados
  const transformApiToFrontendWithStates = (apiData: EjercicioFiscalApi): EjercicioFiscal => {
    const ejercicio = toCamelCase<EjercicioFiscal>(apiData);

    // Agregar estados calculados
    (ejercicio as any).ejercicioCerrado = calcularEstadoEjercicioCerrado(ejercicio.fechaCierreEjercicio);
    (ejercicio as any).permiteCaptura = calcularPermiteCaptura(
      ejercicio.fechaInicioCapturaProyecto,
      ejercicio.fechaCierreCapturaProyecto
    );

    return ejercicio;
  };

  const transformFrontendToApi = (frontendData: Partial<EjercicioFiscal>): Partial<EjercicioFiscalApi> => {
    return toSnakeCase<Partial<EjercicioFiscalApi>>(frontendData);
  };

  // Función para transformar datos del formulario a formato API con fechas como strings
  const transformFormDataToApi = (formData: EjercicioFiscalFormData): Omit<EjercicioFiscalFormDataToApi, 'id' | 'created_at' | 'updated_at' | 'total_proyectos' | 'monto_total' | 'proyectos_aprobados' | 'proyectos_cancelados' | 'proyectos_en_progreso' | 'proyectos_borrador'> => {
    const formatDate = (date: string | Date | null): string => {
      if (!date) return '';
      const d = new Date(date);
      return d.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    };

    return {
      anio: formData.anio,
      fecha_inicio_ejercicio: formatDate(formData.fechaInicioEjercicio),
      fecha_cierre_ejercicio: formatDate(formData.fechaCierreEjercicio),
      fecha_inicio_captura_proyecto: formatDate(formData.fechaInicioCapturaProyecto),
      fecha_cierre_captura_proyecto: formatDate(formData.fechaCierreCapturaProyecto),
      estatus: formData.estatus || 'Inactivo'
    };
  };

  // Función específica para datos de creación (sin estatus)
  const transformFormDataToCreateApi = (formData: EjercicioFiscalFormData) => {
    const apiData = transformFormDataToApi(formData);
    const { estatus, ...createData } = apiData;
    return createData;
  };

  // Función específica para datos de actualización (con estatus)
  const transformFormDataToUpdateApi = (formData: EjercicioFiscalFormData) => {
    return transformFormDataToApi(formData);
  };

  // Breadcrumb
  const breadcrumbItems = [
    { label: 'Inicio', url: '/' },
    { label: 'Ejercicios Fiscales' }
  ];

  // Esquema de validación
  const validationSchema = Yup.object({
    anio: Yup.number()
      .required('El año es obligatorio')
      .integer('El año debe ser un número entero')
      .min(2000, 'El año debe ser mayor o igual a 2000')
      .max(new Date().getFullYear() + 10, 'El año no puede ser muy futuro'),
    fechaInicioEjercicio: Yup.date()
      .required('La fecha de inicio del ejercicio es obligatoria')
      .typeError('La fecha de inicio del ejercicio debe ser una fecha válida'),
    fechaCierreEjercicio: Yup.date()
      .required('La fecha de cierre del ejercicio es obligatoria')
      .typeError('La fecha de cierre del ejercicio debe ser una fecha válida')
      .min(Yup.ref('fechaInicioEjercicio'), 'La fecha de cierre del ejercicio debe ser posterior a la fecha de inicio'),
    fechaInicioCapturaProyecto: Yup.date()
      .required('La fecha de inicio de captura de proyecto es obligatoria')
      .typeError('La fecha de inicio de captura de proyecto debe ser una fecha válida'),
    fechaCierreCapturaProyecto: Yup.date()
      .required('La fecha de cierre de captura de proyecto es obligatoria')
      .typeError('La fecha de cierre de captura de proyecto debe ser una fecha válida')
      .min(Yup.ref('fechaInicioCapturaProyecto'), 'La fecha de cierre de captura de proyecto debe ser posterior a la fecha de inicio')
  });

  // Cargar ejercicios fiscales
  const loadEjercicios = async () => {
    setLoading(true);
    try {
      const data = await EjercicioFiscalService.getAll();
      const formattedData = data.map(item => transformApiToFrontend(item));
      setEjercicios(formattedData);
    } catch (err) {
      showError('Error al cargar ejercicios fiscales', 'No se pudieron cargar los ejercicios fiscales');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas consolidadas
  /*
  const loadStats = async () => {
    try {
      const statsData = await EjercicioFiscalService.getConsolidatedStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };
  */

  // Inicializar datos
  useEffect(() => {
    loadEjercicios();
    // loadStats();
  }, []);

  // Abrir diálogo para crear
  const openNew = () => {
    setEditingEjercicio(null);
    setFormData({
      anio: new Date().getFullYear(),
      fechaInicioEjercicio: null,
      fechaCierreEjercicio: null,
      fechaInicioCapturaProyecto: null,
      fechaCierreCapturaProyecto: null,
      estatus: null
    });
    setDialogVisible(true);
  };

  // Abrir diálogo para editar
  const openEdit = (ejercicio: EjercicioFiscal) => {
    setEditingEjercicio(ejercicio);
    setFormData({
      anio: ejercicio.anio,
      fechaInicioEjercicio: new Date(ejercicio.fechaInicioEjercicio + 'T00:00:00'), 
      fechaCierreEjercicio: new Date(ejercicio.fechaCierreEjercicio + 'T00:00:00'),
      fechaInicioCapturaProyecto: new Date(ejercicio.fechaInicioCapturaProyecto + 'T00:00:00'),
      fechaCierreCapturaProyecto: new Date(ejercicio.fechaCierreCapturaProyecto + 'T00:00:00'),
      estatus: ejercicio.estatus === 'Activo' ? 'Activo' : 'Inactivo'
    });
    setDialogVisible(true);
  };

  // Guardar ejercicio fiscal
  const saveEjercicio = async (values: EjercicioFiscalFormData) => {
    try {
      if (editingEjercicio) {
        // Actualización: incluye el estatus
        const updateData = transformFormDataToUpdateApi(values);
        await EjercicioFiscalService.update(editingEjercicio.id, updateData);
        success('Ejercicio fiscal actualizado', 'El ejercicio fiscal se ha actualizado correctamente');
      } else {
        // Creación: NO incluye el estatus
        const createData = transformFormDataToCreateApi(values);
        await EjercicioFiscalService.create(createData as any);
        success('Ejercicio fiscal creado', 'El ejercicio fiscal se ha creado correctamente');
      }
      setDialogVisible(false);
      loadEjercicios();
      // loadStats();
    } catch (err) {
      showError('Error al guardar', 'No se pudo guardar el ejercicio fiscal');
      console.error('Error saving ejercicio:', err);
    }
  };  // Eliminar ejercicio fiscal
  const deleteEjercicio = async (ejercicio: EjercicioFiscal) => {
    try {
      await EjercicioFiscalService.delete(ejercicio.id);
      success('Ejercicio fiscal eliminado', 'El ejercicio fiscal se ha eliminado correctamente');
      loadEjercicios();
      // loadStats();
    } catch (err) {
      showError('Error al eliminar', 'No se pudo eliminar el ejercicio fiscal');
      console.error('Error deleting ejercicio:', err);
    }
  };

  // Activar ejercicio fiscal
  const setActive = async (ejercicio: EjercicioFiscal) => {
    try {
      await EjercicioFiscalService.setActive(ejercicio.id);
      success('Ejercicio fiscal activado', 'El ejercicio fiscal se ha activado correctamente');
      loadEjercicios();
      // loadStats();
    } catch (err) {
      showError('Error al activar', 'No se pudo activar el ejercicio fiscal');
      console.error('Error activating ejercicio:', err);
    }
  };

  // Confirmar eliminación
  const confirmDelete = (ejercicio: EjercicioFiscal) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el ejercicio fiscal ${ejercicio.anio}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => deleteEjercicio(ejercicio),
      reject: () => {}
    });
  };

  // Funciones de formato
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const formatDate = (value: string) => {

    return new Date(value + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Templates para DataView
  const listItemTemplate = (ejercicio: EjercicioFiscal) => {
    return (
      <div className="col-12">
        <div className="flex flex-column xl:flex-row xl:align-items-start p-4 gap-4">
          <div className="flex flex-column sm:flex-row justify-content-between align-items-center xl:align-items-start flex-1 gap-4">
            <div className="flex flex-column align-items-center sm:align-items-start gap-3">
              <div className="text-2xl font-bold text-900">{ejercicio.anio}</div>
              <div className="flex align-items-center gap-3">
                <Badge
                  value={ejercicio.estatus === 'Activo' ? 'Activo' : 'Inactivo'}
                  severity={ejercicio.estatus === 'Activo' ? 'success' : 'info'}
                />
              </div>
              <div className="flex flex-column gap-2">
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-calendar text-500"></i>
                  <span className="font-medium">Ejercicio: {formatDate(ejercicio.fechaInicioEjercicio)} - {formatDate(ejercicio.fechaCierreEjercicio)}</span>
                </div>
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-clock text-500"></i>
                  <span className="font-medium">Capturas: {formatDate(ejercicio.fechaInicioCapturaProyecto)} - {formatDate(ejercicio.fechaCierreCapturaProyecto)}</span>
                </div>
              </div>
            </div>
            <div className="flex sm:flex-column align-items-center sm:align-items-end gap-3 sm:gap-2">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{ejercicio.totalProyectos}</div>
                <div className="text-sm text-500">Proyectos</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{formatCurrency(ejercicio.montoTotal)}</div>
                <div className="text-sm text-500">Monto Total</div>
              </div>
            </div>
          </div>
          <div className="flex sm:flex-row xl:flex-column align-items-center xl:align-items-end gap-3">
            {accessEdit && (
              <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-text p-button-info"
                onClick={() => openEdit(ejercicio)}
                tooltip="Editar"
              />
            )}
            {ejercicio.estatus !== 'Activo' && accessEdit && (
              <Button
                icon="pi pi-check"
                className="p-button-rounded p-button-text p-button-success"
                onClick={() => setActive(ejercicio)}
                tooltip="Activar"
              />
            )}
            {accessDelete && (
              <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-text p-button-danger"
                onClick={() => confirmDelete(ejercicio)}
                tooltip="Eliminar"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const gridItemTemplate = (ejercicio: EjercicioFiscal) => {
    return (
      <div className="col-12 sm:col-6 lg:col-4 xl:col-3 p-2">
        <div className="p-4 border-1 surface-border surface-card border-round">
          <div className="flex flex-column align-items-center gap-3 py-3">
            <div className="text-3xl font-bold text-900">{ejercicio.anio}</div>
            <Badge
              value={ejercicio.estatus === 'Activo' ? 'Activo' : 'Inactivo'}
              severity={ejercicio.estatus === 'Activo' ? 'success' : 'info'}
            />
          </div>

          <div className="flex flex-column gap-3">
            <div className="text-center">
              <i className="pi pi-calendar text-2xl text-500 mb-2"></i>
              <div className="text-sm font-medium">Ejercicio</div>
              <div className="text-xs text-500">
                {formatDate(ejercicio.fechaInicioEjercicio)} - {formatDate(ejercicio.fechaCierreEjercicio)}
              </div>
            </div>

            <div className="text-center">
              <i className="pi pi-clock text-2xl text-500 mb-2"></i>
              <div className="text-sm font-medium">Capturas</div>
              <div className="text-xs text-500">
                {formatDate(ejercicio.fechaInicioCapturaProyecto)} - {formatDate(ejercicio.fechaCierreCapturaProyecto)}
              </div>
            </div>

            <div className="grid text-center">
              <div className="col-6">
                <div className="text-lg font-bold text-blue-600">{ejercicio.totalProyectos}</div>
                <div className="text-xs text-500">Proyectos</div>
              </div>
              <div className="col-6">
                <div className="text-lg font-bold text-green-600">{formatCurrency(ejercicio.montoTotal)}</div>
                <div className="text-xs text-500">Monto</div>
              </div>
            </div>
          </div>

          <div className="flex justify-content-center gap-2 mt-3">
            {accessEdit && (
              <Button
                icon="pi pi-pencil"
                className="p-button-rounded p-button-text p-button-info"
                onClick={() => openEdit(ejercicio)}
                tooltip="Editar"
              />
            )}
            {ejercicio.estatus !== 'Activo' && accessEdit && (
              <Button
                icon="pi pi-check"
                className="p-button-rounded p-button-text p-button-success"
                onClick={() => setActive(ejercicio)}
                tooltip="Activar"
              />
            )}
            {accessDelete && (
              <Button
                icon="pi pi-trash"
                className="p-button-rounded p-button-text p-button-danger"
                onClick={() => confirmDelete(ejercicio)}
                tooltip="Eliminar"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const itemTemplate = (ejercicio: EjercicioFiscal, layout: 'list' | 'grid') => {
    if (!ejercicio) {
      return null;
    }

    if (layout === 'list') {
      return listItemTemplate(ejercicio);
    } else if (layout === 'grid') {
      return gridItemTemplate(ejercicio);
    }
  };

  // Header del DataView como toolbar
  const header = (
    <div className="flex justify-content-between align-items-center">
      <h5 className="m-0">Ejercicios Fiscales</h5>
      <div className="flex gap-2">
        <Button
          icon="pi pi-list"
          className={classNames('p-button-text', { 'p-button-outlined': layout === 'grid' })}
          onClick={() => setLayout('list')}
        />
        <Button
          icon="pi pi-th-large"
          className={classNames('p-button-text', { 'p-button-outlined': layout === 'list' })}
          onClick={() => setLayout('grid')}
        />
      </div>
    </div>
  );



  return (
    <PermissionGuard 
        resource="cartera_de_proyectos.ejercicios_fiscales" 
        action="access"
        fallback={<AccessDenied variant='detailed' showContact message="No tienes acceso a esta modulo"/>}
        >
      <div className="grid">
        <div className="col-12">
          <BreadCrumb model={breadcrumbItems} />
        </div>
        {/* Título y descripción del módulo */}
        <div className="col-12">
          <div className="card mb-3">
            <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
              <div className="flex align-items-center gap-3">
                <div className="flex align-items-center justify-content-center bg-blue-100 border-round"
                     style={{ width: '3rem', height: '3rem' }}>
                  <i className="pi pi-calendar text-blue-500 text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-900 m-0">Gestión de Ejercicios Fiscales</h2>
                  <p className="text-600 m-0 mt-1">Administra los ejercicios fiscales de la institución</p>
                </div>
              </div>
              {accessCreate && (
                <Button
                  label="Nuevo Ejercicio"
                  icon="pi pi-plus"
                  onClick={openNew}
                  className="flex-shrink-0"
                />
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas consolidadas */}
        {stats && (
          <div className="col-12">
            <div className="grid">
              <div className="col-12 md:col-6 lg:col-3">
                <div className="card mb-0">
                  <div className="flex justify-content-between mb-3">
                    <div>
                      <span className="block text-500 font-medium mb-3">Total Proyectos</span>
                      <div className="text-900 font-medium text-xl">{stats.totalProyectos}</div>
                    </div>
                    <div className="flex align-items-center justify-content-center bg-blue-100 border-round"
                         style={{ width: '2.5rem', height: '2.5rem' }}>
                      <i className="pi pi-folder text-blue-500 text-xl"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <div className="card mb-0">
                  <div className="flex justify-content-between mb-3">
                    <div>
                      <span className="block text-500 font-medium mb-3">Monto Total</span>
                      <div className="text-900 font-medium text-xl">{formatCurrency(stats.montoTotal)}</div>
                    </div>
                    <div className="flex align-items-center justify-content-center bg-green-100 border-round"
                         style={{ width: '2.5rem', height: '2.5rem' }}>
                      <i className="pi pi-dollar text-green-500 text-xl"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <div className="card mb-0">
                  <div className="flex justify-content-between mb-3">
                    <div>
                      <span className="block text-500 font-medium mb-3">En Progreso</span>
                      <div className="text-900 font-medium text-xl">{stats.proyectosEnProgreso}</div>
                    </div>
                    <div className="flex align-items-center justify-content-center bg-orange-100 border-round"
                         style={{ width: '2.5rem', height: '2.5rem' }}>
                      <i className="pi pi-clock text-orange-500 text-xl"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 md:col-6 lg:col-3">
                <div className="card mb-0">
                  <div className="flex justify-content-between mb-3">
                    <div>
                      <span className="block text-500 font-medium mb-3">Completados</span>
                      <div className="text-900 font-medium text-xl">{stats.proyectosAprobados}</div>
                    </div>
                    <div className="flex align-items-center justify-content-center bg-purple-100 border-round"
                         style={{ width: '2.5rem', height: '2.5rem' }}>
                      <i className="pi pi-check-circle text-purple-500 text-xl"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de ejercicios fiscales */}
        <div className="col-12">
            {loading ? (
              <div className="flex align-items-center justify-content-center p-8">
                <i className="pi pi-spin pi-spinner text-4xl text-blue-500 mr-3"></i>
                <span className="text-xl text-600">Cargando ejercicios fiscales...</span>
              </div>
            ) : ejercicios.length === 0 ? (
              <div className="card">
                <div className="flex flex-column align-items-center justify-content-center p-8 text-center">
                  <i className="pi pi-calendar-plus text-6xl text-400 mb-4"></i>
                  <h3 className="text-xl font-semibold text-900 mb-2">No hay ejercicios fiscales configurados</h3>
                  <p className="text-600 mb-4" style={{ maxWidth: '30rem' }}>
                    Los ejercicios fiscales definen los períodos durante los cuales se pueden crear y gestionar proyectos. 
                    Configura tu primer ejercicio fiscal para comenzar.
                  </p>
                  {accessCreate && (
                    <Button 
                      label="Crear primer ejercicio fiscal" 
                      icon="pi pi-plus" 
                      onClick={() => {
                        setEditingEjercicio(null);
                        setFormData({
                          anio: new Date().getFullYear(),
                          fechaInicioEjercicio: null,
                          fechaCierreEjercicio: null,
                          fechaInicioCapturaProyecto: null,
                          fechaCierreCapturaProyecto: null,
                          estatus: null
                        });
                        setDialogVisible(true);
                      }}
                    />
                  )}
                  {!accessCreate && (
                    <p className="text-500 text-sm mt-2">
                      <i className="pi pi-lock mr-2"></i>
                      Contacta al administrador para configurar ejercicios fiscales
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <DataView
                  value={ejercicios}
                  layout={layout}
                  itemTemplate={itemTemplate}
                  paginator
                  rows={layout === 'list' ? 5 : 12}
                  emptyMessage="No se encontraron ejercicios fiscales"
                  header={header}
                />
              </div>
            )}
        
        </div>

        {/* Diálogo del formulario */}
        <Dialog
          visible={dialogVisible}
          style={{ width: '600px' }}
          header={
            <span className="text-xl font-semibold">
              {editingEjercicio ? 'Editar Ejercicio Fiscal' : 'Nuevo Ejercicio Fiscal'}
            </span>
          }
          modal
          className="p-fluid"
          onHide={() => setDialogVisible(false)}
        >
          <Formik
            initialValues={formData}
            validationSchema={validationSchema}
            onSubmit={saveEjercicio}
            enableReinitialize
          >
            {({ values, setFieldValue, errors, touched, isValid, dirty }) => (
              <Form>
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <label htmlFor="anio" className="block font-medium mb-2">
                      Año *
                    </label>
                    <Field name="anio">
                      {({ field }: any) => (
                        <InputText
                          {...field}
                          id="anio"
                          type="number"
                          className={classNames({ 'p-invalid': touched.anio && errors.anio })}
                        />
                      )}
                    </Field>
                    {touched.anio && errors.anio && (
                      <small className="p-error">{errors.anio}</small>
                    )}
                  </div>

                  {editingEjercicio && (
                      <div className="col-12 md:col-6">
                         <div className="flex align-items-center mt-4">
                            <Checkbox
                              inputId="estatus"
                              checked={values.estatus === 'Activo'}
                              onChange={(e) => setFieldValue('estatus', e.checked ? 'Activo' : 'Inactivo')}
                            />
                            <label htmlFor="estatus" className="ml-2">Ejercicio Activo</label>
                          </div>
                      </div>
                    )
                  }

                  <div className="col-12 md:col-6">
                    <label htmlFor="fechaInicioEjercicio" className="block font-medium mb-2">
                      Fecha Inicio Ejercicio *
                    </label>
                    <Field name="fechaInicioEjercicio">
                      {({ field }: any) => (
                        <Calendar
                          {...field}
                          id="fechaInicioEjercicio"
                          dateFormat="dd/mm/yy"
                          showIcon
                          className={classNames({ 'p-invalid': touched.fechaInicioEjercicio && errors.fechaInicioEjercicio })}
                          onChange={(e) => setFieldValue('fechaInicioEjercicio', e.value)}
                          value={field.value ? new Date(field.value) : null}
                        />
                      )}
                    </Field>
                    {touched.fechaInicioEjercicio && errors.fechaInicioEjercicio && (
                      <small className="p-error">{errors.fechaInicioEjercicio}</small>
                    )}
                  </div>

                  <div className="col-12 md:col-6">
                    <label htmlFor="fechaCierreEjercicio" className="block font-medium mb-2">
                      Fecha Cierre Ejercicio *
                    </label>
                    <Field name="fechaCierreEjercicio">
                      {({ field }: any) => (
                        <Calendar
                          {...field}
                          id="fechaCierreEjercicio"
                          dateFormat="dd/mm/yy"
                          showIcon
                          className={classNames({ 'p-invalid': touched.fechaCierreEjercicio && errors.fechaCierreEjercicio })}
                          onChange={(e) => setFieldValue('fechaCierreEjercicio', e.value)}
                          value={field.value ? new Date(field.value) : null}
                        />
                      )}
                    </Field>
                    {touched.fechaCierreEjercicio && errors.fechaCierreEjercicio && (
                      <small className="p-error">{errors.fechaCierreEjercicio}</small>
                    )}
                  </div>

                  <div className="col-12 md:col-6">
                    <label htmlFor="fechaInicioCapturaProyecto" className="block font-medium mb-2">
                      Fecha Inicio Capturas *
                    </label>
                    <Field name="fechaInicioCapturaProyecto">
                      {({ field }: any) => (
                        <Calendar
                          {...field}
                          id="fechaInicioCapturaProyecto"
                          dateFormat="dd/mm/yy"
                          showIcon
                          className={classNames({ 'p-invalid': touched.fechaInicioCapturaProyecto && errors.fechaInicioCapturaProyecto })}
                          onChange={(e) => setFieldValue('fechaInicioCapturaProyecto', e.value)}
                          value={field.value ? new Date(field.value) : null}
                        />
                      )}
                    </Field>
                    {touched.fechaInicioCapturaProyecto && errors.fechaInicioCapturaProyecto && (
                      <small className="p-error">{errors.fechaInicioCapturaProyecto}</small>
                    )}
                  </div>

                  <div className="col-12 md:col-6">
                    <label htmlFor="fechaCierreCapturaProyecto" className="block font-medium mb-2">
                      Fecha Cierre Capturas *
                    </label>
                    <Field name="fechaCierreCapturaProyecto">
                      {({ field }: any) => (
                        <Calendar
                          {...field}
                          id="fechaCierreCapturaProyecto"
                          dateFormat="dd/mm/yy"
                          showIcon
                          className={classNames({ 'p-invalid': touched.fechaCierreCapturaProyecto && errors.fechaCierreCapturaProyecto })}
                          onChange={(e) => setFieldValue('fechaCierreCapturaProyecto', e.value)}
                          value={field.value ? new Date(field.value) : null}
                        />
                      )}
                    </Field>
                    {touched.fechaCierreCapturaProyecto && errors.fechaCierreCapturaProyecto && (
                      <small className="p-error">{errors.fechaCierreCapturaProyecto}</small>
                    )}
                  </div>
                </div>

                <div className="flex justify-content-end gap-2 mt-4">
                  <Button
                    type="button"
                    label="Cancelar"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    onClick={() => setDialogVisible(false)}
                  />
                  <Button
                    type="submit"
                    label="Guardar"
                    icon="pi pi-check"
                    disabled={!isValid || !dirty}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </Dialog>

        <Toast ref={toast} />
        <ConfirmDialog />
      </div>
    </PermissionGuard>
  );
};

export default EjerciciosFiscalesPage;
