'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { useNotification } from '@/layout/context/notificationContext';
import { ProyectoEtapasStorage, FormulacionData } from '@/src/utils/sessionStorage';
import { Proyecto } from '@/types/proyectos.d';

interface Stage {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  required: boolean;
}

interface ProyectoStageFormulacionSidebarProps {
  visible: boolean;
  onHide: () => void;
  stage: Stage;
  project: Proyecto;
  onSave: () => void;
  onCancel: () => void;
}

const ProyectoStageFormulacionSidebar: React.FC<ProyectoStageFormulacionSidebarProps> = ({
  visible,
  onHide,
  stage,
  project,
  onSave,
  onCancel
}) => {
  // Valores iniciales por defecto
  const defaultInitialValues: FormulacionData = {
    presupuesto: undefined,
    indicadores: '',
    riesgos: ''
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<FormulacionData>(defaultInitialValues);
  const formikRef = useRef<any>(null);
  const { success, error: showError } = useNotification();

  // Esquema de validación con Yup
  const validationSchema = Yup.object().shape({
    presupuesto: Yup.number()
      .required('El presupuesto es obligatorio')
      .min(0, 'El presupuesto no puede ser negativo'),
    indicadores: Yup.string()
      .required('Los indicadores son obligatorios')
      .min(10, 'Los indicadores deben tener al menos 10 caracteres'),
    riesgos: Yup.string()
      .required('El análisis de riesgos es obligatorio')
      .min(10, 'El análisis de riesgos debe tener al menos 10 caracteres')
  });

  // Cargar datos guardados del sessionStorage
  useEffect(() => {
    const savedData = ProyectoEtapasStorage.getEtapaData(
      project.uuid,
      4
    ) as FormulacionData | null;

    if (savedData) {
      setInitialFormValues(savedData);
    }
  }, [project.uuid]);

  const handleSubmit = async (values: FormulacionData) => {
    setIsSubmitting(true);
    try {
      // Guardar en sessionStorage
      ProyectoEtapasStorage.saveEtapaData(
        project.uuid,
        4,
        values
      );

      success('Formulación guardada', 'Los datos de formulación cuantitativa se han guardado correctamente');
      onSave();
    } catch (err) {
      console.error('Error guardando formulación:', err);
      showError('Error al guardar', 'No se pudo guardar la formulación cuantitativa. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    // Activa el submit del formulario usando el ref
    if (formikRef.current) {
      formikRef.current.submitForm();
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
          <Formik
            initialValues={initialFormValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
            innerRef={formikRef}
          >
            {({ values, errors, touched, isValid, dirty }) => (
              <Form>
                {/* Campo: Presupuesto */}
                <div className="field mb-4">
                  <label htmlFor="presupuesto" className="block text-900 font-medium mb-2">
                    Presupuesto Total *
                  </label>
                  <Field name="presupuesto">
                    {({ field }: any) => (
                      <InputNumber
                        {...field}
                        id="presupuesto"
                        value={field.value}
                        onValueChange={(e) => field.onChange({ target: { name: field.name, value: e.value } })}
                        className={`w-full ${errors.presupuesto && touched.presupuesto ? 'p-invalid' : ''}`}
                        placeholder="Ingrese el presupuesto total del proyecto"
                        min={0}
                        mode="currency"
                        currency="MXN"
                        locale="es-MX"
                        useGrouping={true}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="presupuesto" component="small" className="p-error block mt-1" />
                </div>

                {/* Campo: Indicadores */}
                <div className="field mb-4">
                  <label htmlFor="indicadores" className="block text-900 font-medium mb-2">
                    Indicadores de Rendimiento *
                  </label>
                  <Field name="indicadores">
                    {({ field }: any) => (
                      <InputTextarea
                        {...field}
                        id="indicadores"
                        rows={6}
                        className={`w-full ${errors.indicadores && touched.indicadores ? 'p-invalid' : ''}`}
                        placeholder="Describe los indicadores que medirán el rendimiento y éxito del proyecto..."
                      />
                    )}
                  </Field>
                  <ErrorMessage name="indicadores" component="small" className="p-error block mt-1" />
                </div>

                {/* Campo: Riesgos */}
                <div className="field mb-4">
                  <label htmlFor="riesgos" className="block text-900 font-medium mb-2">
                    Análisis de Riesgos *
                  </label>
                  <Field name="riesgos">
                    {({ field }: any) => (
                      <InputTextarea
                        {...field}
                        id="riesgos"
                        rows={6}
                        className={`w-full ${errors.riesgos && touched.riesgos ? 'p-invalid' : ''}`}
                        placeholder="Identifica y analiza los riesgos potenciales del proyecto y las estrategias de mitigación..."
                      />
                    )}
                  </Field>
                  <ErrorMessage name="riesgos" component="small" className="p-error block mt-1" />
                </div>
              </Form>
            )}
          </Formik>
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
              disabled={isSubmitting}
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              className="flex-1"
              onClick={handleSave}
              loading={isSubmitting}
            />
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default ProyectoStageFormulacionSidebar;