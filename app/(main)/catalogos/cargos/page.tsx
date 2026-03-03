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
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Chips } from 'primereact/chips';
import { Divider } from 'primereact/divider';
import { BreadCrumb } from 'primereact/breadcrumb';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useNotification } from '@/layout/context/notificationContext';
import { usePermissions } from '@/src/hooks/usePermissions';
import { unidadesService } from '@/src/services/catalogos.service';
import { formatApiError } from '@/src/utils';

interface Funcion {
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
    areaAcademica: string[];
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

const STORAGE_KEY = 'sipoa_catalogo_cedulas_cargos_v1';
const SEEDED_KEY = 'sipoa_catalogo_cedulas_cargos_seeded_v1';

/**
 * Datos de demo basados en el Excel "Anteproyecto 2026 UTSI" - Cédula 1
 */
const getCedulaDemoFromExcel = (): Cedula => ({
    id: 1,
    denominacion: 'JEFE DE DEPARTAMENTO DE SISTEMAS',
    areaAdscripcion: null,
    cuerpo: 'Ejecutivo',
    puestoSuperior: 'Titular de la Unidad Técnica',
    clave: '1113171',
    fundamentoJuridico: 'Reglamento Interno del Instituto de Elecciones y Participación Ciudadana del Estado de Chiapas, artículo 35.',
    mision: 'Desarrollar, coordinar e implementar soluciones de innovación tecnológica y de comunicación, que brinden a los órganos administrativos centrales y desconcentrados herramientas para la simplificación de sus tareas institucionales.',
    objetivo: 'Implementar acciones para la sistematización de los procesos administrativos y electorales del Instituto, optimizando el rendimiento operativo, cumpliendo con los requerimientos de la normatividad vigente.',
    funciones: [
        {
            descripcion: 'Planificar y aplicar estratégicas para el desarrollo, implementación y operación de sistemas de información.'
        },
        {
            descripcion: 'Coordinarse con los Órganos Administrativos para la definición de los requerimientos de los análisis y diseños de los sistemas de información.'
        },
        {
            descripcion: 'Coordinar el diseño de la arquitectura de los sistemas informáticos.'
        },
        {
            descripcion: 'Supervisar el desarrollo de pruebas de unidad y control de calidad de los sistemas de información institucionales.'
        },
        {
            descripcion: 'Implementar los mecanismos para capacitar al personal del Instituto en el uso y operación de los sistemas y servicios de información.'
        },
        {
            descripcion: 'Coordinar y brindar soporte técnico en relación a los sistemas de información.'
        },
        {
            descripcion: 'Proponer, desarrollar e implementar la automatización de procesos de las actividades ordinarias y electorales.'
        },
        {
            descripcion: 'Coordinar el diseño y desarrollo de las bases de datos de los sistemas de información.'
        },
        {
            descripcion: 'Desarrollo de aplicativos móviles.'
        },
        {
            descripcion: 'Supervisar el monitoreo del comportamiento de las bases de datos de los sistemas de información del Instituto.'
        },
        {
            descripcion: 'Investigación de nuevas tecnologías, plataformas y métodos de diseño y desarrollo aplicables en sistemas de información, bases de datos y sitios web.'
        },
        {
            descripcion: 'Administrar los servidores físicos y virtuales del Instituto.'
        },
        {
            descripcion: 'Las demás que determinen las disposiciones aplicables o le delegue el/la Jefe(a) de la Unidad Técnica de Servicios Informáticos, dentro del ámbito de su competencia.'
        }
    ],
    nivelEstudios: 'Licenciatura',
    gradoAvance: 'Pasante',
    areaAcademica: ['Licenciatura en Informática', 'Ciencias de la Computación', 'Sistemas Computacionales', 'Equivalentes'],
    aniosExperiencia: 1,
    competencias: [
        { nombre: 'Visión Institucional', tipo: 'Clave', gradoDominio: 'Alto' },
        { nombre: 'Iniciativa Personal', tipo: 'Clave', gradoDominio: 'Alto' },
        { nombre: 'Ética', tipo: 'Clave', gradoDominio: 'Alto' },
        { nombre: 'Manejo de Conflictos', tipo: 'Clave', gradoDominio: 'Alto' },
        { nombre: 'Liderazgo', tipo: 'Directivas', gradoDominio: 'Alto' },
        { nombre: 'Toma de Decisiones', tipo: 'Directivas', gradoDominio: 'Alto' },
        { nombre: 'Capacidad de Negociación y Colaboración', tipo: 'Directivas', gradoDominio: 'Alto' },
        { nombre: 'Capacidad de respuesta bajo presión', tipo: 'Directivas', gradoDominio: 'Alto' }
    ],
    fechaInicio: new Date('2026-01-01T00:00:00'),
    fechaConclusion: new Date('2026-12-31T00:00:00'),
    numeroPlazas: 3
});

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
    const [viewingCedula, setViewingCedula] = useState<Cedula | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');

    const canCreate = canAccess('catalogos.recursos_humanos_presupuestarios_y_financieros.cargos_y_puestos', ['create']);
    const canUpdate = canAccess('catalogos.recursos_humanos_presupuestarios_y_financieros.cargos_y_puestos', ['update']);
    const canDelete = canAccess('catalogos.recursos_humanos_presupuestarios_y_financieros.cargos_y_puestos', ['delete']);

    const nivelesEstudio = [
        { label: 'Primaria', value: 'Primaria' },
        { label: 'Secundaria', value: 'Secundaria' },
        { label: 'Preparatoria', value: 'Preparatoria' },
        { label: 'Licenciatura', value: 'Licenciatura' },
        { label: 'Maestría', value: 'Maestría' },
        { label: 'Doctorado', value: 'Doctorado' }
    ];

    const breadcrumbItems = [
        { label: 'Inicio', command: () => router.push('/') },
        { label: 'Catálogos', command: () => router.push('/catalogos') },
        { label: 'Recursos Humanos, Presupuestarios y Financieros', command: () => router.push('/catalogos') },
        { label: 'Cédula de Cargos y Puestos', className: 'font-bold text-900' }
    ];

    const home = { icon: 'pi pi-home', command: () => router.push('/') };

    /** Resolver ID de unidad a nombre para mostrar en la vista de detalle */
    const getUnidadNombre = (id: number | null): string => {
        if (!id) return 'Sin asignar';
        const unidad = unidades.find((u) => u.value === id);
        return unidad ? unidad.label : 'Sin asignar';
    };

    useEffect(() => {
        // Verificar si ya se hizo el seeding inicial
        if (typeof window !== 'undefined') {
            window.localStorage.getItem(SEEDED_KEY);
        }
        loadData();
    }, []);

    const persistCedulas = (nextCedulas: Cedula[]) => {
        setCedulas(nextCedulas);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCedulas));
    };

    const loadData = async () => {
        try {
            setLoading(true);
            // Cargar unidades
            const unidadesData = await unidadesService.getAll();
            setUnidades(unidadesData.map((u: any) => ({ label: u.nombre, value: u.id })));

            const rawCedulas = localStorage.getItem(STORAGE_KEY);
            if (rawCedulas) {
                const parsed = JSON.parse(rawCedulas) as Cedula[];
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setCedulas(
                        parsed.map((item: any) => ({
                            ...item,
                            areaAcademica: Array.isArray(item.areaAcademica) ? item.areaAcademica : typeof item.areaAcademica === 'string' && item.areaAcademica.trim() !== '' ? item.areaAcademica.split(',').map((s: string) => s.trim()) : [],
                            fechaInicio: item.fechaInicio ? new Date(item.fechaInicio) : null,
                            fechaConclusion: item.fechaConclusion ? new Date(item.fechaConclusion) : null
                        }))
                    );
                    return;
                }
            }

            // Si no hay datos válidos, restaurar automáticamente una cédula demo.
            const demo = getCedulaDemoFromExcel();
            const adscripcion = unidadesData.find((u: any) =>
                String(u.nombre || '')
                    .toLowerCase()
                    .includes('servicios informáticos')
            );
            if (adscripcion) demo.areaAdscripcion = adscripcion.id;

            localStorage.setItem(STORAGE_KEY, JSON.stringify([demo]));
            localStorage.setItem(SEEDED_KEY, '1');
            setCedulas([demo]);
        } catch (err) {
            error(formatApiError(err));
        } finally {
            setLoading(false);
        }
    };

    /** Templates para el selector de Unidad (Frontend Design Skill) */
    const unidadOptionTemplate = (option: any) => {
        if (!option) return null;
        return (
            <div className="flex align-items-center gap-3 p-1">
                <div className="flex align-items-center justify-content-center bg-indigo-50 text-indigo-600 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                    <i className="pi pi-building text-xl"></i>
                </div>
                <div>
                    <div className="font-semibold text-900">{option.label}</div>
                    <div className="text-500 text-xs mt-1">Unidad Administrativa / Adscripción</div>
                </div>
            </div>
        );
    };

    const unidadValueTemplate = (option: any, props: any) => {
        if (option) {
            return (
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-building text-indigo-500 text-lg"></i>
                    <span className="font-medium text-900">{option.label}</span>
                </div>
            );
        }
        return <span className="text-500">{props.placeholder}</span>;
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
            funciones: [{ descripcion: '' }],
            nivelEstudios: '',
            gradoAvance: '',
            areaAcademica: [],
            aniosExperiencia: 0,
            competencias: [{ nombre: '', tipo: 'Clave', gradoDominio: 'Medio' }],
            fechaInicio: null,
            fechaConclusion: null,
            numeroPlazas: 1
        });
        setShowSidebar(true);
    };

    const editCedula = (cedula: Cedula) => {
        // Asegurar que areaAdscripcion sea numérica para que coincida con el Dropdown
        const cedulaCopy = {
            ...cedula,
            areaAdscripcion: cedula.areaAdscripcion ? Number(cedula.areaAdscripcion) : null
        };
        setEditingCedula(cedulaCopy);
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
            const newId = editingCedula.id ?? (cedulas.length ? Math.max(...cedulas.map((c) => c.id || 0)) + 1 : 1);
            const payload: Cedula = { ...editingCedula, id: newId };
            const exists = cedulas.some((c) => c.id === newId);
            const nextCedulas = exists ? cedulas.map((c) => (c.id === newId ? payload : c)) : [payload, ...cedulas];
            persistCedulas(nextCedulas);
            success('Cédula guardada exitosamente');
            setShowSidebar(false);
        } catch (err) {
            error(formatApiError(err));
        } finally {
            setSaving(false);
        }
    };

    const deleteCedula = (cedula: Cedula) => {
        confirmDialog({
            message: `\u00bfEstás seguro de eliminar la cédula "${cedula.denominacion}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: () => {
                try {
                    const nextCedulas = cedulas.filter((c) => c.id !== cedula.id);
                    persistCedulas(nextCedulas);
                    success('Cédula eliminada exitosamente');
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
                funciones: [...editingCedula.funciones, { descripcion: '' }]
            });
        }
    };

    const removeFuncion = (index: number) => {
        if (editingCedula) {
            const newFunciones = editingCedula.funciones.filter((_, i) => i !== index);
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

    const updateFuncion = (index: number, field: keyof Funcion, value: string) => {
        if (editingCedula) {
            const newFunciones = [...editingCedula.funciones];
            (newFunciones[index] as any)[field] = value;
            setEditingCedula({ ...editingCedula, funciones: newFunciones });
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
                                <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                    <i className="pi pi-id-card text-blue-600 text-xl"></i>
                                </div>
                                <div>
                                    <h6 className="m-0 text-900 font-semibold">{cedula.denominacion}</h6>
                                    <p className="m-0 text-600 text-sm">Clave: {cedula.clave}</p>
                                </div>
                            </div>

                            <div className="grid mt-3">
                                <div className="col-12 md:col-6">
                                    <div className="text-900 font-semibold text-sm mb-1">Cuerpo</div>
                                    <div className="text-700">{cedula.cuerpo || 'N/A'}</div>
                                </div>
                                <div className="col-12 md:col-6">
                                    <div className="text-900 font-semibold text-sm mb-1">Puesto Superior</div>
                                    <div className="text-700">{cedula.puestoSuperior || 'N/A'}</div>
                                </div>
                                <div className="col-12">
                                    <div className="text-900 font-semibold text-sm mb-1">Misión</div>
                                    <div className="text-700">{cedula.mision ? cedula.mision.substring(0, 150) + '...' : 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 ml-3">
                            <Button icon="pi pi-eye" rounded text severity="info" onClick={() => setViewingCedula(cedula)} tooltip="Ver detalle" />
                            {canUpdate && <Button icon="pi pi-pencil" rounded text severity="success" onClick={() => editCedula(cedula)} tooltip="Editar" />}
                            {canDelete && <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => deleteCedula(cedula)} tooltip="Eliminar" />}
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
                <InputText placeholder="Buscar cédula..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
            </span>
            {canCreate && <Button label="Nueva Cédula" icon="pi pi-plus" onClick={openNew} />}
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
                                <p className="text-600 mt-2 mb-0">Gestión de cédulas con información completa de cargos y puestos</p>
                            </div>
                            <Button label="Regresar a Catálogos" icon="pi pi-arrow-left" outlined onClick={() => router.push('/catalogos')} />
                        </div>
                    </div>
                </div>

                <div className="col-12">
                    <div className="card">
                        <DataView value={cedulas} layout="list" header={header} itemTemplate={itemTemplate} paginator rows={10} emptyMessage="No hay cédulas registradas" loading={loading} />
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
                        <p className="text-600 text-sm mt-1 mb-0">Complete la información de la cédula de cargo o puesto</p>
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
                                        filter
                                        filterPlaceholder="Buscar unidad..."
                                        emptyMessage="No se encontraron unidades."
                                        itemTemplate={unidadOptionTemplate}
                                        valueTemplate={unidadValueTemplate}
                                        panelClassName="p-dropdown-panel-custom"
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
                                    <InputText id="clave" value={editingCedula.clave} onChange={(e) => setEditingCedula({ ...editingCedula, clave: e.target.value })} className="w-full" placeholder="Ej: DRH-01" />
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
                                    <InputText id="fundamentoJuridico" value={editingCedula.fundamentoJuridico} onChange={(e) => setEditingCedula({ ...editingCedula, fundamentoJuridico: e.target.value })} className="w-full" />
                                </div>

                                <div className="field mb-3">
                                    <label htmlFor="mision" className="font-medium text-900">
                                        Misión <span className="text-red-500">*</span>
                                    </label>
                                    <InputTextarea id="mision" value={editingCedula.mision} onChange={(e) => setEditingCedula({ ...editingCedula, mision: e.target.value })} rows={3} className="w-full" />
                                </div>

                                <div className="field mb-3">
                                    <label htmlFor="objetivo" className="font-medium text-900">
                                        Objetivo
                                    </label>
                                    <InputTextarea id="objetivo" value={editingCedula.objetivo} onChange={(e) => setEditingCedula({ ...editingCedula, objetivo: e.target.value })} rows={3} className="w-full" />
                                </div>

                                <div className="field mb-3">
                                    <div className="flex justify-content-between align-items-center mb-2">
                                        <label className="font-medium text-900">Funciones</label>
                                    </div>

                                    {editingCedula.funciones.map((funcion, index) => (
                                        <div key={index} className="p-3 border-1 border-300 border-round mb-2">
                                            <div className="flex justify-content-between align-items-center mb-2">
                                                <span className="font-semibold text-sm">Función {index + 1}</span>
                                                {editingCedula.funciones.length > 1 && <Button icon="pi pi-trash" size="small" text severity="danger" onClick={() => removeFuncion(index)} />}
                                            </div>
                                            <InputTextarea value={funcion.descripcion} onChange={(e) => updateFuncion(index, 'descripcion', e.target.value)} placeholder="Descripción de la función" rows={2} className="w-full" />
                                        </div>
                                    ))}

                                    <div className="flex justify-content-end mt-2">
                                        <Button icon="pi pi-plus" size="small" label="Agregar Función" outlined onClick={addFuncion} className="w-full md:w-auto" />
                                    </div>
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
                                        <InputText id="gradoAvance" value={editingCedula.gradoAvance} onChange={(e) => setEditingCedula({ ...editingCedula, gradoAvance: e.target.value })} className="w-full" placeholder="Ej: Titulado, Pasante" />
                                    </div>

                                    <div className="field mb-3">
                                        <label htmlFor="areaAcademica" className="font-medium text-900">
                                            Área Académica
                                        </label>
                                        <Chips
                                            id="areaAcademica"
                                            value={editingCedula.areaAcademica}
                                            onChange={(e) => setEditingCedula({ ...editingCedula, areaAcademica: e.value as string[] })}
                                            placeholder="Escribe un área y presiona Enter"
                                            className="w-full"
                                        />
                                        <small className="text-500">Puedes capturar múltiples áreas académicas presionando Enter después de cada una.</small>
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

                                <div className="flex justify-content-between align-items-center mb-2">
                                    <label className="font-medium text-900">Competencias</label>
                                </div>

                                {editingCedula.competencias.map((competencia, index) => (
                                    <div key={index} className="p-3 border-1 border-300 border-round mb-2">
                                        <div className="flex justify-content-between align-items-center mb-2">
                                            <span className="font-semibold text-sm">Competencia {index + 1}</span>
                                            {editingCedula.competencias.length > 1 && <Button icon="pi pi-trash" size="small" text severity="danger" onClick={() => removeCompetencia(index)} />}
                                        </div>

                                        <div className="field mb-2">
                                            <label className="text-sm font-medium text-900">Nombre</label>
                                            <InputText value={competencia.nombre} onChange={(e) => updateCompetencia(index, 'nombre', e.target.value)} placeholder="Nombre de la competencia" className="w-full" />
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

                                <div className="flex justify-content-end mt-2">
                                    <Button icon="pi pi-plus" size="small" label="Agregar Competencia" outlined onClick={addCompetencia} className="w-full md:w-auto" />
                                </div>
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
                                            <Calendar id="fechaInicio" value={editingCedula.fechaInicio} onChange={(e) => setEditingCedula({ ...editingCedula, fechaInicio: e.value as Date })} dateFormat="dd/mm/yy" showIcon className="w-full" />
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
                            <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined onClick={() => setShowSidebar(false)} className="flex-1" />
                            <Button label="Guardar" icon="pi pi-check" onClick={saveCedula} loading={saving} className="flex-1" />
                        </div>
                    </div>
                )}
            </Sidebar>

            {/* Dialog de detalle completo de la Cédula */}
            <Dialog
                visible={!!viewingCedula}
                onHide={() => setViewingCedula(null)}
                header={
                    <div className="flex align-items-center gap-3">
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '3rem', height: '3rem' }}>
                            <i className="pi pi-id-card text-blue-600 text-2xl"></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-900 mb-1">{viewingCedula?.denominacion}</h3>
                            <div className="flex align-items-center gap-2">
                                <span className="text-500 text-sm font-semibold uppercase tracking-wide">Clave:</span>
                                <Tag value={viewingCedula?.clave} className="bg-pink-100 text-pink-700 px-2 py-0 border-round font-medium text-sm" style={{ padding: '0.15rem 0.5rem' }} />
                            </div>
                        </div>
                    </div>
                }
                style={{ width: '85vw', maxWidth: '960px' }}
                modal
                dismissableMask
                className="cedula-detail-dialog"
            >
                {viewingCedula && (
                    <div className="cedula-detail-content">
                        {/* === IDENTIFICACIÓN === */}
                        <div className="mb-4">
                            <div className="flex align-items-center gap-2 mb-3">
                                <i className="pi pi-id-card text-primary"></i>
                                <h5 className="m-0 text-primary">Identificación del Cargo o Puesto</h5>
                            </div>
                            <div className="surface-50 border-round p-3">
                                <div className="grid">
                                    <div className="col-12 md:col-6">
                                        <div className="text-900 font-semibold text-sm mb-1">Denominación</div>
                                        <div className="text-700">{viewingCedula.denominacion}</div>
                                    </div>
                                    <div className="col-12 md:col-6">
                                        <div className="text-900 font-semibold text-sm mb-1">Área / Adscripción</div>
                                        <div className="text-700">{getUnidadNombre(viewingCedula.areaAdscripcion)}</div>
                                    </div>
                                    <div className="col-12 md:col-6">
                                        <div className="text-900 font-semibold text-sm mb-1">Cuerpo</div>
                                        <div className="text-700">{viewingCedula.cuerpo || 'N/A'}</div>
                                    </div>
                                    <div className="col-12 md:col-6">
                                        <div className="text-900 font-semibold text-sm mb-1">Puesto Superior</div>
                                        <div className="text-700">{viewingCedula.puestoSuperior || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        {/* === DESCRIPCIÓN === */}
                        <div className="mb-4">
                            <div className="flex align-items-center gap-2 mb-3">
                                <i className="pi pi-file-edit text-primary"></i>
                                <h5 className="m-0 text-primary">Descripción</h5>
                            </div>
                            <div className="surface-50 border-round p-3">
                                <div className="mb-3">
                                    <div className="text-900 font-semibold text-sm mb-1">Fundamento Jurídico</div>
                                    <div className="text-700">{viewingCedula.fundamentoJuridico || 'N/A'}</div>
                                </div>
                                <div className="mb-3">
                                    <div className="text-900 font-semibold text-sm mb-1">Misión</div>
                                    <div className="text-700 line-height-3">{viewingCedula.mision || 'N/A'}</div>
                                </div>
                                <div className="mb-3">
                                    <div className="text-900 font-semibold text-sm mb-1">Objetivo</div>
                                    <div className="text-700 line-height-3">{viewingCedula.objetivo || 'N/A'}</div>
                                </div>

                                {/* Funciones */}
                                <div>
                                    <div className="text-900 font-semibold text-sm mb-2">Funciones ({viewingCedula.funciones.length})</div>
                                    <div className="flex flex-column gap-2">
                                        {viewingCedula.funciones.map((f, i) => (
                                            <div key={i} className="flex align-items-start gap-3 p-3 surface-100 border-round">
                                                <div className="flex align-items-center justify-content-center bg-white border-round text-700 font-bold shadow-1" style={{ width: '1.5rem', height: '1.5rem', flexShrink: 0, fontSize: '0.8rem' }}>
                                                    {i + 1}
                                                </div>
                                                <div className="text-700 text-sm line-height-3">{f.descripcion}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        {/* === PERFIL === */}
                        <div className="mb-4">
                            <div className="flex align-items-center gap-2 mb-3">
                                <i className="pi pi-user text-primary"></i>
                                <h5 className="m-0 text-primary">Perfil</h5>
                            </div>
                            <div className="surface-50 border-round p-3">
                                <h6 className="text-900 font-semibold text-sm mb-3 mt-0">Requisitos Académicos</h6>
                                <div className="grid mb-4">
                                    <div className="col-12 md:col-4">
                                        <div className="text-900 font-semibold text-sm mb-1">Nivel de Estudios</div>
                                        <div className="text-700">{viewingCedula.nivelEstudios || 'N/A'}</div>
                                    </div>
                                    <div className="col-12 md:col-4">
                                        <div className="text-900 font-semibold text-sm mb-1">Grado de Avance</div>
                                        <div className="text-700">{viewingCedula.gradoAvance || 'N/A'}</div>
                                    </div>
                                    <div className="col-12 md:col-4">
                                        <div className="text-900 font-semibold text-sm mb-1">Área Académica</div>
                                        <div className="flex flex-wrap gap-2">
                                            {viewingCedula.areaAcademica && viewingCedula.areaAcademica.length > 0 ? (
                                                viewingCedula.areaAcademica.map((area, idx) => (
                                                    <span key={idx} className="bg-white border-1 surface-border text-700 px-2 py-1 border-round text-xs font-medium">
                                                        {area}
                                                    </span>
                                                ))
                                            ) : (
                                                <div className="text-700">N/A</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <h6 className="text-900 font-semibold text-sm mb-2">Experiencia Laboral</h6>
                                <div>
                                    <div className="text-900 font-semibold text-sm mb-1">Años de Experiencia</div>
                                    <div className="text-700">{viewingCedula.aniosExperiencia} año(s)</div>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        {/* === COMPETENCIAS === */}
                        <div className="mb-4">
                            <div className="flex align-items-center gap-2 mb-3">
                                <i className="pi pi-star text-primary"></i>
                                <h5 className="m-0 text-primary">Competencias ({viewingCedula.competencias.length})</h5>
                            </div>
                            <div className="surface-50 border-round p-3">
                                {/* Competencias Clave */}
                                {viewingCedula.competencias.filter((c) => c.tipo === 'Clave').length > 0 && (
                                    <div className="mb-3">
                                        <h6 className="text-700 font-semibold text-sm mb-2 mt-0">Competencias Clave</h6>
                                        <div className="flex flex-wrap gap-2">
                                            {viewingCedula.competencias
                                                .filter((c) => c.tipo === 'Clave')
                                                .map((c, i) => (
                                                    <div key={i} className="flex align-items-center gap-2 p-2 surface-100 border-round">
                                                        <span className="text-900 text-sm font-medium">{c.nombre}</span>
                                                        <Tag value={c.gradoDominio} severity={c.gradoDominio === 'Alto' ? 'danger' : c.gradoDominio === 'Medio' ? 'warning' : 'success'} className="text-xs" />
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                                {/* Competencias Directivas */}
                                {viewingCedula.competencias.filter((c) => c.tipo === 'Directivas').length > 0 && (
                                    <div>
                                        <h6 className="text-700 font-semibold text-sm mb-2">Competencias Directivas</h6>
                                        <div className="flex flex-wrap gap-2">
                                            {viewingCedula.competencias
                                                .filter((c) => c.tipo === 'Directivas')
                                                .map((c, i) => (
                                                    <div key={i} className="flex align-items-center gap-2 p-2 surface-100 border-round">
                                                        <span className="text-900 text-sm font-medium">{c.nombre}</span>
                                                        <Tag value={c.gradoDominio} severity={c.gradoDominio === 'Alto' ? 'danger' : c.gradoDominio === 'Medio' ? 'warning' : 'success'} className="text-xs" />
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Divider />

                        {/* === PERIODO Y PLAZAS === */}
                        <div>
                            <div className="flex align-items-center gap-2 mb-3">
                                <i className="pi pi-calendar text-primary"></i>
                                <h5 className="m-0 text-primary">Periodo de Contratación y Plazas</h5>
                            </div>
                            <div className="surface-50 border-round p-3">
                                <div className="grid">
                                    <div className="col-12 md:col-4">
                                        <div className="text-500 text-sm mb-1">Fecha de Inicio</div>
                                        <div className="text-900">{viewingCedula.fechaInicio ? new Date(viewingCedula.fechaInicio).toLocaleDateString('es-MX') : 'N/A'}</div>
                                    </div>
                                    <div className="col-12 md:col-4">
                                        <div className="text-500 text-sm mb-1">Fecha de Conclusión</div>
                                        <div className="text-900">{viewingCedula.fechaConclusion ? new Date(viewingCedula.fechaConclusion).toLocaleDateString('es-MX') : 'N/A'}</div>
                                    </div>
                                    <div className="col-12 md:col-4">
                                        <div className="text-500 text-sm mb-1">Número de Plazas</div>
                                        <Tag value={String(viewingCedula.numeroPlazas)} severity="info" className="text-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default CedulaCargosPage;
