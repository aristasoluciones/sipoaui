'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataView } from 'primereact/dataview';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Sidebar } from 'primereact/sidebar';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { BreadCrumb } from 'primereact/breadcrumb';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useNotification } from '@/layout/context/notificationContext';
import { usePermissions } from '@/src/hooks/usePermissions';
import { unidadesService } from '@/src/services/catalogos.service';
import { formatApiError } from '@/src/utils';

interface Funcion {
  titulo: string;
  descripcion: string;
}

interface Competencia {
  nombre: string;
  tipo: 'Clave' | 'Directivas';
  gradoDominio: 'Alto' | 'Medio' | 'Bajo';
}

interface Cedula {
  id?: number;
  // Identificación
  denominacion: string;
  areaAdscripcion: number | null;
  cuerpo: 'Ejecutivo' | 'Tecnico' | '';
  puestoSuperior: string;
  clave: string;
  // Descripción
  fundamentoJuridico: string;
  mision: string;
  objetivo: string;
  funciones: Funcion[];
  // Perfil - Requisitos Académicos
  nivelEstudios: string;
  gradoAvance: string;
  areaAcademica: string;
  // Perfil - Experiencia
  aniosExperiencia: number;
  // Competencias
  competencias: Competencia[];
  // Periodo y plazas
  fechaInicio: Date | null;
  fechaConclusion: Date | null;
  numeroPlazas: number;
  estado?: string;
}

const CedulaCargosPage = () => {
  const router = useRouter();
  const { success, error } = useNotification();
  const { canAccess } = usePermissions();

  const [cedulas, setCedulas] = useState<Cedula[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingCedula, setEditingCedula] = useState<Cedula | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');

  const canCreate = canAccess('catalogos.recursos_humanos_presupuestarios_y_financieros.cargos', ['create']);
  const canUpdate = canAccess('catalogos.recursos_humanos_presupuestarios_y_financieros.cargos', ['update']);
  const canDelete = canAccess('catalogos.recursos_humanos_presupuestarios_y_financieros.cargos', ['delete']);

  const nivelesEstudio = [
    { label: 'Primaria', value: 'Primaria' },
    { label: 'Secundaria', value: 'Secundaria' },
    { label: 'Preparatoria', value: 'Preparatoria' },
    { label: 'Licenciatura', value: 'Licenciatura' },
    { label: 'Maestría', value: 'Maestría' },
    { label: 'Doctorado', value: 'Doctorado' }
  ];

  const areasAcademicas = [
    { label: 'Administración', value: 'Administración' },
    { label: 'Contabilidad', value: 'Contabilidad' },
    { label: 'Derecho', value: 'Derecho' },
    { label: 'Ingeniería', value: 'Ingeniería' },
    { label: 'Ciencias Sociales', value: 'Ciencias Sociales' },
    { label: 'Educación', value: 'Educación' },
    { label: 'Ciencias de la Salud', value: 'Ciencias de la Salud' },
    { label: 'Otras', value: 'Otras' }
  ];

  const breadcrumbItems = [
    { label: 'Inicio', command: () => router.push('/') },
    { label: 'Catálogos', command: () => router.push('/catalogos') },
    { label: 'Recursos Humanos, Presupuestarios y Financieros', command: () => router.push('/catalogos') },
    { label: 'Cédula de Cargos y Puestos', className: 'font-bold text-900' }
  ];

  const home = { icon: 'pi pi-home', command: () => router.push('/') };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Cargar unidades
      const unidadesData = await unidadesService.getAll();
      setUnidades(unidadesData.map((u: any) => ({ label: u.nombre, value: u.id })));
      
      // TODO: Cargar cédulas desde API
      setCedulas([]);
    } catch (err) {
      error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditingCedula({
      denominacion: '',
      areaAdscripcion: null,
      cuerpo: '',
      puestoSuperior: '',
      clave: '',
      fundamentoJuridico: '',
      mision: '',
      objetivo: '',
      funciones: [{ titulo: '', descripcion: '' }],
      nivelEstudios: '',
      gradoAvance: '',
      areaAcademica: '',
      aniosExperiencia: 0,
      competencias: [{ nombre: '', tipo: 'Clave', gradoDominio: 'Medio' }],
      fechaInicio: null,
      fechaConclusion: null,
      numeroPlazas: 1
    });
    setShowSidebar(true);
  };

  const editCedula = (cedula: Cedula) => {
    setEditingCedula({ ...cedula });
    setShowSidebar(true);
  };

  const saveCedula = async () => {
    if (!editingCedula) return;

    // Validaciones
    if (!editingCedula.denominacion || !editingCedula.clave) {
      error('Denominación y clave son requeridos');
      return;
    }

    try {
      setSaving(true);
      // TODO: Implementar guardado en API
      success('Cédula guardada exitosamente');
      setShowSidebar(false);
      await loadData();
    } catch (err) {
      error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteCedula = (cedula: Cedula) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la cédula "${cedula.denominacion}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          // TODO: Implementar eliminación en API
          success('Cédula eliminada exitosamente');
          await loadData();
        } catch (err) {
          error(formatApiError(err));
        }
      }
    });
  };

  const addFuncion = () => {
    if (editingCedula) {
      setEditingCedula({
        ...editingCedula,
        funciones: [...editingCedula.funciones, { titulo: '', descripcion: '' }]
      });
    }
  };

  const removeFuncion = (index: number) => {
    if (editingCedula) {
      const newFunciones = editingCedula.funciones.filter((_, i) => i !== index);
      setEditingCedula({ ...editingCedula, funciones: newFunciones });
    }
  };

  const updateFuncion = (index: number, field: 'titulo' | 'descripcion', value: string) => {
    if (editingCedula) {
      const newFunciones = [...editingCedula.funciones];
      newFunciones[index][field] = value;
      setEditingCedula({ ...editingCedula, funciones: newFunciones });
    }
  };

  const addCompetencia = () => {
    if (editingCedula) {
      setEditingCedula({
        ...editingCedula,
        competencias: [...editingCedula.competencias, { nombre: '', tipo: 'Clave', gradoDominio: 'Medio' }]
      });
    }
  };

  const removeCompetencia = (index: number) => {
    if (editingCedula) {
      const newCompetencias = editingCedula.competencias.filter((_, i) => i !== index);
      setEditingCedula({ ...editingCedula, competencias: newCompetencias });
    }
  };

  const updateCompetencia = (index: number, field: keyof Competencia, value: any) => {
    if (editingCedula) {
      const newCompetencias = [...editingCedula.competencias];
      (newCompetencias[index] as any)[field] = value;
      setEditingCedula({ ...editingCedula, competencias: newCompetencias });
    }
  };

  const itemTemplate = (cedula: Cedula) => {
    return (
      <div className="col-12">
        <div className="card mb-3">
          <div className="flex justify-content-between align-items-start">
            <div className="flex-grow-1">
              <div className="flex align-items-center gap-3 mb-2">
                <div className="flex align-items-center justify-content-center bg-blue-100 border-round"
                     style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-id-card text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h6 className="m-0 text-900 font-semibold">{cedula.denominacion}</h6>
                  <p className="m-0 text-600 text-sm">Clave: {cedula.clave}</p>
                </div>
              </div>
              
              <div className="grid mt-3">
                <div className="col-12 md:col-6">
                  <div className="text-600 text-sm mb-1">Cuerpo</div>
                  <div className="text-900">{cedula.cuerpo || 'N/A'}</div>
                </div>
                <div className="col-12 md:col-6">
                  <div className="text-600 text-sm mb-1">Puesto Superior</div>
                  <div className="text-900">{cedula.puestoSuperior || 'N/A'}</div>
                </div>
                <div className="col-12">
                  <div className="text-600 text-sm mb-1">Misión</div>
                  <div className="text-900">{cedula.mision ? cedula.mision.substring(0, 150) + '...' : 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 ml-3">
              {canUpdate && (
                <Button
                  icon="pi pi-pencil"
                  rounded
                  text
                  severity="success"
                  onClick={() => editCedula(cedula)}
                  tooltip="Editar"
                />
              )}
              {canDelete && (
                <Button
                  icon="pi pi-trash"
                  rounded
                  text
                  severity="danger"
                  onClick={() => deleteCedula(cedula)}
                  tooltip="Eliminar"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const header = (
    <div className="flex justify-content-between align-items-center">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          placeholder="Buscar cédula..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </span>
      {canCreate && (
        <Button
          label="Nueva Cédula"
          icon="pi pi-plus"
          onClick={openNew}
        />
      )}
    </div>
  );

  return (
    <>
      <ConfirmDialog />
      
      <div className="grid">
        <div className="col-12">
          <BreadCrumb model={breadcrumbItems} home={home} className="mb-4" />
        </div>

        <div className="col-12">
          <div className="card mb-3">
            <div className="flex justify-content-between align-items-start">
              <div className="flex-grow-1">
                <h5 className="m-0">
                  <i className="pi pi-id-card mr-2"></i>
                  Cédula de Cargos y Puestos
                </h5>
                <p className="text-600 mt-2 mb-0">
                  Gestión de cédulas con información completa de cargos y puestos
                </p>
              </div>
              <Button
                label="Regresar a Catálogos"
                icon="pi pi-arrow-left"
                outlined
                onClick={() => router.push('/catalogos')}
              />
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <DataView
              value={cedulas}
              layout="list"
              header={header}
              itemTemplate={itemTemplate}
              paginator
              rows={10}
              emptyMessage="No hay cédulas registradas"
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Sidebar para formulario */}
      <Sidebar
        visible={showSidebar}
        position="right"
        onHide={() => setShowSidebar(false)}
        className="w-full md:w-30rem lg:w-6 xl:w-5"
        header={
          <div>
            <h3 className="m-0">{editingCedula?.id ? 'Editar Cédula' : 'Nueva Cédula'}</h3>
            <p className="text-600 text-sm mt-1 mb-0">
              Complete la información de la cédula de cargo o puesto
            </p>
          </div>
        }
      >
        {editingCedula && (
          <div className="flex flex-column h-full">
            <div className="flex-grow-1 overflow-y-auto px-3">
              {/* SECCIÓN: IDENTIFICACIÓN */}
              <div className="mb-4">
                <h6 className="text-primary-600 font-semibold mb-3 flex align-items-center">
                  <i className="pi pi-id-card mr-2"></i>
                  Identificación del Cargo o Puesto
                </h6>
                
                <div className="field mb-3">
                  <label htmlFor="denominacion" className="font-medium text-900">
                    Denominación del Cargo <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="denominacion"
                    value={editingCedula.denominacion}
                    onChange={(e) => setEditingCedula({ ...editingCedula, denominacion: e.target.value })}
                    className="w-full"
                    placeholder="Ej: Director de Recursos Humanos"
                  />
                </div>

                <div className="field mb-3">
                  <label htmlFor="areaAdscripcion" className="font-medium text-900">
                    Área/Adscripción
                  </label>
                  <Dropdown
                    id="areaAdscripcion"
                    value={editingCedula.areaAdscripcion}
                    options={unidades}
                    onChange={(e) => setEditingCedula({ ...editingCedula, areaAdscripcion: e.value })}
                    placeholder="Seleccionar unidad"
                    className="w-full"
                    showClear
                  />
                </div>

                <div className="field mb-3">
                  <label htmlFor="cuerpo" className="font-medium text-900">
                    Cuerpo
                  </label>
                  <Dropdown
                    id="cuerpo"
                    value={editingCedula.cuerpo}
                    options={[
                      { label: 'Ejecutivo', value: 'Ejecutivo' },
                      { label: 'Técnico', value: 'Tecnico' }
                    ]}
                    onChange={(e) => setEditingCedula({ ...editingCedula, cuerpo: e.value })}
                    placeholder="Seleccionar cuerpo"
                    className="w-full"
                  />
                </div>

                <div className="field mb-3">
                  <label htmlFor="puestoSuperior" className="font-medium text-900">
                    Cargo/Puesto Inmediato Superior
                  </label>
                  <InputText
                    id="puestoSuperior"
                    value={editingCedula.puestoSuperior}
                    onChange={(e) => setEditingCedula({ ...editingCedula, puestoSuperior: e.target.value })}
                    className="w-full"
                    placeholder="Ej: Titular de la Institución"
                  />
                </div>

                <div className="field mb-3">
                  <label htmlFor="clave" className="font-medium text-900">
                    Clave <span className="text-red-500">*</span>
                  </label>
                  <InputText
                    id="clave"
                    value={editingCedula.clave}
                    onChange={(e) => setEditingCedula({ ...editingCedula, clave: e.target.value })}
                    className="w-full"
                    placeholder="Ej: DRH-01"
                  />
                </div>
              </div>

              <Divider />

              {/* SECCIÓN: DESCRIPCIÓN */}
              <div className="mb-4">
                <h6 className="text-primary-600 font-semibold mb-3 flex align-items-center">
                  <i className="pi pi-file-edit mr-2"></i>
                  Descripción
                </h6>

                <div className="field mb-3">
                  <label htmlFor="fundamentoJuridico" className="font-medium text-900">
                    Fundamento Jurídico
                  </label>
                  <InputText
                    id="fundamentoJuridico"
                    value={editingCedula.fundamentoJuridico}
                    onChange={(e) => setEditingCedula({ ...editingCedula, fundamentoJuridico: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="field mb-3">
                  <label htmlFor="mision" className="font-medium text-900">
                    Misión <span className="text-red-500">*</span>
                  </label>
                  <InputTextarea
                    id="mision"
                    value={editingCedula.mision}
                    onChange={(e) => setEditingCedula({ ...editingCedula, mision: e.target.value })}
                    rows={3}
                    className="w-full"
                  />
                </div>

                <div className="field mb-3">
                  <label htmlFor="objetivo" className="font-medium text-900">
                    Objetivo
                  </label>
                  <InputTextarea
                    id="objetivo"
                    value={editingCedula.objetivo}
                    onChange={(e) => setEditingCedula({ ...editingCedula, objetivo: e.target.value })}
                    rows={3}
                    className="w-full"
                  />
                </div>

                <div className="field mb-3">
                  <div className="flex justify-content-between align-items-center mb-2">
                    <label className="font-medium text-900">Funciones</label>
                    <Button
                      icon="pi pi-plus"
                      size="small"
                      label="Agregar Función"
                      onClick={addFuncion}
                    />
                  </div>
                  
                  {editingCedula.funciones.map((funcion, index) => (
                    <div key={index} className="p-3 border-1 border-300 border-round mb-2">
                      <div className="flex justify-content-between align-items-center mb-2">
                        <span className="font-semibold text-sm">Función {index + 1}</span>
                        {editingCedula.funciones.length > 1 && (
                          <Button
                            icon="pi pi-trash"
                            size="small"
                            text
                            severity="danger"
                            onClick={() => removeFuncion(index)}
                          />
                        )}
                      </div>
                      <InputText
                        value={funcion.titulo}
                        onChange={(e) => updateFuncion(index, 'titulo', e.target.value)}
                        placeholder="Título de la función"
                        className="w-full mb-2"
                      />
                      <InputTextarea
                        value={funcion.descripcion}
                        onChange={(e) => updateFuncion(index, 'descripcion', e.target.value)}
                        placeholder="Descripción de la función"
                        rows={2}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Divider />
              {/* SECCIÓN: PERFIL */}
              <div className="mb-4">
                <h6 className="text-primary-600 font-semibold mb-3 flex align-items-center">
                  <i className="pi pi-user mr-2"></i>
                  Perfil
                </h6>

                {/* Requisitos Académicos */}
                <div className="mb-3">
                  <h6 className="text-700 font-semibold text-sm mb-2">Requisitos Académicos</h6>
                  
                  <div className="field mb-3">
                    <label htmlFor="nivelEstudios" className="font-medium text-900">
                      Nivel de Estudios
                    </label>
                    <Dropdown
                      id="nivelEstudios"
                      value={editingCedula.nivelEstudios}
                      options={nivelesEstudio}
                      onChange={(e) => setEditingCedula({ ...editingCedula, nivelEstudios: e.value })}
                      placeholder="Seleccionar nivel"
                      className="w-full"
                    />
                  </div>

                  <div className="field mb-3">
                    <label htmlFor="gradoAvance" className="font-medium text-900">
                      Grado de Avance
                    </label>
                    <InputText
                      id="gradoAvance"
                      value={editingCedula.gradoAvance}
                      onChange={(e) => setEditingCedula({ ...editingCedula, gradoAvance: e.target.value })}
                      className="w-full"
                      placeholder="Ej: Titulado, Pasante"
                    />
                  </div>

                  <div className="field mb-3">
                    <label htmlFor="areaAcademica" className="font-medium text-900">
                      Área Académica
                    </label>
                    <Dropdown
                      id="areaAcademica"
                      value={editingCedula.areaAcademica}
                      options={areasAcademicas}
                      onChange={(e) => setEditingCedula({ ...editingCedula, areaAcademica: e.value })}
                      placeholder="Seleccionar área"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Experiencia Laboral */}
                <div className="mb-3">
                  <h6 className="text-700 font-semibold text-sm mb-2">Requisitos de Experiencia Laboral</h6>
                  
                  <div className="field mb-3">
                    <label htmlFor="aniosExperiencia" className="font-medium text-900">
                      Años de Experiencia
                    </label>
                    <InputText
                      id="aniosExperiencia"
                      type="number"
                      value={editingCedula.aniosExperiencia.toString()}
                      onChange={(e) => setEditingCedula({ ...editingCedula, aniosExperiencia: parseInt(e.target.value) || 0 })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <Divider />

              {/* SECCIÓN: COMPETENCIAS */}
              <div className="mb-4">
                <h6 className="text-primary-600 font-semibold mb-3 flex align-items-center">
                  <i className="pi pi-star mr-2"></i>
                  Competencias
                </h6>

                <div className="flex justify-content-end mb-2">
                  <Button
                    icon="pi pi-plus"
                    size="small"
                    label="Agregar Competencia"
                    onClick={addCompetencia}
                  />
                </div>

                {editingCedula.competencias.map((competencia, index) => (
                  <div key={index} className="p-3 border-1 border-300 border-round mb-2">
                    <div className="flex justify-content-between align-items-center mb-2">
                      <span className="font-semibold text-sm">Competencia {index + 1}</span>
                      {editingCedula.competencias.length > 1 && (
                        <Button
                          icon="pi pi-trash"
                          size="small"
                          text
                          severity="danger"
                          onClick={() => removeCompetencia(index)}
                        />
                      )}
                    </div>
                    
                    <div className="field mb-2">
                      <label className="text-sm font-medium text-900">Nombre</label>
                      <InputText
                        value={competencia.nombre}
                        onChange={(e) => updateCompetencia(index, 'nombre', e.target.value)}
                        placeholder="Nombre de la competencia"
                        className="w-full"
                      />
                    </div>

                    <div className="field mb-2">
                      <label className="text-sm font-medium text-900">Tipo</label>
                      <Dropdown
                        value={competencia.tipo}
                        options={[
                          { label: 'Clave', value: 'Clave' },
                          { label: 'Directivas', value: 'Directivas' }
                        ]}
                        onChange={(e) => updateCompetencia(index, 'tipo', e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="field mb-0">
                      <label className="text-sm font-medium text-900">Grado de Dominio</label>
                      <Dropdown
                        value={competencia.gradoDominio}
                        options={[
                          { label: 'Alto', value: 'Alto' },
                          { label: 'Medio', value: 'Medio' },
                          { label: 'Bajo', value: 'Bajo' }
                        ]}
                        onChange={(e) => updateCompetencia(index, 'gradoDominio', e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Divider />

              {/* SECCIÓN: PERIODO Y PLAZAS */}
              <div className="mb-4">
                <h6 className="text-primary-600 font-semibold mb-3 flex align-items-center">
                  <i className="pi pi-calendar mr-2"></i>
                  Periodo de Contratación y Número de Plazas
                </h6>

                <div className="grid">
                  <div className="col-12 md:col-4">
                    <div className="field">
                      <label htmlFor="fechaInicio" className="font-medium text-900">
                        Fecha de Inicio
                      </label>
                      <Calendar
                        id="fechaInicio"
                        value={editingCedula.fechaInicio}
                        onChange={(e) => setEditingCedula({ ...editingCedula, fechaInicio: e.value as Date })}
                        dateFormat="dd/mm/yy"
                        showIcon
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="col-12 md:col-4">
                    <div className="field">
                      <label htmlFor="fechaConclusion" className="font-medium text-900">
                        Fecha de Conclusión
                      </label>
                      <Calendar
                        id="fechaConclusion"
                        value={editingCedula.fechaConclusion}
                        onChange={(e) => setEditingCedula({ ...editingCedula, fechaConclusion: e.value as Date })}
                        dateFormat="dd/mm/yy"
                        showIcon
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="col-12 md:col-4">
                    <div className="field">
                      <label htmlFor="numeroPlazas" className="font-medium text-900">
                        Número de Plazas
                      </label>
                      <InputText
                        id="numeroPlazas"
                        type="number"
                        value={editingCedula.numeroPlazas.toString()}
                        onChange={(e) => setEditingCedula({ ...editingCedula, numeroPlazas: parseInt(e.target.value) || 1 })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border-round">
                <small className="text-600">
                  <i className="pi pi-info-circle mr-2"></i>
                  Los campos marcados con <span className="text-red-500">*</span> son obligatorios
                </small>
              </div>
            </div>

            {/* Footer fijo */}
            <div className="flex gap-2 p-3 border-top-1 border-300">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                severity="secondary"
                outlined
                onClick={() => setShowSidebar(false)}
                className="flex-1"
              />
              <Button
                label="Guardar"
                icon="pi pi-check"
                onClick={saveCedula}
                loading={saving}
                className="flex-1"
              />
            </div>
          </div>
        )}
      </Sidebar>
    </>
  );
};

export default CedulaCargosPage;