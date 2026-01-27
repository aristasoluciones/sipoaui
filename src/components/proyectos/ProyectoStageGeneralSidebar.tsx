'use client';

import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Sidebar } from 'primereact/sidebar';
import type { ProyectoFormData } from '@/types/proyectos';
import { Prioridad } from '@/types/proyectos.d';
import { proyectoInformacionGeneralSchema } from '@/src/schemas/proyecto.schemas';
import { useNotification } from '@/layout/context/notificationContext';

interface Stage {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  required: boolean;
}

interface ProyectoStageGeneralSidebarProps {
  visible: boolean;
  onHide: () => void;
  stage: Stage;
  formData: ProyectoFormData;
  onInputChange: (field: keyof ProyectoFormData, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  unidades?: any[];
  empleados?: any[];
  tiposProyecto?: any[];
}

const ProyectoStageGeneralSidebar: React.FC<ProyectoStageGeneralSidebarProps> = ({
  visible,
  onHide,
  stage,
  formData,
  onInputChange,
  onSave,
  onCancel,
  unidades = [],
  empleados = [],
  tiposProyecto = []
}) => {
  // Estado para errores de validación
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Estado para controlar si el formulario es válido
  const [isFormValid, setIsFormValid] = useState(false);

  // Hook para notificaciones
  const { error } = useNotification();

  // Limpiar errores de validación
  const clearValidationErrors = () => {
    setValidationErrors({});
    setIsFormValid(false);
  };

  // Validar formulario completo
  const validateCompleteForm = async (): Promise<boolean> => {
    try {
      await proyectoInformacionGeneralSchema.validate(formData, { abortEarly: false });
      setIsFormValid(true);
      setValidationErrors({});
      return true;
    } catch (error: any) {
      setIsFormValid(false);
      const errors: Record<string, string> = {};
      if (error.inner) {
        error.inner.forEach((err: any) => {
          errors[err.path] = err.message;
        });
      }
      setValidationErrors(errors);
      return false;
    }
  };

  // Validación en tiempo real
  const validateField = async (field: keyof ProyectoFormData, value: any) => {
    try {
      // Crear un objeto temporal con el campo actualizado
      const tempFormData = { ...formData, [field]: value };

      // Validar solo este campo
      await proyectoInformacionGeneralSchema.validateAt(field, tempFormData);

      // Si no hay error, limpiar el error de este campo
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });

      // Intentar validar el formulario completo para actualizar isFormValid
      await validateCompleteForm();
    } catch (error: any) {
      // Si hay error, actualizar el error de este campo
      setValidationErrors(prev => ({
        ...prev,
        [field]: error.message
      }));
      setIsFormValid(false);
    }
  };

  // Wrapper para onInputChange que incluye validación en tiempo real
  const handleInputChange = (field: keyof ProyectoFormData, value: any) => {
    onInputChange(field, value);
    validateField(field, value);
  };

  // Opciones para prioridad usando el enum
  const prioridadOptions = [
    { label: 'Crítica', value: Prioridad.CRITICA },
    { label: 'Alta', value: Prioridad.ALTA },
    { label: 'Media', value: Prioridad.MEDIA },
    { label: 'Baja', value: Prioridad.BAJA }
  ];

  // Cargar datos de catálogos
  useEffect(() => {
    if (visible) {
      // Validar formulario inicial
      validateCompleteForm();
    }
  }, [visible]);

  // Manejar guardado con validación
  const handleSave = async () => {
    const isValid = await validateCompleteForm();
    if (isValid) {
      onSave();
    } else {
      error('Errores de validación', 'Por favor, corrija los errores marcados en el formulario');
    }
  };

  // Encabezado del sidebar con estilos conservados
  const customHeader = () => {
    return (
      <div className="flex align-items-center gap-2 py-2">
        <i className="pi pi-step text-xl text-primary-600"></i>
        <h5 className="m-0 text-xl font-semibold text-primary-800">
          {stage.title}
        </h5>
      </div>
    );
  };

  return (
    <Sidebar
      visible={visible}
      position="right"
      onHide={onHide}
      header={customHeader()}
      className="w-full md:w-6 lg:w-4"
      modal
      pt={{
        header: { className: 'border-bottom-1 surface-border' },
        content: { className: 'p-0' }
      }}
    >
      <div className="h-full flex flex-column">
        {/* Contenido del formulario */}
        <div className="flex-1 overflow-auto p-4">
          <div className="field">
            <label htmlFor="codigo" className="font-medium">
              Código <span className='text-red-600'>*</span>
            </label>
            <InputText
              id="codigo"
              value={formData.codigo || ''}
              onChange={(e) => handleInputChange('codigo', e.target.value)}
              className={`w-full ${validationErrors.codigo ? 'p-invalid' : ''}`}
              placeholder="Ingrese el código del proyecto"
              maxLength={20}
            />
            {validationErrors.codigo && (
              <small className="p-error">{validationErrors.codigo}</small>
            )}
          </div>

          <div className="field">
            <label htmlFor="nombre" className="font-medium">
              Nombre <span className='text-red-600'>*</span>
            </label>
            <InputText
              id="nombre"
              value={formData.nombre || ''}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className={`w-full ${validationErrors.nombre ? 'p-invalid' : ''}`}
              placeholder="Ingrese el nombre del proyecto"
              maxLength={200}
            />
            {validationErrors.nombre && (
              <small className="p-error">{validationErrors.nombre}</small>
            )}
          </div>

          <div className="field">
            <label htmlFor="unidad_id" className="block font-medium text-900 mb-2">
              Unidad Responsable <span className='text-red-600'>*</span>
            </label>
            <Dropdown
              id="unidad_id"
              filter
              filterBy='label'
              value={formData.unidad_id}
              options={unidades && Array.isArray(unidades) ? unidades.map(u => ({ label: u.nombre, value: u.id })) : []}
              onChange={(e) => handleInputChange('unidad_id', e.value)}
              className={`w-full ${validationErrors.unidad_id ? 'p-invalid' : ''}`}
              placeholder="Seleccione la unidad responsable"
              showClear
            />
            {validationErrors.unidad_id && (
              <small className="p-error">{validationErrors.unidad_id}</small>
            )}
          </div>

          <div className="field">
            <label htmlFor="responsable_id" className="block font-medium text-900 mb-2">
              Responsable <span className='text-red-600'>*</span>
            </label>
            <Dropdown
              filter
              filterBy='label'
              id="responsable_id"
              value={formData.responsable_id}
              options={empleados && Array.isArray(empleados) ? empleados.map(e => ({ label: e.nombre, value: e.id })) : []}
              onChange={(e) => handleInputChange('responsable_id', e.value)}
              className={`w-full ${validationErrors.responsable_id ? 'p-invalid' : ''}`}
              placeholder="Seleccione el responsable del proyecto"
              showClear
            />
            {validationErrors.responsable_id && (
              <small className="p-error">{validationErrors.responsable_id}</small>
            )}
          </div>

          <div className="field">
            <label htmlFor="tipo_proyecto_id" className="block font-medium text-900 mb-2">
              Tipo de Proyecto <span className='text-red-600'>*</span>
            </label>
            <Dropdown
              id="tipo_proyecto_id"
              value={formData.tipo_proyecto_id}
              options={tiposProyecto && Array.isArray(tiposProyecto) ? tiposProyecto.map(t => ({ label: t.nombre, value: t.id })) : []}
              onChange={(e) => handleInputChange('tipo_proyecto_id', e.value)}
              className={`w-full ${validationErrors.tipo_proyecto_id ? 'p-invalid' : ''}`}
              placeholder="Seleccione el tipo de proyecto"
              showClear
            />
            {validationErrors.tipo_proyecto_id && (
              <small className="p-error">{validationErrors.tipo_proyecto_id}</small>
            )}
          </div>

          <div className="field">
            <label htmlFor="prioridad" className="block font-medium text-900 mb-2">
              Prioridad <span className='text-red-600'>*</span>
            </label>
            <Dropdown
              id="prioridad"
              value={formData.prioridad}
              options={prioridadOptions}
              onChange={(e) => handleInputChange('prioridad', e.value)}
              className={`w-full ${validationErrors.prioridad ? 'p-invalid' : ''}`}
              placeholder="Seleccione la prioridad"
            />
            {validationErrors.prioridad && (
              <small className="p-error">{validationErrors.prioridad}</small>
            )}
          </div>

          <div className="field">
            <label htmlFor="descripcion" className="block font-medium text-900 mb-2">
              Descripción
            </label>
            <InputTextarea
              id="descripcion"
              value={formData.descripcion || ''}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              className={`w-full ${validationErrors.descripcion ? 'p-invalid' : ''}`}
              placeholder="Ingrese una descripción del proyecto"
              rows={3}
              maxLength={500}
            />
            {validationErrors.descripcion && (
              <small className="p-error">{validationErrors.descripcion}</small>
            )}
          </div>
        </div>

        {/* Footer del sidebar */}
        <div className="mt-auto border-top-1 surface-border p-4">
          <div className="flex gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              outlined
              severity="secondary"
              className="flex-1"
              onClick={onCancel}
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              className="flex-1"
              onClick={handleSave}
              disabled={!isFormValid}
            />
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default ProyectoStageGeneralSidebar;