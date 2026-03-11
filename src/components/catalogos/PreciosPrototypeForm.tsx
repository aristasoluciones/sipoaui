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
import { TabView, TabPanel } from 'primereact/tabview';
import { useNotification } from '@/layout/context/notificationContext';
import { PreciosService } from '@/src/services/precios.service';
import { CategoriaPreciosService } from '@/src/services/categoriaPrecios.service';
import { CombustiblesService } from '@/src/services/combustibles.service';
import ImportCatalogDialog from './ImportCatalogDialog';
import type { Precio, CategoriaPrecio } from '@/types/catalogos';

// ─── Tipos locales ─────────────────────────────────────────────────────────────

type FormValues = {
    id: number | null;
    categoriaPrecioId: number | null;
    concepto: string;
    unidadMedida: string;
    subtipoCombustible: 'Magna' | 'Premium' | 'Diesel' | '';
    costoTotal: number | null;
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
    concepto: '',
    unidadMedida: mode === 'combustibles' ? 'Litro' : '',
    subtipoCombustible: '',
    costoTotal: null
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
    const [editingCategoriaBase, setEditingCategoriaBase] = useState<string | null>(null);
    const [editingCategoriaNombre, setEditingCategoriaNombre] = useState('');
    const [saving, setSaving] = useState(false);
    const [activePartidaIdx, setActivePartidaIdx] = useState(0);
    const [filterCategoria, setFilterCategoria] = useState<number | null>(null);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Precio[]>([]);

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

    // ─── Helpers para categorías ───────────────────────────────────────────────

    // Helper para obtener el nombre base de una categoría (sin el sufijo de partida)
    const getBaseName = useCallback((name: string) => {
        const match = name.match(/^(.*?)\s*\(P\d+\)$/);
        return match ? match[1].trim() : name.trim();
    }, []);

    // Nombres base únicos de las categorías
    const categoriasBaseUnicas = useMemo(() => {
        const baseNames = new Set<string>();
        categorias.forEach((c) => {
            if (c.nombre !== COMBUSTIBLE_NOMBRE) {
                baseNames.add(getBaseName(c.nombre));
            }
        });
        return Array.from(baseNames).sort();
    }, [categorias, getBaseName]);

    // Mapa de nombre base a IDs de categorías relacionadas
    const baseCategoriesMap = useMemo(() => {
        const map: { [key: string]: number[] } = {};
        categorias.forEach((c) => {
            const baseName = getBaseName(c.nombre);
            if (!map[baseName]) {
                map[baseName] = [];
            }
            map[baseName].push(c.id);
        });
        return map;
    }, [categorias, getBaseName]);

    // ─── Categoría combustible (reservada) ─────────────────────────────────────

    const categoriaCombustibleId = useMemo(() => categorias.find((c) => c.nombre === COMBUSTIBLE_NOMBRE)?.id ?? null, [categorias]);

    // ─── Opciones para dropdowns ───────────────────────────────────────────────

    const categoriaOptions = useMemo(() => {
        if (isCombustiblesView) return [];
        return categoriasBaseUnicas
            .filter((baseName) => baseName !== COMBUSTIBLE_NOMBRE)
            .map((baseName) => {
                // Encuentra la primera categoría con este nombre base para obtener un ID representativo
                const cat = categorias.find((c) => getBaseName(c.nombre) === baseName);
                return { label: baseName, value: cat?.id };
            });
    }, [isCombustiblesView, categorias, categoriasBaseUnicas, getBaseName]);

    // Agrupar por Partida para las pestañas
    const partidasAgrupadas = useMemo(() => {
        if (isCombustiblesView) return [];

        const map = new Map<number | string, { id: number | string; codigo: string; nombre: string; categorias: CategoriaPrecio[] }>();

        categorias.forEach((cat) => {
            if (cat.nombre === COMBUSTIBLE_NOMBRE) return;
            const pId = cat.partida?.id || 'sin-partida';
            if (!map.has(pId)) {
                map.set(pId, {
                    id: pId,
                    codigo: cat.partida?.codigo || '',
                    nombre: cat.partida?.nombre || (pId === 'sin-partida' ? 'Otras Categorías' : 'Sin Nombre'),
                    categorias: []
                });
            }
            map.get(pId)!.categorias.push(cat);
        });

        return Array.from(map.values()).sort((a, b) => {
            if (a.id === 'sin-partida') return 1;
            if (b.id === 'sin-partida') return -1;
            return a.codigo.localeCompare(b.codigo);
        });
    }, [categorias, isCombustiblesView]);

    // ─── Filtrado de tabla ─────────────────────────────────────────────────────

    const filteredItems = useMemo(() => {
        let result = items;

        if (isCombustiblesView) {
            result = items.filter((i) => i.subtipoCombustible !== null);
        } else {
            // Filtro por pestaña de Partida
            if (activePartidaIdx > 0 && partidasAgrupadas.length > 0) {
                const selectedPartida = partidasAgrupadas[activePartidaIdx - 1]; // -1 porque 0 es "Todo"
                const catIds = selectedPartida.categorias.map((c) => c.id);
                result = result.filter((i) => catIds.includes(i.categoriaPrecioId || 0));
            }

            // Filtro por dropdown de categoría (opcional sobre la partida)
            if (filterCategoria) {
                result = result.filter((i) => i.categoriaPrecioId === filterCategoria);
            }
        }

        return result;
    }, [items, isCombustiblesView, filterCategoria, activePartidaIdx, partidasAgrupadas]);

    // Devuelve el nombre de categoría para mostrar en tabla/CSV (usa nombre base sin partida)
    const getCategoriaNombre = useCallback(
        (id: number | null) => {
            const cat = categorias.find((c) => c.id === id);
            if (!cat) return '—';
            return getBaseName(cat.nombre);
        },
        [categorias, getBaseName]
    );

    // ─── Agregar categoría ──────────────────────────────────────────────────────

    const handleAgregarCategoria = useCallback(async () => {
        const nombre = nuevaCategoria.trim();
        if (!nombre) {
            error('Escribe un nombre para la categoría');
            return;
        }
        try {
            // Por defecto crea la categoría con partidaId = 1 (O el valor base de tu DB) ya que requerimos al menos una.
            // Omitimos la creación dinámica de muchas para no saturar. Se asociará en un futuro a la partida real desde backend.
            const nueva = await CategoriaPreciosService.create(nombre, 1);
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
        if (!editingCategoriaBase) return;
        const nombreNuevo = editingCategoriaNombre.trim();
        if (!nombreNuevo) {
            error('Escribe un nombre válido para la categoría');
            setEditingCategoriaBase(null);
            return;
        }

        try {
            const categoriasAActualizar = categorias.filter((c) => getBaseName(c.nombre) === editingCategoriaBase);
            const actualizadas = await Promise.all(categoriasAActualizar.map((c) => CategoriaPreciosService.update(c.id, nombreNuevo, c.partidaId)));

            setCategorias((prev) => {
                const copia = [...prev];
                for (const act of actualizadas) {
                    const idx = copia.findIndex((c) => c.id === act.id);
                    if (idx !== -1) copia[idx] = act;
                }
                return copia;
            });
            setEditingCategoriaBase(null);
            success(`Múltiples categorías renombradas a "${nombreNuevo}"`);
        } catch (e: any) {
            const errData = e?.response?.data;
            const msg = errData?.errors ? Object.values(errData.errors).flat().join('\n') : errData?.message ?? 'Error al actualizar la categoría';
            error(msg);
        }
    }, [editingCategoriaBase, editingCategoriaNombre, error, success, categorias, getBaseName]);

    // ─── Eliminar categoría ─────────────────────────────────────────────────────

    const handleDeleteCategoriaGroup = useCallback(
        (catBase: string) => {
            const categoriasAElminar = categorias.filter((c) => getBaseName(c.nombre) === catBase);

            confirmDialog({
                message: `¿Eliminar el grupo de categorías "${catBase}"? Esto borrará ${categoriasAElminar.length} categoría(s) interna(s). Esta acción no se puede deshacer.`,
                header: 'Confirmar eliminación de categoría',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Eliminar',
                rejectLabel: 'Cancelar',
                acceptClassName: 'p-button-danger',
                accept: async () => {
                    try {
                        await Promise.all(categoriasAElminar.map((c) => CategoriaPreciosService.delete(c.id)));
                        const idsEliminados = categoriasAElminar.map((c) => c.id);
                        setCategorias((prev) => prev.filter((c) => !idsEliminados.includes(c.id)));
                        success(`Grupo de categorías "${catBase}" eliminado`);
                    } catch (e: any) {
                        const errData = e?.response?.data;
                        const msg = errData?.errors ? Object.values(errData.errors).flat().join('\n') : errData?.message ?? 'Error al eliminar la categoría';
                        error(msg);
                    }
                }
            });
        },
        [success, error, categorias, getBaseName]
    );

    // ─── Exportar CSV ───────────────────────────────────────────────────────────

    const handleExportCSV = useCallback(() => {
        if (filteredItems.length === 0) {
            error('No hay registros para exportar');
            return;
        }
        const headers = isCombustiblesView ? ['Concepto', 'Subtipo', 'Unidad', 'Costo Total (MXN)', 'Última actualización'] : ['Concepto', 'Categoría', 'Unidad', 'Costo Total (MXN)', 'Última actualización'];
        const rows = filteredItems.map((item) => [item.concepto, isCombustiblesView ? item.subtipoCombustible || '' : getCategoriaNombre(item.categoriaPrecioId), item.unidadMedida, item.costoTotal?.toString() ?? '', formatFecha(item.updatedAt)]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
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
        setEditingCategoriaBase(null); // Clear editing state
    }, [mode]);

    const validate = useCallback((): string | null => {
        if (!form.concepto.trim()) return 'El concepto es obligatorio';
        if (!form.unidadMedida.trim()) return 'La unidad de medida es obligatoria';
        if (isCombustiblesView) {
            if (!form.subtipoCombustible) return 'Selecciona el tipo de combustible';
        } else {
            if (!form.categoriaPrecioId) return 'Selecciona una categoría';
        }
        if (!form.costoTotal || form.costoTotal <= 0) return 'El costo total debe ser mayor a 0';
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
                        concepto: form.concepto.trim(),
                        unidadMedida: form.unidadMedida.trim(),
                        costoTotal: form.costoTotal!,
                        subtipoCombustible: form.subtipoCombustible!
                    });
                } else {
                    updated = await PreciosService.update(form.id, {
                        categoriaPrecioId: catId,
                        concepto: form.concepto.trim(),
                        unidadMedida: form.unidadMedida.trim(),
                        costoTotal: form.costoTotal!,
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
                        concepto: form.concepto.trim(),
                        unidadMedida: form.unidadMedida.trim(),
                        costoTotal: form.costoTotal!,
                        subtipoCombustible: form.subtipoCombustible!
                    });
                } else {
                    nuevo = await PreciosService.create({
                        categoriaPrecioId: catId,
                        concepto: form.concepto.trim(),
                        unidadMedida: form.unidadMedida.trim(),
                        costoTotal: form.costoTotal!,
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
            concepto: item.concepto,
            unidadMedida: item.unidadMedida,
            subtipoCombustible: (item.subtipoCombustible as any) ?? '',
            costoTotal: item.costoTotal
        });
        setShowAddCategoria(false);
        setNuevaCategoria('');
        setEditingCategoriaBase(null);
        setShowDialog(true);
    }, []);

    const handleDelete = useCallback(
        (item: Precio) => {
            confirmDialog({
                message: `¿Eliminar "${item.concepto}"?`,
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
        setEditingCategoriaBase(null); // Clear editing state
        setShowDialog(true);
    }, [mode, isCombustiblesView, categoriaCombustibleId]);

    // ─── Templates de columnas ─────────────────────────────────────────────────

    const getNombreConPartida = useCallback(
        (catId: number | null) => {
            const cat = categorias.find((c) => c.id === catId);
            if (!cat) return '—';
            return cat.nombre;
        },
        [categorias]
    );

    const categoriaBodyTemplate = (row: Precio) => <Tag value={getNombreConPartida(row.categoriaPrecioId)} severity="info" />;
    const subtipoCombustibleBody = (row: Precio) => (row.subtipoCombustible ? <Tag value={row.subtipoCombustible} severity="warning" /> : <span>—</span>);
    const precioBody = (row: Precio) => row.costoTotal?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) ?? '—';
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

    const confirmDeleteMultiple = () => {
        confirmDialog({
            message: `¿Estás seguro de eliminar los ${selectedItems.length} registros seleccionados? Esta acción no se puede deshacer.`,
            header: 'Eliminación Masiva',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    setLoading(true);
                    const ids = selectedItems.map((item) => item.id).filter((id) => id !== null) as number[];
                    await PreciosService.deleteMass(ids);
                    success(`${selectedItems.length} registros eliminados correctamente`);
                    setSelectedItems([]);
                    loadData();
                } catch (err) {
                    error('Error al eliminar los registros seleccionados');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <div className="grid">
            <div className="col-12">
                <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} className="mb-4 border-none bg-transparent p-0 text-sm" />

                <ConfirmDialog />

                {/* ── Header Section ── */}
                <div className="flex align-items-center justify-content-between mb-5">
                    <div className="flex align-items-center">
                        <i className={`pi ${isCombustiblesView ? 'pi-filter' : 'pi-dollar'} text-4xl text-pink-500 mr-3`}></i>
                        <div>
                            <h1 className="m-0 text-3xl font-bold text-900">{isCombustiblesView ? 'Catálogo de Combustibles' : 'Catálogo de Precios y Tarifas'}</h1>
                            <p className="text-600 m-0">Administra los costos base para el presupuesto SIPOA</p>
                        </div>
                    </div>
                    <Button label="Regresar a catálogos" icon="pi pi-arrow-left" outlined className="p-button-secondary text-pink-500 border-pink-400" onClick={() => router.push('/catalogos')} />
                </div>

                {/* ── Toolbar & Table Structure ── */}
                <div className="card shadow-2 border-round-2xl border-1 border-300 bg-white p-0 mb-4 overflow-hidden">
                    <div className="flex justify-content-between align-items-center p-4 border-bottom-1 border-200 surface-50">
                        <div className="flex gap-2 align-items-center">
                            <Button label="Registrar" icon="pi pi-plus" className="border-round-lg" onClick={openNew} />
                            {!isCombustiblesView && (
                                <Dropdown value={filterCategoria} options={categoriaOptions} onChange={(e) => setFilterCategoria(e.value)} placeholder="Filtrar por categoría" showClear className="ml-2 w-15rem md:w-20rem border-round-lg" />
                            )}
                        </div>
                        <div className="flex gap-2">
                            {selectedItems.length > 0 && <Button label={`Eliminar ${selectedItems.length}`} icon="pi pi-trash" severity="danger" className="border-round-lg pulse" onClick={confirmDeleteMultiple} />}
                            <Button label="Importar" icon="pi pi-upload" severity="secondary" className="border-round-lg" onClick={() => setShowImportDialog(true)} />
                            <Button label="Exportar" icon="pi pi-download" severity="help" className="border-round-lg" onClick={handleExportCSV} />
                            <Button icon="pi pi-refresh" severity="secondary" className="border-round-lg" onClick={loadData} loading={loading} />
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
                                    const displayName = categoria.partida ? `${categoria.nombre} (${categoria.partida.codigo})` : categoria.nombre;
                                    return (
                                        <div key={categoria.id} className="flex align-items-center gap-1 surface-100 border-round px-3 py-2">
                                            {editingCategoriaBase === String(categoria.id) ? (
                                                <InputText
                                                    value={editingCategoriaNombre}
                                                    onChange={(e) => setEditingCategoriaNombre(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateCategoria();
                                                        if (e.key === 'Escape') setEditingCategoriaBase(null);
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
                                                        setEditingCategoriaBase(String(categoria.id));
                                                        setEditingCategoriaNombre(categoria.nombre);
                                                    }}
                                                    title="Doble clic para editar"
                                                >
                                                    {displayName}
                                                </span>
                                            )}
                                            {count > 0 && <Tag value={count.toString()} severity="info" className="ml-1" style={{ fontSize: '0.7rem' }} />}
                                            <Button
                                                icon="pi pi-times"
                                                text
                                                size="small"
                                                severity="danger"
                                                onClick={() => handleDeleteCategoriaGroup(categoria.nombre)}
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
                    {isCombustiblesView ? (
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
                            selectionMode="multiple"
                            selection={selectedItems}
                            onSelectionChange={(e: any) => setSelectedItems(e.value)}
                        >
                            <Column selectionMode="multiple" headerStyle={{ width: '3rem', backgroundColor: '#f8fafc' }}></Column>
                            <Column field="concepto" header="Concepto" sortable style={{ minWidth: '14rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                            <Column header="Tipo de Combustible" body={subtipoCombustibleBody} style={{ minWidth: '12rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                            <Column header="Unidad" body={unidadBody} style={{ minWidth: '8rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                            <Column header="Precio (MXN)" body={precioBody} style={{ minWidth: '10rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                            <Column header="Última actualización" body={fechaBody} style={{ minWidth: '12rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                            <Column body={actionsBody} headerStyle={{ width: '8rem', backgroundColor: '#f8fafc' }} />
                        </DataTable>
                    ) : (
                        <TabView activeIndex={activePartidaIdx} onTabChange={(e) => setActivePartidaIdx(e.index)}>
                            <TabPanel header="Todo">
                                <DataTable
                                    value={filteredItems}
                                    loading={loading}
                                    className="p-datatable-sm overflow-hidden"
                                    rowHover
                                    selectionMode="multiple"
                                    selection={selectedItems}
                                    onSelectionChange={(e: any) => setSelectedItems(e.value)}
                                    dataKey="id"
                                    emptyMessage="No se encontraron registros."
                                    paginator
                                    rows={15}
                                    rowsPerPageOptions={[15, 30, 50]}
                                    responsiveLayout="scroll"
                                >
                                    <Column selectionMode="multiple" headerStyle={{ width: '3rem', backgroundColor: '#f8fafc' }}></Column>
                                    <Column field="concepto" header="Concepto" sortable style={{ minWidth: '14rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                                    <Column header="Categoría" body={categoriaBodyTemplate} style={{ minWidth: '10rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                                    <Column header="Unidad" body={unidadBody} style={{ minWidth: '8rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                                    <Column header="Precio (MXN)" body={precioBody} style={{ minWidth: '10rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                                    <Column header="Última actualización" body={fechaBody} style={{ minWidth: '12rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                                    <Column body={actionsBody} headerStyle={{ width: '8rem', backgroundColor: '#f8fafc' }} />
                                </DataTable>
                            </TabPanel>
                            {partidasAgrupadas.map((group) => (
                                <TabPanel key={group.id} header={group.codigo ? `${group.nombre} (${group.codigo})` : group.nombre}>
                                    <DataTable
                                        value={filteredItems}
                                        dataKey="id"
                                        paginator
                                        rows={10}
                                        loading={loading}
                                        emptyMessage={`No hay registros para ${group.nombre}.`}
                                        sortField="updatedAt"
                                        sortOrder={-1}
                                        rowsPerPageOptions={[5, 10, 25]}
                                        responsiveLayout="scroll"
                                        selectionMode="multiple"
                                        selection={selectedItems}
                                        onSelectionChange={(e: any) => setSelectedItems(e.value)}
                                    >
                                        <Column selectionMode="multiple" headerStyle={{ width: '3rem', backgroundColor: '#f8fafc' }}></Column>
                                        <Column field="concepto" header="Concepto" sortable style={{ minWidth: '14rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                                        <Column header="Categoría" body={categoriaBodyTemplate} style={{ minWidth: '10rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                                        <Column header="Unidad" body={unidadBody} style={{ minWidth: '8rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                                        <Column header="Precio (MXN)" body={precioBody} style={{ minWidth: '10rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                                        <Column header="Última actualización" body={fechaBody} style={{ minWidth: '12rem' }} headerStyle={{ backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }} />
                                        <Column body={actionsBody} headerStyle={{ width: '8rem', backgroundColor: '#f8fafc' }} />
                                    </DataTable>
                                </TabPanel>
                            ))}
                        </TabView>
                    )}
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
                        {/* Nombre / Concepto */}
                        <div className="field">
                            <label htmlFor="concepto" className="block font-medium mb-2">
                                Concepto <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="concepto"
                                value={form.concepto}
                                onChange={(e) => setForm((p) => ({ ...p, concepto: e.target.value }))}
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
                                    options={categoriasBaseUnicas.map((catBase) => {
                                        // Busca la primera categoría con este nombre base
                                        const cat = categorias.find((c) => getBaseName(c.nombre) === catBase);
                                        return { label: catBase, value: cat?.id };
                                    })}
                                    onChange={(e) => setForm((p) => ({ ...p, categoriaPrecioId: e.value }))}
                                    placeholder="Seleccionar categoría..."
                                    className="w-full"
                                    emptyMessage="Sin categorías. Crea una desde la sección arriba."
                                />
                            </div>
                        ) : (
                            <div className="field">
                                <label className="block font-medium mb-2">Categoría</label>
                                <InputText value={COMBUSTIBLE_NOMBRE} disabled className="w-full" />
                                <small className="block mt-1 text-500">Asignada automáticamente por el sistema.</small>
                            </div>
                        )}

                        {/* Subtipo combustible */}
                        {isCombustiblesView && (
                            <div className="field">
                                <label htmlFor="subtipo" className="block font-medium mb-2">
                                    Tipo de combustible <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    id="subtipo"
                                    value={form.subtipoCombustible}
                                    options={SUBTIPO_COMBUSTIBLE_OPTIONS}
                                    onChange={(e) => setForm((p) => ({ ...p, subtipoCombustible: e.value }))}
                                    placeholder="Seleccionar tipo..."
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Precio / Costo Total */}
                        <div className="field">
                            <label htmlFor="costo" className="block font-medium mb-2">
                                {isCombustiblesView ? 'Precio por litro (MXN)' : 'Costo Total (MXN)'} <span className="text-red-500">*</span>
                            </label>
                            <InputNumber id="costo" value={form.costoTotal} onValueChange={(e) => setForm((p) => ({ ...p, costoTotal: e.value ?? null }))} mode="currency" currency="MXN" locale="es-MX" min={0} placeholder="$0.00" className="w-full" />
                        </div>

                        {/* Footer */}
                        <div className="flex justify-content-end gap-2 pt-4 border-top-1 surface-border">
                            <Button type="button" label="Cancelar" icon="pi pi-times" severity="secondary" outlined onClick={closeDialog} disabled={saving} />
                            <Button type="submit" label={form.id ? 'Actualizar' : 'Guardar'} icon="pi pi-check" loading={saving} disabled={saving} />
                        </div>
                    </form>
                </Dialog>

                {/* ── Dialog: Importación Compartida ── */}
                <ImportCatalogDialog
                    visible={showImportDialog}
                    onHide={() => setShowImportDialog(false)}
                    onRefresh={loadData}
                    catalogKey={isCombustiblesView ? 'combustibles' : 'precios'}
                    catalogTitle={`Importar ${isCombustiblesView ? 'Combustibles' : 'Precios'}`}
                    description={`Selecciona un archivo CSV o Excel para actualizar masivamente el catálogo de ${isCombustiblesView ? 'combustibles' : 'precios y tarifas'}.`}
                />
            </div>
        </div>
    );
}
