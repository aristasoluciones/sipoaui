'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { useNotification } from '@/layout/context/notificationContext';
import { ProyectoEtapasStorage, BeneficiariosData } from '@/src/utils/sessionStorage';
import { Proyecto, EstatusEtapa, Observacion, Stage } from '@/types/proyectos.d';
import ObservacionViewer from './ObservacionViewer';

interface ProyectoStageBeneficiariosSidebarProps {
  visible: boolean;
  onHide: () => void;
  stage: Stage;
  project: Proyecto;
  onSave: () => void;
  onCancel: () => void;
}

const ProyectoStageBeneficiariosSidebar: React.FC<ProyectoStageBeneficiariosSidebarProps> = ({
  visible,
  onHide,
  stage,
  project,
  onSave,
  onCancel
}) => {
  // Valores iniciales por defecto
  const defaultInitialValues: BeneficiariosData = {
    numeroBeneficiarios: undefined,
    perfilBeneficiarios: '',
    criteriosSeleccion: ''
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<BeneficiariosData>(defaultInitialValues);
  const formikRef = useRef<any>(null);
  const { success, error: showError } = useNotification();
  const [observacionViewerVisible, setObservacionViewerVisible] = useState(false);

  // Esquema de validación con Yup
  const validationSchema = Yup.object().shape({
    numeroBeneficiarios: Yup.number()
      .required('El número de beneficiarios es obligatorio')
      .min(1, 'Debe haber al menos 1 beneficiario')
      .integer('El número debe ser entero'),
    perfilBeneficiarios: Yup.string()
      .required('El perfil de beneficiarios es obligatorio')
      .min(10, 'El perfil debe tener al menos 10 caracteres'),
    criteriosSeleccion: Yup.string()
      .required('Los criterios de selección son obligatorios')
      .min(10, 'Los criterios deben tener al menos 10 caracteres')
  });

  // Cargar datos guardados del sessionStorage
  useEffect(() => {
    const savedData = ProyectoEtapasStorage.getEtapaData(
      project.uuid,
      3
    ) as BeneficiariosData | null;

    if (savedData) {
      setInitialFormValues(savedData);
    }
  }, [project.uuid]);

  const handleSubmit = async (values: BeneficiariosData) => {
    setIsSubmitting(true);
    try {
      // Guardar en sessionStorage
      ProyectoEtapasStorage.saveEtapaData(
        project.uuid,
        3,
        values
      );

      success('Beneficiarios guardados', 'Los datos de beneficiarios se han guardado correctamente');
      onSave();
    } catch (err) {
      console.error('Error guardando beneficiarios:', err);
      showError('Error al guardar', 'No se pudieron guardar los datos de beneficiarios. Intente nuevamente.');
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
                {/* Campo: Número de Beneficiarios */}
                <div className="field mb-4">
                  <label htmlFor="numeroBeneficiarios" className="block text-900 font-medium mb-2">
                    Número de Beneficiarios *
                  </label>
                  <Field name="numeroBeneficiarios">
                    {({ field }: any) => (
                      <InputNumber
                        {...field}
                        id="numeroBeneficiarios"
                        value={field.value}
                        onValueChange={(e) => field.onChange({ target: { name: field.name, value: e.value } })}
                        className={`w-full ${errors.numeroBeneficiarios && touched.numeroBeneficiarios ? 'p-invalid' : ''}`}
                        placeholder="Ingrese el número total de beneficiarios"
                        min={1}
                        useGrouping={false}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="numeroBeneficiarios" component="small" className="p-error block mt-1" />
                </div>

                {/* Campo: Perfil de Beneficiarios */}
                <div className="field mb-4">
                  <label htmlFor="perfilBeneficiarios" className="block text-900 font-medium mb-2">
                    Perfil de Beneficiarios *
                  </label>
                  <Field name="perfilBeneficiarios">
                    {({ field }: any) => (
                      <InputTextarea
                        {...field}
                        id="perfilBeneficiarios"
                        rows={6}
                        className={`w-full ${errors.perfilBeneficiarios && touched.perfilBeneficiarios ? 'p-invalid' : ''}`}
                        placeholder="Describe el perfil de los beneficiarios (edad, género, condición socioeconómica, etc.)..."
                      />
                    )}
                  </Field>
                  <ErrorMessage name="perfilBeneficiarios" component="small" className="p-error block mt-1" />
                </div>

                {/* Campo: Criterios de Selección */}
                <div className="field mb-4">
                  <label htmlFor="criteriosSeleccion" className="block text-900 font-medium mb-2">
                    Criterios de Selección *
                  </label>
                  <Field name="criteriosSeleccion">
                    {({ field }: any) => (
                      <InputTextarea
                        {...field}
                        id="criteriosSeleccion"
                        rows={6}
                        className={`w-full ${errors.criteriosSeleccion && touched.criteriosSeleccion ? 'p-invalid' : ''}`}
                        placeholder="Describe los criterios que se utilizarán para seleccionar a los beneficiarios..."
                      />
                    )}
                  </Field>
                  <ErrorMessage name="criteriosSeleccion" component="small" className="p-error block mt-1" />
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

export default ProyectoStageBeneficiariosSidebar;