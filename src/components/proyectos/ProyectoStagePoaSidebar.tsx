'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { useNotification } from '@/layout/context/notificationContext';
import { ProyectoEtapasStorage, ProgramaOperativoData } from '@/src/utils/sessionStorage';
import { Proyecto, EstatusEtapa, Observacion, Stage } from '@/types/proyectos.d';
import ObservacionViewer from './ObservacionViewer';

interface ProyectoStagePoaSidebarProps {
  visible: boolean;
  onHide: () => void;
  stage: Stage;
  project: Proyecto;
  onSave: () => void;
  onCancel: () => void;
}

const ProyectoStagePoaSidebar: React.FC<ProyectoStagePoaSidebarProps> = ({
  visible,
  onHide,
  stage,
  project,
  onSave,
  onCancel
}) => {
  // Valores iniciales por defecto
  const defaultInitialValues: ProgramaOperativoData = {
    actividades: '',
    recursos: '',
    cronograma: ''
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<ProgramaOperativoData>(defaultInitialValues);
  const formikRef = useRef<any>(null);
  const { success, error: showError } = useNotification();
  const [observacionViewerVisible, setObservacionViewerVisible] = useState(false);

  // Esquema de validación con Yup
  const validationSchema = Yup.object().shape({
    actividades: Yup.string()
      .required('Las actividades son obligatorias')
      .min(10, 'Las actividades deben tener al menos 10 caracteres'),
    recursos: Yup.string()
      .required('Los recursos son obligatorios')
      .min(10, 'Los recursos deben tener al menos 10 caracteres'),
    cronograma: Yup.string()
      .required('El cronograma es obligatorio')
      .min(10, 'El cronograma debe tener al menos 10 caracteres')
  });

  // Cargar datos guardados del sessionStorage
  useEffect(() => {
    const savedData = ProyectoEtapasStorage.getEtapaData(
      project.uuid,
      2
    ) as ProgramaOperativoData | null;

    if (savedData) {
      setInitialFormValues(savedData);
    }
  }, [project.uuid]);

  const handleSubmit = async (values: ProgramaOperativoData) => {
    setIsSubmitting(true);
    try {
      // Guardar en sessionStorage
      ProyectoEtapasStorage.saveEtapaData(
        project.uuid,
        2,
        values
      );

      success('Programa Operativo guardado', 'Los datos del programa operativo se han guardado correctamente');
      onSave();
    } catch (err) {
      console.error('Error guardando programa operativo:', err);
      showError('Error al guardar', 'No se pudo guardar el programa operativo. Intente nuevamente.');
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

  // Verificar si la etapa actual está observada
  const isStageObserved = (): boolean => {
    const etapaCompletada = project?.etapasCompletadas?.find(e => e.id === stage.id);
    return etapaCompletada?.estatus === EstatusEtapa.OBSERVADO;
  };

  // Obtener la observación de la etapa actual
  const getStageObservation = (): Observacion[] => {
    const etapaCompletada = project?.etapasCompletadas?.find(e => e.id === stage.id);
    if (etapaCompletada?.observacion) {
      return [{
        id: `obs-${stage.id}-1`,
        texto: etapaCompletada.observacion,
        resuelta: false,
        fechaCreacion: new Date().toISOString() // Temporal, debería venir de la API
      }];
    }
    return [{
      id: `obs-${stage.id}-1`,
      texto: 'Se requieren correcciones en la información proporcionada. Por favor revise y actualice los datos según las observaciones indicadas.',
      resuelta: false,
      fechaCreacion: new Date().toISOString()
    }];
  };

  const handleGuardarObservaciones = (observacionesActualizadas: Observacion[]) => {
    // Aquí se implementará la lógica para guardar los cambios en el futuro
    console.log('Observaciones actualizadas:', observacionesActualizadas);
    // TODO: Llamar a API para actualizar el estado de las observaciones
  };

  const handleViewObservation = () => {
    setObservacionViewerVisible(true);
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
                {/* Campo: Actividades */}
                <div className="field mb-4">
                  <label htmlFor="actividades" className="block text-900 font-medium mb-2">
                    Actividades *
                  </label>
                  <Field name="actividades">
                    {({ field }: any) => (
                      <InputTextarea
                        {...field}
                        id="actividades"
                        rows={6}
                        className={`w-full ${errors.actividades && touched.actividades ? 'p-invalid' : ''}`}
                        placeholder="Describe las actividades específicas del programa operativo..."
                      />
                    )}
                  </Field>
                  <ErrorMessage name="actividades" component="small" className="p-error block mt-1" />
                </div>

                {/* Campo: Recursos */}
                <div className="field mb-4">
                  <label htmlFor="recursos" className="block text-900 font-medium mb-2">
                    Recursos *
                  </label>
                  <Field name="recursos">
                    {({ field }: any) => (
                      <InputTextarea
                        {...field}
                        id="recursos"
                        rows={6}
                        className={`w-full ${errors.recursos && touched.recursos ? 'p-invalid' : ''}`}
                        placeholder="Describe los recursos necesarios (humanos, materiales, financieros)..."
                      />
                    )}
                  </Field>
                  <ErrorMessage name="recursos" component="small" className="p-error block mt-1" />
                </div>

                {/* Campo: Cronograma */}
                <div className="field mb-4">
                  <label htmlFor="cronograma" className="block text-900 font-medium mb-2">
                    Cronograma *
                  </label>
                  <Field name="cronograma">
                    {({ field }: any) => (
                      <InputTextarea
                        {...field}
                        id="cronograma"
                        rows={6}
                        className={`w-full ${errors.cronograma && touched.cronograma ? 'p-invalid' : ''}`}
                        placeholder="Describe el cronograma de ejecución del programa..."
                      />
                    )}
                  </Field>
                  <ErrorMessage name="cronograma" component="small" className="p-error block mt-1" />
                </div>
              </Form>
            )}
          </Formik>
        </div>

        {/* Footer del sidebar */}
        <div className="mt-auto border-top-1 surface-border p-4">
          <div className="flex flex-column md:flex-row gap-2">
            {/* Botón de ver observación - solo si la etapa está observada */}
            {isStageObserved() && (
              <Button
                label="Ver Observación"
                icon="pi pi-exclamation-triangle"
                severity="warning"
                outlined
                className="w-full md:w-auto"
                onClick={handleViewObservation}
              />
            )}

            <div className="flex gap-2 flex-1 md:justify-content-end">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                outlined
                severity="secondary"
                className="w-full md:w-auto"
                onClick={onCancel}
                disabled={isSubmitting}
              />
              <Button
                label="Guardar"
                icon="pi pi-check"
                className="w-full md:w-auto"
                onClick={handleSave}
                loading={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Componente para visualizar observaciones */}
      <ObservacionViewer
        visible={observacionViewerVisible}
        onHide={() => setObservacionViewerVisible(false)}
        observaciones={getStageObservation()}
        titulo={`Observaciones - ${stage.title}`}
        onGuardarCambios={handleGuardarObservaciones}
      />
    </Sidebar>
  );
};

export default ProyectoStagePoaSidebar;