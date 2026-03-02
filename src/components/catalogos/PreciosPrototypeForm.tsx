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

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CategoriaPrecio = {
    id: number;
    nombre: string;
};

type StoredPrecio = {
    id: number;
    categoria_id: number;
    nombre: string;
    subtipo_combustible?: 'Magna' | 'Premium' | 'Diesel' | '';
    precio: number;
    created_at: string;
    updated_at: string;
};

type FormValues = {
    id: number | null;
    categoria_id: number | null;
    nombre: string;
    subtipo_combustible: 'Magna' | 'Premium' | 'Diesel' | '';
    precio: number | null;
};

type Props = {
    mode: 'master' | 'combustibles';
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY_PRECIOS = 'sipoa_precios_v2';
const STORAGE_KEY_CATEGORIAS = 'sipoa_categoria_precios_v2';
const COMBUSTIBLE_NOMBRE = 'Combustible';

const SUBTIPO_COMBUSTIBLE_OPTIONS = [
    { label: 'Magna', value: 'Magna' },
    { label: 'Premium', value: 'Premium' },
    { label: 'Diésel', value: 'Diesel' }
];

const makeInitialForm = (): FormValues => ({
    id: null,
    categoria_id: null,
    nombre: '',
    subtipo_combustible: '',
    precio: null
});

const normalizarNombre = (nombre: string) => {
    const t = nombre.trim();
    if (!t) return '';
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
};

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

    // Estado global
    const [categorias, setCategorias] = useState<CategoriaPrecio[]>([]);
    const [items, setItems] = useState<StoredPrecio[]>([]);

    // Estado del formulario
    const [form, setForm] = useState<FormValues>(makeInitialForm);
    const [showDialog, setShowDialog] = useState(false);

    // Agregar categoría nueva
    const [showAddCategoria, setShowAddCategoria] = useState(false);
    const [nuevaCategoria, setNuevaCategoria] = useState('');

    // Filtro por categoría en tabla
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

    // ─── Persistencia ──────────────────────────────────────────────────────────

    const loadFromStorage = () => {
        try {
            // Migración retrocompatible: si no hay categorías, intentar cargar los tipos antiguos
            let rawCat = localStorage.getItem(STORAGE_KEY_CATEGORIAS);
            if (!rawCat) {
                rawCat = localStorage.getItem('sipoa_tipo_precios_v2');
                if (rawCat) {
                    localStorage.setItem(STORAGE_KEY_CATEGORIAS, rawCat);
                }
            }

            const rawItems = localStorage.getItem(STORAGE_KEY_PRECIOS);
            if (!rawCat) {
                const initial = [{ id: 999999, nombre: COMBUSTIBLE_NOMBRE }];
                setCategorias(initial);
                localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(initial));
            } else {
                let loadedCategorias = JSON.parse(rawCat) as CategoriaPrecio[];
                if (!loadedCategorias.some((c) => c.nombre === COMBUSTIBLE_NOMBRE)) {
                    loadedCategorias = [{ id: 999999, nombre: COMBUSTIBLE_NOMBRE }, ...loadedCategorias];
                    localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(loadedCategorias));
                }
                setCategorias(loadedCategorias);
            }

            if (!rawItems) {
                setItems([]);
            } else {
                // Backward compatibility migraciones
                const parsed = JSON.parse(rawItems);
                let migrated = false;
                const loadedItems = parsed.map((item: any) => {
                    let newItem = { ...item };
                    // 1. Migrar tipo_precio_id -> categoria_id
                    if (newItem.tipo_precio_id !== undefined && newItem.categoria_id === undefined) {
                        newItem.categoria_id = newItem.tipo_precio_id;
                        delete newItem.tipo_precio_id;
                        migrated = true;
                    }
                    // 2. Migrar subtipo -> subtipo_combustible
                    if (newItem.subtipo !== undefined && newItem.subtipo_combustible === undefined) {
                        newItem.subtipo_combustible = newItem.subtipo;
                        delete newItem.subtipo;
                        migrated = true;
                    }
                    return newItem;
                });
                setItems(loadedItems);
                if (migrated) {
                    localStorage.setItem(STORAGE_KEY_PRECIOS, JSON.stringify(loadedItems));
                }
            }
        } catch {
            const initial = [{ id: 999999, nombre: COMBUSTIBLE_NOMBRE }];
            setCategorias(initial);
            setItems([]);
        }
    };

    useEffect(() => {
        loadFromStorage();
    }, []);

    const persistCategorias = (next: CategoriaPrecio[]) => {
        setCategorias(next);
        localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(next));
    };

    const persistItems = (next: StoredPrecio[]) => {
        setItems(next);
        localStorage.setItem(STORAGE_KEY_PRECIOS, JSON.stringify(next));
    };

    // ─── Categoría Combustible (reservada) ──────────────────────────────────────────

    const categoriasConCombustible = categorias;

    const categoriaCombustibleId = useMemo(() => categoriasConCombustible.find((c) => c.nombre === COMBUSTIBLE_NOMBRE)?.id ?? null, [categoriasConCombustible]);

    // ─── Opciones para el dropdown de categorías ────────────────────────────────────

    const categoriaOptions = useMemo(() => {
        if (isCombustiblesView) return [];
        return categoriasConCombustible.filter((c) => c.nombre !== COMBUSTIBLE_NOMBRE).map((c) => ({ label: c.nombre, value: c.id }));
    }, [isCombustiblesView, categoriasConCombustible]);

    // ─── Filtrado de tabla ─────────────────────────────────────────────────────

    const filteredItems = useMemo(() => {
        let result = items;
        if (isCombustiblesView) {
            result = result.filter((i) => i.categoria_id === categoriaCombustibleId);
        } else {
            result = result.filter((i) => i.categoria_id !== categoriaCombustibleId);
            if (filterCategoria) {
                result = result.filter((i) => i.categoria_id === filterCategoria);
            }
        }
        return result;
    }, [isCombustiblesView, items, categoriaCombustibleId, filterCategoria]);

    const getCategoriaNombre = useCallback(
        (id: number) => {
            return categoriasConCombustible.find((c) => c.id === id)?.nombre ?? '—';
        },
        [categoriasConCombustible]
    );

    // ─── Agregar categoría nueva ────────────────────────────────────────────────────

    const handleAgregarCategoria = useCallback(() => {
        const nombre = normalizarNombre(nuevaCategoria);
        if (!nombre) {
            error('Escribe un nombre para la categoría');
            return;
        }
        if (nombre === COMBUSTIBLE_NOMBRE) {
            error('"Combustible" es una categoría reservada del sistema');
            return;
        }
        if (categoriasConCombustible.some((c) => c.nombre === nombre)) {
            error(`La categoría "${nombre}" ya existe`);
            return;
        }
        const nueva: CategoriaPrecio = { id: Date.now(), nombre };
        const next = [...categoriasConCombustible, nueva];
        persistCategorias(next);
        setForm((prev) => ({ ...prev, categoria_id: nueva.id }));
        setNuevaCategoria('');
        setShowAddCategoria(false);
        success(`Categoría "${nombre}" agregada`);
    }, [nuevaCategoria, categoriasConCombustible, error, success]);

    // ─── Eliminar categoría ─────────────────────────────────────────────────────────

    const handleDeleteCategoria = useCallback(
        (categoria: CategoriaPrecio) => {
            if (categoria.nombre === COMBUSTIBLE_NOMBRE) {
                error('"Combustible" es una categoría del sistema y no se puede eliminar');
                return;
            }
            const referenced = items.some((i) => i.categoria_id === categoria.id);
            if (referenced) {
                error(`No se puede eliminar "${categoria.nombre}" porque tiene precios asociados. Elimina o reasigna los precios primero.`);
                return;
            }
            confirmDialog({
                message: `¿Eliminar la categoría "${categoria.nombre}"?`,
                header: 'Confirmar eliminación de categoría',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Eliminar',
                rejectLabel: 'Cancelar',
                acceptClassName: 'p-button-danger',
                accept: () => {
                    const next = categoriasConCombustible.filter((c) => c.id !== categoria.id);
                    persistCategorias(next);
                    success(`Categoría "${categoria.nombre}" eliminada`);
                }
            });
        },
        [items, categoriasConCombustible, error, success]
    );

    // ─── Exportar CSV ───────────────────────────────────────────────────────────

    const handleExportCSV = useCallback(() => {
        if (filteredItems.length === 0) {
            error('No hay registros para exportar');
            return;
        }
        const headers = isCombustiblesView ? ['Nombre', 'Subtipo', 'Precio (MXN)', 'Última actualización'] : ['Nombre', 'Categoría', 'Precio (MXN)', 'Última actualización'];
        const rows = filteredItems.map((item) => [item.nombre, isCombustiblesView ? item.subtipo_combustible || '' : getCategoriaNombre(item.categoria_id), item.precio?.toString() ?? '', formatFecha(item.updated_at)]);
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
        setForm(makeInitialForm());
        setShowAddCategoria(false);
        setNuevaCategoria('');
    }, []);

    const validate = useCallback((): string | null => {
        const nom = form.nombre.trim();
        if (!nom) return 'El nombre es obligatorio';
        if (isCombustiblesView) {
            if (!form.subtipo_combustible) return 'Selecciona el tipo de combustible';
            // Validar unicidad (nombre + subtipo)
            const duplicate = items.find((i) => i.id !== form.id && i.categoria_id === categoriaCombustibleId && i.nombre.trim().toLowerCase() === nom.toLowerCase() && i.subtipo_combustible === form.subtipo_combustible);
            if (duplicate) {
                return `El proveedor "${nom}" ya tiene registrado el tipo de combustible "${form.subtipo_combustible}".`;
            }
        } else {
            if (!form.categoria_id) return 'Selecciona una categoría';
        }
        if (!form.precio || form.precio <= 0) return 'El precio debe ser mayor a 0';
        return null;
    }, [form, isCombustiblesView, items, categoriaCombustibleId]);

    const handleSave = useCallback(() => {
        const err = validate();
        if (err) {
            error(err);
            return;
        }

        const now = new Date().toISOString();
        const cat_id = isCombustiblesView ? categoriaCombustibleId! : form.categoria_id!;

        if (form.id) {
            const updated = items.map((item) =>
                item.id === form.id
                    ? {
                          ...item,
                          nombre: form.nombre.trim(),
                          categoria_id: cat_id,
                          subtipo_combustible: isCombustiblesView ? form.subtipo_combustible : undefined,
                          precio: form.precio!,
                          updated_at: now
                      }
                    : item
            );
            persistItems(updated);
            success('Precio actualizado');
        } else {
            const nuevo: StoredPrecio = {
                id: Date.now(),
                categoria_id: cat_id,
                nombre: form.nombre.trim(),
                subtipo_combustible: isCombustiblesView ? form.subtipo_combustible : undefined,
                precio: form.precio!,
                created_at: now,
                updated_at: now
            };
            persistItems([nuevo, ...items]);
            success('Precio creado');
        }
        closeDialog();
    }, [validate, form, isCombustiblesView, categoriaCombustibleId, items, success, error, closeDialog]);

    const handleEdit = useCallback(
        (item: StoredPrecio) => {
            setForm({
                id: item.id,
                categoria_id: item.categoria_id,
                nombre: item.nombre,
                subtipo_combustible: item.subtipo_combustible ?? '',
                precio: item.precio
            });
            setShowAddCategoria(false);
            setNuevaCategoria('');
            setShowDialog(true);
        },
        [isCombustiblesView, categoriaCombustibleId]
    );

    const handleDelete = useCallback(
        (item: StoredPrecio) => {
            confirmDialog({
                message: `¿Eliminar "${item.nombre}"?`,
                header: 'Confirmar eliminación',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Eliminar',
                rejectLabel: 'Cancelar',
                acceptClassName: 'p-button-danger',
                accept: () => {
                    persistItems(items.filter((r) => r.id !== item.id));
                    success('Precio eliminado');
                }
            });
        },
        [items, success]
    );

    const openNew = useCallback(() => {
        setForm({
            ...makeInitialForm(),
            categoria_id: isCombustiblesView ? categoriaCombustibleId : null
        });
        setShowAddCategoria(false);
        setNuevaCategoria('');
        setShowDialog(true);
    }, [isCombustiblesView, categoriaCombustibleId]);

    // ─── Templates de columnas ─────────────────────────────────────────────────

    const categoriaBodyTemplate = (row: StoredPrecio) => <Tag value={getCategoriaNombre(row.categoria_id)} severity="info" />;

    const subtipoCombustibleBody = (row: StoredPrecio) => (row.subtipo_combustible ? <Tag value={row.subtipo_combustible} severity="warning" /> : <span>—</span>);

    const precioBody = (row: StoredPrecio) => row.precio?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) ?? '—';

    const fechaBody = (row: StoredPrecio) => <span className="text-sm text-600">{formatFecha(row.updated_at)}</span>;

    const actionsBody = (row: StoredPrecio) => (
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

                {/* ── Header (como CatalogoBasePage) ── */}
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

                {/* ── Aviso prototipo ── */}
                <div className="mb-3 p-3 border-round-lg surface-100 border-1 border-300 flex align-items-center gap-2">
                    <i className="pi pi-info-circle text-blue-500"></i>
                    <span className="text-sm text-700">
                        <strong>Modo prototipo</strong> — Los datos se guardan en localStorage. En la próxima fase se conectará a la API.
                    </span>
                </div>

                {/* ── Toolbar (como CatalogoManager) ── */}
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
                            <Button icon="pi pi-refresh" severity="secondary" onClick={loadFromStorage} tooltip="Actualizar" tooltipOptions={{ position: 'top' }} />
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
                            {categoriasConCombustible
                                .filter((c) => c.nombre !== COMBUSTIBLE_NOMBRE)
                                .map((categoria) => {
                                    const count = items.filter((i) => i.categoria_id === categoria.id).length;
                                    return (
                                        <div key={categoria.id} className="flex align-items-center gap-1 surface-100 border-round px-3 py-2">
                                            <span className="text-sm font-medium">{categoria.nombre}</span>
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
                            {categoriasConCombustible.filter((c) => c.nombre !== COMBUSTIBLE_NOMBRE).length === 0 && <span className="text-sm text-500">Sin categorías creadas. Agrega una para clasificar tus precios.</span>}
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
                        emptyMessage="No se encontraron precios registrados. Haz clic en «Nuevo» para agregar uno."
                        sortField="updated_at"
                        sortOrder={-1}
                        rowsPerPageOptions={[5, 10, 25]}
                        responsiveLayout="scroll"
                    >
                        <Column field="nombre" header="Nombre" sortable style={{ minWidth: '14rem' }} />
                        {!isCombustiblesView && <Column header="Categoría" body={categoriaBodyTemplate} style={{ minWidth: '10rem' }} />}
                        {isCombustiblesView && <Column header="Tipo de Combustible" body={subtipoCombustibleBody} style={{ minWidth: '12rem' }} />}
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

                        {/* Categoría (master) o Categoría Fija (combustible) */}
                        {!isCombustiblesView ? (
                            <div className="field">
                                <label htmlFor="categoria" className="block font-medium mb-2">
                                    Categoría <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="categoria"
                                    value={form.categoria_id}
                                    options={categoriaOptions}
                                    onChange={(e) => setForm((p) => ({ ...p, categoria_id: e.value }))}
                                    placeholder="Seleccionar categoría..."
                                    className="w-full"
                                    emptyMessage="Sin categorías. Crea una desde la sección «Categorías de precio» arriba."
                                />
                            </div>
                        ) : (
                            <div className="field">
                                <label className="block font-medium mb-2">Categoría</label>
                                <InputText value={COMBUSTIBLE_NOMBRE} className="w-full" disabled />
                                <small className="block mt-1 text-500">Asignada automáticamente por el sistema.</small>
                            </div>
                        )}

                        {/* Subtipo combustible (solo vista combustibles) */}
                        {isCombustiblesView && (
                            <div className="field">
                                <label htmlFor="subtipo" className="block font-medium mb-2">
                                    Tipo de Combustible <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="subtipo"
                                    value={form.subtipo_combustible}
                                    options={SUBTIPO_COMBUSTIBLE_OPTIONS}
                                    onChange={(e) => setForm((p) => ({ ...p, subtipo_combustible: e.value }))}
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

                        {/* Footer (Botones) */}
                        <div className="flex justify-content-end gap-2 pt-4 border-top-1 surface-border">
                            <Button type="button" label="Cancelar" icon="pi pi-times" severity="secondary" outlined onClick={closeDialog} />
                            <Button type="submit" label={form.id ? 'Actualizar' : 'Guardar'} icon="pi pi-check" />
                        </div>
                    </form>
                </Dialog>
            </div>
        </div>
    );
}
