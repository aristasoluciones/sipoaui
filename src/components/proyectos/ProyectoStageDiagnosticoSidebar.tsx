'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { InputTextarea } from 'primereact/inputtextarea';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { ProyectoEtapasStorage } from '@/src/utils/sessionStorage';
import { useProjectOperations } from '@/src/hooks/useProjectOperations';
import { Proyecto, DiagnosticoData, EstatusEtapa } from '@/types/proyectos.d';

interface Stage {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  required: boolean;
}

interface ProyectoStageDiagnosticoSidebarProps {
  visible: boolean;
  onHide: () => void;
  stage: Stage;
  project: Proyecto;
  onCancel: () => void;
  onProjectReload?: () => void;
}

const ProyectoStageDiagnosticoSidebar: React.FC<ProyectoStageDiagnosticoSidebarProps> = ({
  visible,
  onHide,
  stage,
  project,
  onCancel,
  onProjectReload
}) => {
  // Valores iniciales por defecto
  const defaultInitialValues: DiagnosticoData = {
    diagnostico: '',
    efectos: '',
    fines: '',
    poblacionAfectada: '',
    descripcionProblema: '',
    magnitudLineaBase: '',
    causas: [''],
    poblacionObjetivo: '',
    descripcionResultadoEsperado: '',
    magnitudResultadoEsperado: '',
    medios: ['']
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<DiagnosticoData>(defaultInitialValues);
  const [hasDiagnosticoSaved, setHasDiagnosticoSaved] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const isFormValidRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const formikRef = useRef<any>(null);
  const hasLoadedData = useRef(false);

  // Usar el hook centralizado de operaciones
  const { handleSaveDiagnostico, handleGetDiagnostico, handleSolicitarRevision } = useProjectOperations({
    isCreating: false,
    selectedProject: project,
    onSuccess: () => {
      onProjectReload?.(); // Recargar el proyecto
      // Solo cerrar el sidebar si NO está en modo edición (es decir, primera creación)
      if (!isEditing) {
        onHide();
      }
    },
    onSavingStart: () => setIsSubmitting(true),
    onSavingEnd: () => setIsSubmitting(false),
    showSuccessMessages: true
  });

  // Esquema de validación con Yup
  const validationSchema = Yup.object().shape({
    diagnostico: Yup.string()
      .required('El diagnóstico es obligatorio')
      .min(10, 'El diagnóstico debe tener al menos 10 caracteres'),
    efectos: Yup.string()
      .required('Los efectos son obligatorios')
      .min(10, 'Los efectos deben tener al menos 10 caracteres'),
    fines: Yup.string()
      .required('Los fines son obligatorios')
      .min(10, 'Los fines deben tener al menos 10 caracteres'),
    poblacionAfectada: Yup.string()
      .required('La población afectada es obligatoria'),
    descripcionProblema: Yup.string()
      .required('La descripción del problema es obligatoria'),
    magnitudLineaBase: Yup.string()
      .required('La magnitud línea base es obligatoria'),
    causas: Yup.array()
      .of(Yup.string().required('Cada causa es obligatoria'))
      .min(1, 'Debe agregar al menos una causa')
      .required('Las causas son obligatorias'),
    poblacionObjetivo: Yup.string()
      .required('La población objetivo es obligatoria'),
    descripcionResultadoEsperado: Yup.string()
      .required('La descripción del resultado esperado es obligatoria'),
    magnitudResultadoEsperado: Yup.string()
      .required('La magnitud del resultado esperado es obligatoria'),
    medios: Yup.array()
      .of(Yup.string().required('Cada medio es obligatorio'))
      .min(1, 'Debe agregar al menos un medio')
      .required('Los medios son obligatorios')
  });

  // Cargar datos guardados de la API (solo una vez cuando se abre)
  useEffect(() => {
    const loadDiagnosticoData = async () => {
      if (hasLoadedData.current) return;
      
      hasLoadedData.current = true;
      try {
        const diagnosticoFromApi = await handleGetDiagnostico(project.uuid);
        if (diagnosticoFromApi) {
          setInitialFormValues(diagnosticoFromApi);
          setHasDiagnosticoSaved(true);
        } else {
          setInitialFormValues(defaultInitialValues);
          setHasDiagnosticoSaved(false);
        }
      } catch (error) {
        setInitialFormValues(defaultInitialValues);
        setHasDiagnosticoSaved(false);
      }
    };

    if (visible && !hasLoadedData.current) {
      loadDiagnosticoData();
    }

    // Resetear el flag cuando se cierra el sidebar
    if (!visible) {
      hasLoadedData.current = false;
      setHasDiagnosticoSaved(false); // Resetear el estado de diagnóstico guardado
      setIsEditing(false); // Resetear el estado de edición
    }
  }, [visible, project.uuid, handleGetDiagnostico]);

  const handleSubmit = async (values: DiagnosticoData) => {
    await handleSaveDiagnostico(project.uuid, values);
    setHasDiagnosticoSaved(true); // Marcar que ahora existe un diagnóstico guardado
    setIsEditing(false); // Resetear el estado de edición después de guardar
  };

  const handleSave = () => {
    // Activa el submit del formulario usando el ref
    if (formikRef.current) {
      formikRef.current.submitForm();
    }
  };

  const handleSendToRevision = async () => {
    try {
      await handleSolicitarRevision(project.uuid);
      onHide(); // Cerrar el sidebar después de enviar a revisión
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Encabezado del sidebar con estilos conservados
  const customHeader = () => {
    return (
      <div className="flex align-items-center gap-2 py-2">
        <i className="pi pi-angle-double-right text-xl text-primary-600"></i>
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
      className="w-full md:w-6 lg:w-8"
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
            {({ values, errors, touched, isValid, dirty }) => {
              // Actualizar el estado de validación del formulario
              if (isFormValidRef.current !== isValid) {
                isFormValidRef.current = isValid;
                setIsFormValid(isValid);
              }

              return (
                <Form>
                {/* Campo principal: Diagnóstico */}
                <fieldset className="mb-4 border-1 border-round surface-border surface-card">
                  <div className="field px-2 pb-2">
                    <label htmlFor="diagnostico" className="block text-900 font-medium mb-2">
                      Diagnóstico *
                    </label>
                    <Field name="diagnostico">
                      {({ field }: any) => (
                        <InputTextarea
                          {...field}
                          id="diagnostico"
                          rows={5}
                          readOnly={hasDiagnosticoSaved && !isEditing}
                          className={`w-full ${errors.diagnostico && touched.diagnostico ? 'p-invalid' : ''}`}
                          placeholder="Describe el diagnóstico general del problema..."
                        />
                      )}
                    </Field>
                    <ErrorMessage name="diagnostico" component="small" className="p-error block mt-1" />
                  </div>
                </fieldset>

                {/* Sección: Problemática vs Solución */}
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <fieldset className="h-full border-1 border-round surface-border surface-card">
                      <legend className="text-900 font-medium px-3 mb-3 flex align-items-center gap-2">
                        <Badge value="P" severity="danger" />
                        Problemática
                      </legend>
                      <div className="field px-2 pb-2">
                        <label htmlFor="efectos" className="block text-900 font-medium mb-2">
                          Efectos *
                        </label>
                        <Field name="efectos">
                          {({ field }: any) => (
                            <InputTextarea
                              {...field}
                              id="efectos"
                              rows={8}
                              readOnly={hasDiagnosticoSaved && !isEditing}
                              className={`w-full ${errors.efectos && touched.efectos ? 'p-invalid' : ''}`}
                              placeholder="Describe los efectos del problema..."
                            />
                          )}
                        </Field>
                        <ErrorMessage name="efectos" component="small" className="p-error block mt-1" />
                      </div>
                    </fieldset>
                  </div>

                  <div className="col-12 md:col-6">
                    <fieldset className="h-full border-1 border-round surface-border surface-card">
                      <legend className="text-900 font-medium px-3 mb-3 flex align-items-center gap-2">
                        <Badge value="S" severity="success" />
                        Solución
                      </legend>
                      <div className="field px-2 pb-2">
                        <label htmlFor="fines" className="block text-900 font-medium mb-2">
                          Fines *
                        </label>
                        <Field name="fines">
                          {({ field }: any) => (
                            <InputTextarea
                              {...field}
                              id="fines"
                              rows={8}
                              readOnly={hasDiagnosticoSaved && !isEditing}
                              className={`w-full ${errors.fines && touched.fines ? 'p-invalid' : ''}`}
                              placeholder="Describe los fines de la solución..."
                            />
                          )}
                        </Field>
                        <ErrorMessage name="fines" component="small" className="p-error block mt-1" />
                      </div>
                    </fieldset>
                  </div>
                </div>

                {/* Sección: Problema Central vs Objetivo */}
                <div className="grid mt-4">
                  <div className="col-12 md:col-6">
                    <fieldset className="h-full border-1 border-round surface-border surface-card">
                      <legend className="text-900 font-medium px-3 mb-3 flex align-items-center gap-2">
                        <Badge value="PC" severity="warning" />
                        Problema Central
                      </legend>
                      <div className="px-2 pb-2">
                        <div className="field mb-4">
                          <label htmlFor="poblacionAfectada" className="block text-900 font-medium mb-2">
                            Población Afectada *
                          </label>
                          <Field name="poblacionAfectada">
                            {({ field }: any) => (
                              <InputTextarea
                                {...field}
                                id="poblacionAfectada"
                                rows={4}
                                readOnly={hasDiagnosticoSaved && !isEditing}
                                className={`w-full ${errors.poblacionAfectada && touched.poblacionAfectada ? 'p-invalid' : ''}`}
                                placeholder="Describe la población afectada..."
                              />
                            )}
                          </Field>
                          <ErrorMessage name="poblacionAfectada" component="small" className="p-error block mt-1" />
                        </div>

                        <div className="field mb-4">
                          <label htmlFor="descripcionProblema" className="block text-900 font-medium mb-2">
                            Descripción del Problema *
                          </label>
                          <Field name="descripcionProblema">
                            {({ field }: any) => (
                              <InputTextarea
                                {...field}
                                id="descripcionProblema"
                                rows={6}
                                readOnly={hasDiagnosticoSaved && !isEditing}
                                className={`w-full ${errors.descripcionProblema && touched.descripcionProblema ? 'p-invalid' : ''}`}
                                placeholder="Describe detalladamente el problema..."
                              />
                            )}
                          </Field>
                          <ErrorMessage name="descripcionProblema" component="small" className="p-error block mt-1" />
                        </div>

                        <div className="field mb-4">
                          <label htmlFor="magnitudLineaBase" className="block text-900 font-medium mb-2">
                            Magnitud (Línea Base) *
                          </label>
                          <Field name="magnitudLineaBase">
                            {({ field }: any) => (
                              <InputTextarea
                                {...field}
                                id="magnitudLineaBase"
                                rows={4}
                                readOnly={hasDiagnosticoSaved && !isEditing}
                                className={`w-full ${errors.magnitudLineaBase && touched.magnitudLineaBase ? 'p-invalid' : ''}`}
                                placeholder="Describe la magnitud actual (línea base)..."
                              />
                            )}
                          </Field>
                          <ErrorMessage name="magnitudLineaBase" component="small" className="p-error block mt-1" />
                        </div>

                        <div className="field">
                          <label className="block text-900 font-medium mb-2">
                            Causas *
                          </label>
                          <FieldArray name="causas">
                            {({ push, remove }) => (
                              <div>
                                {values.causas.map((causa: string, index: number) => (
                                  <div key={index} className="flex align-items-center gap-2 mb-2">
                                    <Field name={`causas.${index}`}>
                                      {({ field }: any) => (
                                        <InputTextarea
                                          {...field}
                                          rows={3}
                                          readOnly={hasDiagnosticoSaved && !isEditing}
                                          className={`flex-1 ${(errors as any).causas?.[index] && (touched as any).causas?.[index] ? 'p-invalid' : ''}`}
                                          placeholder={`Causa ${index + 1}...`}
                                        />
                                      )}
                                    </Field>
                                    {values.causas.length > 1 && (
                                      <button
                                        type="button"
                                        className="p-button p-button-danger p-button-sm"
                                        onClick={() => remove(index)}
                                        disabled={hasDiagnosticoSaved && !isEditing}
                                      >
                                        <i className="pi pi-minus"></i>
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  className="p-button p-button-secondary p-button-sm mt-2"
                                  onClick={() => push('')}
                                  disabled={hasDiagnosticoSaved && !isEditing}
                                >
                                  <i className="pi pi-plus mr-2"></i>
                                  Agregar Causa
                                </button>
                                {errors.causas && typeof errors.causas === 'string' && (
                                  <small className="p-error block mt-1">{errors.causas}</small>
                                )}
                              </div>
                            )}
                          </FieldArray>
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  <div className="col-12 md:col-6">
                    <fieldset className="h-full border-1 border-round surface-border surface-card">
                      <legend className="text-900 font-medium px-3 mb-3 flex align-items-center gap-2">
                        <Badge value="O" severity="info" />
                        Objetivo
                      </legend>
                      <div className="px-2 pb-2">
                        <div className="field mb-4">
                          <label htmlFor="poblacionObjetivo" className="block text-900 font-medium mb-2">
                            Población Objetivo *
                          </label>
                          <Field name="poblacionObjetivo">
                            {({ field }: any) => (
                              <InputTextarea
                                {...field}
                                id="poblacionObjetivo"
                                rows={4}
                                readOnly={hasDiagnosticoSaved && !isEditing}
                                className={`w-full ${errors.poblacionObjetivo && touched.poblacionObjetivo ? 'p-invalid' : ''}`}
                                placeholder="Describe la población objetivo..."
                              />
                            )}
                          </Field>
                          <ErrorMessage name="poblacionObjetivo" component="small" className="p-error block mt-1" />
                        </div>

                        <div className="field mb-4">
                          <label htmlFor="descripcionResultadoEsperado" className="block text-900 font-medium mb-2">
                            Descripción del Resultado Esperado *
                          </label>
                          <Field name="descripcionResultadoEsperado">
                            {({ field }: any) => (
                              <InputTextarea
                                {...field}
                                id="descripcionResultadoEsperado"
                                rows={6}
                                readOnly={hasDiagnosticoSaved && !isEditing}
                                className={`w-full ${errors.descripcionResultadoEsperado && touched.descripcionResultadoEsperado ? 'p-invalid' : ''}`}
                                placeholder="Describe el resultado esperado..."
                              />
                            )}
                          </Field>
                          <ErrorMessage name="descripcionResultadoEsperado" component="small" className="p-error block mt-1" />
                        </div>

                        <div className="field mb-4">
                          <label htmlFor="magnitudResultadoEsperado" className="block text-900 font-medium mb-2">
                            Magnitud (Resultado Esperado) *
                          </label>
                          <Field name="magnitudResultadoEsperado">
                            {({ field }: any) => (
                              <InputTextarea
                                {...field}
                                id="magnitudResultadoEsperado"
                                rows={4}
                                readOnly={hasDiagnosticoSaved && !isEditing}
                                className={`w-full ${errors.magnitudResultadoEsperado && touched.magnitudResultadoEsperado ? 'p-invalid' : ''}`}
                                placeholder="Describe la magnitud esperada..."
                              />
                            )}
                          </Field>
                          <ErrorMessage name="magnitudResultadoEsperado" component="small" className="p-error block mt-1" />
                        </div>

                        {/* Lista de Medios */}
                        <div className="field">
                          <label className="block text-900 font-medium mb-2">
                            Medios *
                          </label>
                          <FieldArray name="medios">
                            {({ push, remove }) => (
                              <div>
                                {values.medios.map((medio: string, index: number) => (
                                  <div key={index} className="flex align-items-center gap-2 mb-2">
                                    <Field name={`medios.${index}`}>
                                      {({ field }: any) => (
                                        <InputTextarea
                                          {...field}
                                          rows={3}
                                          readOnly={hasDiagnosticoSaved && !isEditing}
                                          className={`flex-1 ${(errors as any).medios?.[index] && (touched as any).medios?.[index] ? 'p-invalid' : ''}`}
                                          placeholder={`Medio ${index + 1}...`}
                                        />
                                      )}
                                    </Field>
                                    {values.medios.length > 1 && (
                                      <button
                                        type="button"
                                        className="p-button p-button-danger p-button-sm"
                                        onClick={() => remove(index)}
                                        disabled={hasDiagnosticoSaved && !isEditing}
                                      >
                                        <i className="pi pi-minus"></i>
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  className="p-button p-button-secondary p-button-sm mt-2"
                                  onClick={() => push('')}
                                  disabled={hasDiagnosticoSaved && !isEditing}
                                >
                                  <i className="pi pi-plus mr-2"></i>
                                  Agregar Medio
                                </button>
                                {errors.medios && typeof errors.medios === 'string' && (
                                  <small className="p-error block mt-1">{errors.medios}</small>
                                )}
                              </div>
                            )}
                          </FieldArray>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </Form>
              );
            }}
          </Formik>
        </div>
        <div className="mt-auto border-top-1 surface-border p-4">
          <div className="flex gap-2">
            {/* Botón de cancelar - siempre presente */}
            <Button
              label={hasDiagnosticoSaved && isEditing ? "Cancelar Edición" : "Cerrar"}
              icon="pi pi-times"
              outlined
              severity="secondary"
              className="flex-1"
              onClick={hasDiagnosticoSaved && isEditing ? handleCancelEdit : onCancel}
              disabled={isSubmitting}
            />

            {hasDiagnosticoSaved && !isEditing ? (
              // Cuando existe diagnóstico y no está en edición: mostrar Editar y Enviar a Revisión
              <>
                <Button
                  label="Editar"
                  icon="pi pi-pencil"
                  severity="info"
                  className="flex-1"
                  onClick={handleEdit}
                  disabled={isSubmitting}
                />
                <Button
                  label="Enviar a Revisión"
                  icon="pi pi-send"
                  severity="success"
                  className="flex-1"
                  onClick={handleSendToRevision}
                  loading={isSubmitting}
                  disabled={!isFormValid}
                />
              </>
            ) : (
              // Cuando no existe diagnóstico o está en modo edición: mostrar solo Guardar
              <Button
                label="Guardar"
                icon="pi pi-check"
                className="flex-1"
                onClick={handleSave}
                loading={isSubmitting}
                disabled={!isFormValid}
              />
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default ProyectoStageDiagnosticoSidebar;