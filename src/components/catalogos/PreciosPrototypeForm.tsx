'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { BreadCrumb } from 'primereact/breadcrumb';
import { useNotification } from '@/layout/context/notificationContext';
import { PreciosService } from '@/src/services/precios.service';
import { CategoriaPreciosService } from '@/src/services/categoriaPrecios.service';
import { CombustiblesService } from '@/src/services/combustibles.service';
import type { Precio, CategoriaPrecio } from '@/types/catalogos';

// ─── Tipos locales ─────────────────────────────────────────────────────────────

type FormValues = {
    id: number | null;
    categoriaPrecioId: number | null;
    nombre: string;
    unidadMedida: string;
    subtipoCombustible: 'Magna' | 'Premium' | 'Diesel' | '';
    precio: number | null;
};

type Props = {
    mode: 'master' | 'combustibles';
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const COMBUSTIBLE_NOMBRE = 'Combustible';

const SUBTIPO_COMBUSTIBLE_OPTIONS = [
    { label: 'Magna', value: 'Magna' },
    { label: 'Premium', value: 'Premium' },
    { label: 'Diésel', value: 'Diesel' }
];

const makeInitialForm = (mode?: 'master' | 'combustibles'): FormValues => ({
    id: null,
    categoriaPrecioId: null,
    nombre: '',
    unidadMedida: mode === 'combustibles' ? 'Litro' : '',
    subtipoCombustible: '',
    precio: null
});

const formatFecha = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PreciosPrototypeForm({ mode }: Props) {
    const router = useRouter();
    const { success, error } = useNotification();

    const [categorias, setCategorias] = useState<CategoriaPrecio[]>([]);
    const [items, setItems] = useState<Precio[]>([]);
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState<FormValues>(() => makeInitialForm(mode));
    const [showDialog, setShowDialog] = useState(false);

    const [showAddCategoria, setShowAddCategoria] = useState(false);
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [editingCategoriaId, setEditingCategoriaId] = useState<number | null>(null);
    const [editingCategoriaNombre, setEditingCategoriaNombre] = useState('');
    const [saving, setSaving] = useState(false);
    const [filterCategoria, setFilterCategoria] = useState<number | null>(null);

    const isCombustiblesView = mode === 'combustibles';

    // ─── Breadcrumb ────────────────────────────────────────────────────────────

    const breadcrumbItems = [
        { label: 'Inicio', command: () => router.push('/') },
        { label: 'Catálogos', command: () => router.push('/catalogos'), className: 'text-primary font-medium' },
        { label: 'Recursos Humanos, Presupuestarios y Financieros' },
        { label: isCombustiblesView ? 'Combustibles' : 'Precios', className: 'font-bold text-900' }
    ];
    const breadcrumbHome = { icon: 'pi pi-home', command: () => router.push('/') };

    // ─── Carga inicial desde la API ────────────────────────────────────────────

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const categoriasData = await CategoriaPreciosService.getAll();
            const preciosData = await PreciosService.getAll();

            setCategorias(categoriasData);
            setItems(preciosData);
        } catch (e: any) {
            error(e?.response?.data?.message ?? 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    }, [error]);

    useEffect(() => {
        setForm(makeInitialForm(mode));
    }, [mode]);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Categoría combustible (reservada) ─────────────────────────────────────

    const categoriaCombustibleId = useMemo(() => categorias.find((c) => c.nombre === COMBUSTIBLE_NOMBRE)?.id ?? null, [categorias]);

    // ─── Opciones para dropdowns ───────────────────────────────────────────────

    const categoriaOptions = useMemo(() => {
        if (isCombustiblesView) return [];
        return categorias.filter((c) => c.nombre !== COMBUSTIBLE_NOMBRE).map((c) => ({ label: c.nombre, value: c.id }));
    }, [isCombustiblesView, categorias]);

    // ─── Filtrado de tabla ─────────────────────────────────────────────────────

    const filteredItems = useMemo(() => {
        let result = items;
        if (isCombustiblesView) {
            result = result.filter((i) => i.categoriaPrecioId === categoriaCombustibleId);
        } else {
            result = result.filter((i) => i.categoriaPrecioId !== categoriaCombustibleId);
            if (filterCategoria) {
                result = result.filter((i) => i.categoriaPrecioId === filterCategoria);
            }
        }
        return result;
    }, [isCombustiblesView, items, categoriaCombustibleId, filterCategoria]);

    const getCategoriaNombre = useCallback((id: number) => categorias.find((c) => c.id === id)?.nombre ?? '—', [categorias]);

    // ─── Agregar categoría ──────────────────────────────────────────────────────

    const handleAgregarCategoria = useCallback(async () => {
        const nombre = nuevaCategoria.trim();
        if (!nombre) {
            error('Escribe un nombre para la categoría');
            return;
        }
        try {
            const nueva = await CategoriaPreciosService.create(nombre);
            setCategorias((prev) => [...prev, nueva]);
            setForm((prev) => ({ ...prev, categoriaPrecioId: nueva.id }));
            setNuevaCategoria('');
            setShowAddCategoria(false);
            success(`Categoría "${nueva.nombre}" agregada`);
        } catch (e: any) {
            const errData = e?.response?.data;
            const msg = errData?.errors ? Object.values(errData.errors).flat().join('\n') : errData?.message ?? 'Error al crear la categoría';
            error(msg);
        }
    }, [nuevaCategoria, error, success]);

    // ─── Actualizar categoría ───────────────────────────────────────────────────

    const handleUpdateCategoria = useCallback(async () => {
        if (!editingCategoriaId) return;
        const nombre = editingCategoriaNombre.trim();
        if (!nombre) {
            error('Escribe un nombre válido para la categoría');
            setEditingCategoriaId(null);
            return;
        }

        try {
            const actualizada = await CategoriaPreciosService.update(editingCategoriaId, nombre);
            setCategorias((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)));
            setEditingCategoriaId(null);
            success(`Categoría renombrada a "${actualizada.nombre}"`);
        } catch (e: any) {
            const errData = e?.response?.data;
            const msg = errData?.errors ? Object.values(errData.errors).flat().join('\n') : errData?.message ?? 'Error al actualizar la categoría';
            error(msg);
        }
    }, [editingCategoriaId, editingCategoriaNombre, error, success]);

    // ─── Eliminar categoría ─────────────────────────────────────────────────────

    const handleDeleteCategoria = useCallback(
        (categoria: CategoriaPrecio) => {
            confirmDialog({
                message: `¿Eliminar la categoría "${categoria.nombre}"? Esta acción no se puede deshacer.`,
                header: 'Confirmar eliminación de categoría',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Eliminar',
                rejectLabel: 'Cancelar',
                acceptClassName: 'p-button-danger',
                accept: async () => {
                    try {
                        await CategoriaPreciosService.delete(categoria.id);
                        setCategorias((prev) => prev.filter((c) => c.id !== categoria.id));
                        success(`Categoría "${categoria.nombre}" eliminada`);
                    } catch (e: any) {
                        const errData = e?.response?.data;
                        const msg = errData?.errors ? Object.values(errData.errors).flat().join('\n') : errData?.message ?? 'Error al eliminar la categoría';
                        error(msg);
                    }
                }
            });
        },
        [success, error]
    );

    // ─── Exportar CSV ───────────────────────────────────────────────────────────

    const handleExportCSV = useCallback(() => {
        if (filteredItems.length === 0) {
            error('No hay registros para exportar');
            return;
        }
        const headers = isCombustiblesView ? ['Nombre', 'Subtipo', 'Unidad', 'Precio (MXN)', 'Última actualización'] : ['Nombre', 'Categoría', 'Unidad', 'Precio (MXN)', 'Última actualización'];
        const rows = filteredItems.map((item) => [item.nombre, isCombustiblesView ? item.subtipoCombustible || '' : getCategoriaNombre(item.categoriaPrecioId), item.unidadMedida, item.precio?.toString() ?? '', formatFecha(item.updatedAt)]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `${isCombustiblesView ? 'combustibles' : 'precios'}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        success('Archivo exportado');
    }, [filteredItems, isCombustiblesView, getCategoriaNombre, error, success]);

    // ─── CRUD precios ──────────────────────────────────────────────────────────

    const closeDialog = useCallback(() => {
        setShowDialog(false);
        setForm(makeInitialForm(mode));
        setShowAddCategoria(false);
        setNuevaCategoria('');
    }, [mode]);

    const validate = useCallback((): string | null => {
        if (!form.nombre.trim()) return 'El nombre es obligatorio';
        if (!form.unidadMedida.trim()) return 'La unidad de medida es obligatoria';
        if (isCombustiblesView) {
            if (!form.subtipoCombustible) return 'Selecciona el tipo de combustible';
        } else {
            if (!form.categoriaPrecioId) return 'Selecciona una categoría';
        }
        if (!form.precio || form.precio <= 0) return 'El precio debe ser mayor a 0';
        return null;
    }, [form, isCombustiblesView]);

    const handleSave = useCallback(async () => {
        const err = validate();
        if (err) {
            error(err);
            return;
        }

        const catId = isCombustiblesView ? categoriaCombustibleId! : form.categoriaPrecioId!;

        setSaving(true);
        try {
            if (form.id) {
                // Actualizar
                let updated: Precio;
                if (isCombustiblesView) {
                    updated = await CombustiblesService.update(form.id, {
                        nombre: form.nombre.trim(),
                        unidadMedida: form.unidadMedida.trim(),
                        precio: form.precio!,
                        subtipoCombustible: form.subtipoCombustible!
                    });
                } else {
                    updated = await PreciosService.update(form.id, {
                        categoriaPrecioId: catId,
                        nombre: form.nombre.trim(),
                        unidadMedida: form.unidadMedida.trim(),
                        precio: form.precio!,
                        subtipoCombustible: null
                    });
                }
                setItems((prev) => prev.map((i) => (i.id === form.id ? updated : i)));
                success('Registro actualizado');
            } else {
                // Crear
                let nuevo: Precio;
                if (isCombustiblesView) {
                    nuevo = await CombustiblesService.create({
                        nombre: form.nombre.trim(),
                        unidadMedida: form.unidadMedida.trim(),
                        precio: form.precio!,
                        subtipoCombustible: form.subtipoCombustible!
                    });
                } else {
                    nuevo = await PreciosService.create({
                        categoriaPrecioId: catId,
                        nombre: form.nombre.trim(),
                        unidadMedida: form.unidadMedida.trim(),
                        precio: form.precio!,
                        subtipoCombustible: null
                    });
                }
                setItems((prev) => [nuevo, ...prev]);
                success('Registro creado');
            }
            closeDialog();
        } catch (e: any) {
            const errData = e?.response?.data;
            const msg = errData?.errors ? Object.values(errData.errors).flat().join('\n') : errData?.message ?? 'Error al guardar el precio';
            error(msg);
        } finally {
            setSaving(false);
        }
    }, [validate, form, isCombustiblesView, categoriaCombustibleId, success, error, closeDialog]);

    const handleEdit = useCallback((item: Precio) => {
        setForm({
            id: item.id,
            categoriaPrecioId: item.categoriaPrecioId,
            nombre: item.nombre,
            unidadMedida: item.unidadMedida,
            subtipoCombustible: (item.subtipoCombustible as any) ?? '',
            precio: item.precio
        });
        setShowAddCategoria(false);
        setNuevaCategoria('');
        setShowDialog(true);
    }, []);

    const handleDelete = useCallback(
        (item: Precio) => {
            confirmDialog({
                message: `¿Eliminar "${item.nombre}"?`,
                header: 'Confirmar eliminación',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Eliminar',
                rejectLabel: 'Cancelar',
                acceptClassName: 'p-button-danger',
                accept: async () => {
                    try {
                        await PreciosService.delete(item.id);
                        setItems((prev) => prev.filter((r) => r.id !== item.id));
                        success('Precio eliminado');
                    } catch (e: any) {
                        const errData = e?.response?.data;
                        const msg = errData?.errors ? Object.values(errData.errors).flat().join('\n') : errData?.message ?? 'Error al eliminar el precio';
                        error(msg);
                    }
                }
            });
        },
        [success, error]
    );

    const openNew = useCallback(() => {
        setForm({
            ...makeInitialForm(mode),
            categoriaPrecioId: isCombustiblesView ? categoriaCombustibleId : null
        });
        setShowAddCategoria(false);
        setNuevaCategoria('');
        setShowDialog(true);
    }, [mode, isCombustiblesView, categoriaCombustibleId]);

    // ─── Templates de columnas ─────────────────────────────────────────────────

    const categoriaBodyTemplate = (row: Precio) => <Tag value={getCategoriaNombre(row.categoriaPrecioId)} severity="info" />;
    const subtipoCombustibleBody = (row: Precio) => (row.subtipoCombustible ? <Tag value={row.subtipoCombustible} severity="warning" /> : <span>—</span>);
    const precioBody = (row: Precio) => row.precio?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) ?? '—';
    const unidadBody = (row: Precio) => <span className="text-sm">{row.unidadMedida}</span>;
    const fechaBody = (row: Precio) => <span className="text-sm text-600">{formatFecha(row.updatedAt)}</span>;

    const actionsBody = (row: Precio) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" size="small" severity="success" rounded onClick={() => handleEdit(row)} tooltip="Editar" />
            <Button icon="pi pi-trash" size="small" severity="danger" rounded onClick={() => handleDelete(row)} tooltip="Eliminar" />
        </div>
    );

    // ─── Render ────────────────────────────────────────────────────────────────

    const pageTitle = isCombustiblesView ? 'Combustibles' : 'Precios';
    const pageDescription = isCombustiblesView ? 'Precios de referencia por tipo de combustible (MXN)' : 'Precios y tarifas de referencia institucionales (MXN)';
    const pageIcon = isCombustiblesView ? 'pi pi-car' : 'pi pi-dollar';

    return (
        <div className="grid">
            <div className="col-12">
                <ConfirmDialog />

                {/* ── Breadcrumb ── */}
                <BreadCrumb model={breadcrumbItems} home={breadcrumbHome} className="mb-4" />

                {/* ── Header ── */}
                <div className="flex align-items-center justify-content-between mb-4">
                    <div className="flex align-items-center">
                        <i className={`${pageIcon} text-3xl text-primary mr-3`}></i>
                        <div>
                            <h2 className="text-2xl font-bold text-900 m-0">{pageTitle}</h2>
                            <p className="text-600 m-0">{pageDescription}</p>
                        </div>
                    </div>
                    <Button label="Regresar a catálogos" icon="pi pi-arrow-left" className="p-button-outlined" onClick={() => router.push('/catalogos')} />
                </div>

                {/* ── Toolbar ── */}
                <div className="card mb-3">
                    <div className="flex justify-content-between align-items-center">
                        <div className="flex gap-2 align-items-center">
                            <Button label="Nuevo" icon="pi pi-plus" onClick={openNew} />
                            {!isCombustiblesView && (
                                <Dropdown value={filterCategoria} options={categoriaOptions} onChange={(e) => setFilterCategoria(e.value)} placeholder="Filtrar por categoría" showClear className="ml-2" style={{ minWidth: '15rem' }} />
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button label="Importar" icon="pi pi-upload" severity="secondary" tooltip="Importar desde archivo (disponible en la próxima fase)" tooltipOptions={{ position: 'top' }} disabled />
                            <Button label="Exportar" icon="pi pi-download" severity="help" tooltip="Exportar a CSV" tooltipOptions={{ position: 'top' }} onClick={handleExportCSV} />
                            <Button icon="pi pi-refresh" severity="secondary" onClick={loadData} tooltip="Actualizar" tooltipOptions={{ position: 'top' }} loading={loading} />
                        </div>
                    </div>
                </div>

                {/* ── Gestión de categorías (solo vista master) ── */}
                {!isCombustiblesView && (
                    <div className="card mb-3">
                        <div className="flex align-items-center justify-content-between mb-3">
                            <span className="font-medium text-700">
                                <i className="pi pi-tags mr-2"></i>Categorías de precio
                            </span>
                            <Button label="Agregar categoría" icon="pi pi-plus" size="small" severity="secondary" outlined onClick={() => setShowAddCategoria(!showAddCategoria)} />
                        </div>
                        <div className="flex flex-wrap gap-2 align-items-center">
                            {categorias
                                .filter((c) => c.nombre !== COMBUSTIBLE_NOMBRE)
                                .map((categoria) => {
                                    const count = items.filter((i) => i.categoriaPrecioId === categoria.id).length;
                                    return (
                                        <div key={categoria.id} className="flex align-items-center gap-1 surface-100 border-round px-3 py-2">
                                            {editingCategoriaId === categoria.id ? (
                                                <InputText
                                                    value={editingCategoriaNombre}
                                                    onChange={(e) => setEditingCategoriaNombre(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateCategoria();
                                                        if (e.key === 'Escape') setEditingCategoriaId(null);
                                                    }}
                                                    onBlur={handleUpdateCategoria}
                                                    autoFocus
                                                    className="p-inputtext-sm"
                                                    style={{ width: '150px' }}
                                                />
                                            ) : (
                                                <span
                                                    className="text-sm font-medium cursor-pointer"
                                                    onDoubleClick={() => {
                                                        setEditingCategoriaId(categoria.id);
                                                        setEditingCategoriaNombre(categoria.nombre);
                                                    }}
                                                    title="Doble clic para editar"
                                                >
                                                    {categoria.nombre}
                                                </span>
                                            )}
                                            {count > 0 && <Tag value={count.toString()} severity="info" className="ml-1" style={{ fontSize: '0.7rem' }} />}
                                            <Button
                                                icon="pi pi-times"
                                                text
                                                size="small"
                                                severity="danger"
                                                onClick={() => handleDeleteCategoria(categoria)}
                                                tooltip={count > 0 ? `Tiene ${count} precio(s) asociado(s)` : 'Eliminar categoría'}
                                                tooltipOptions={{ position: 'top' }}
                                                className="ml-1"
                                                style={{ width: '1.5rem', height: '1.5rem' }}
                                            />
                                        </div>
                                    );
                                })}
                            {categorias.filter((c) => c.nombre !== COMBUSTIBLE_NOMBRE).length === 0 && <span className="text-sm text-500">Sin categorías creadas. Agrega una para clasificar tus precios.</span>}
                        </div>
                        {showAddCategoria && (
                            <div className="mt-3 p-3 surface-50 border-round border-1 border-200">
                                <label className="block text-sm font-medium mb-2 text-700">Nombre de la nueva categoría</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <InputText
                                        value={nuevaCategoria}
                                        onChange={(e) => setNuevaCategoria(e.target.value)}
                                        placeholder="Ej. Servicios, Materiales..."
                                        style={{ flex: '1 1 auto', minWidth: '200px' }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAgregarCategoria()}
                                        autoFocus
                                    />
                                    <Button label="Agregar" icon="pi pi-check" size="small" onClick={handleAgregarCategoria} style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }} />
                                    <Button
                                        icon="pi pi-times"
                                        size="small"
                                        severity="secondary"
                                        text
                                        rounded
                                        onClick={() => setShowAddCategoria(false)}
                                        tooltip="Cancelar"
                                        tooltipOptions={{ position: 'top' }}
                                        style={{ flex: '0 0 auto', width: '2rem', height: '2rem' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── DataTable ── */}
                <div className="card">
                    <DataTable
                        value={filteredItems}
                        dataKey="id"
                        paginator
                        rows={10}
                        loading={loading}
                        emptyMessage="No se encontraron precios registrados. Haz clic en «Nuevo» para agregar uno."
                        sortField="updatedAt"
                        sortOrder={-1}
                        rowsPerPageOptions={[5, 10, 25]}
                        responsiveLayout="scroll"
                    >
                        <Column field="nombre" header="Nombre" sortable style={{ minWidth: '14rem' }} />
                        {!isCombustiblesView && <Column header="Categoría" body={categoriaBodyTemplate} style={{ minWidth: '10rem' }} />}
                        {isCombustiblesView && <Column header="Tipo de Combustible" body={subtipoCombustibleBody} style={{ minWidth: '12rem' }} />}
                        <Column header="Unidad" body={unidadBody} style={{ minWidth: '8rem' }} />
                        <Column header="Precio (MXN)" body={precioBody} style={{ minWidth: '10rem' }} />
                        <Column header="Última actualización" body={fechaBody} style={{ minWidth: '12rem' }} />
                        <Column body={actionsBody} headerStyle={{ width: '8rem' }} />
                    </DataTable>
                </div>

                {/* ── Dialog: Crear / Editar ── */}
                <Dialog visible={showDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header={form.id ? 'Editar precio' : 'Nuevo precio'} modal onHide={closeDialog}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSave();
                        }}
                        className="flex flex-column gap-4 pt-2"
                    >
                        {/* Nombre */}
                        <div className="field">
                            <label htmlFor="nombre" className="block font-medium mb-2">
                                Nombre <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="nombre"
                                value={form.nombre}
                                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                                placeholder={isCombustiblesView ? 'Ej. Gasolina PEMEX Tuxtla' : 'Ej. Servicio de fotocopiado'}
                                className="w-full"
                                autoFocus
                            />
                        </div>

                        {/* Unidad de medida */}
                        <div className="field">
                            <label htmlFor="unidad" className="block font-medium mb-2">
                                Unidad de medida <span className="text-red-500">*</span>
                            </label>
                            <InputText id="unidad" value={form.unidadMedida} onChange={(e) => setForm((p) => ({ ...p, unidadMedida: e.target.value }))} placeholder={isCombustiblesView ? 'Litro' : 'Ej. Pza, Caja, Hora...'} className="w-full" />
                        </div>

                        {/* Categoría (master) o fija (combustible) */}
                        {!isCombustiblesView ? (
                            <div className="field">
                                <label htmlFor="categoria" className="block font-medium mb-2">
                                    Categoría <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="categoria"
                                    value={form.categoriaPrecioId}
                                    options={categoriaOptions}
                                    onChange={(e) => setForm((p) => ({ ...p, categoriaPrecioId: e.value }))}
                                    placeholder="Seleccionar categoría..."
                                    className="w-full"
                                    emptyMessage="Sin categorías. Crea una desde la sección arriba."
                                />
                            </div>
                        ) : (
                            <div className="field">
                                <label className="block font-medium mb-2">Categoría</label>
                                <InputText value={COMBUSTIBLE_NOMBRE} className="w-full" disabled />
                                <small className="block mt-1 text-500">Asignada automáticamente por el sistema.</small>
                            </div>
                        )}

                        {/* Subtipo combustible */}
                        {isCombustiblesView && (
                            <div className="field">
                                <label htmlFor="subtipo" className="block font-medium mb-2">
                                    Tipo de Combustible <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="subtipo"
                                    value={form.subtipoCombustible}
                                    options={SUBTIPO_COMBUSTIBLE_OPTIONS}
                                    onChange={(e) => setForm((p) => ({ ...p, subtipoCombustible: e.value }))}
                                    placeholder="Seleccionar tipo de combustible..."
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Precio */}
                        <div className="field">
                            <label htmlFor="precio" className="block font-medium mb-2">
                                {isCombustiblesView ? 'Precio por litro (MXN)' : 'Precio (MXN)'} <span className="text-red-500">*</span>
                            </label>
                            <InputNumber id="precio" value={form.precio} onValueChange={(e) => setForm((p) => ({ ...p, precio: e.value ?? null }))} mode="currency" currency="MXN" locale="es-MX" min={0} placeholder="0.00" className="w-full" />
                        </div>

                        {/* Footer */}
                        <div className="flex justify-content-end gap-2 pt-4 border-top-1 surface-border">
                            <Button type="button" label="Cancelar" icon="pi pi-times" severity="secondary" outlined onClick={closeDialog} disabled={saving} />
                            <Button type="submit" label={form.id ? 'Actualizar' : 'Guardar'} icon="pi pi-check" loading={saving} disabled={saving} />
                        </div>
                    </form>
                </Dialog>
            </div>
        </div>
    );
}
