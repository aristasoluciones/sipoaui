'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BreadCrumb } from 'primereact/breadcrumb';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useNotification } from '@/layout/context/notificationContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ViaticoZona = {
    id: number;
    nombre: string;
};

type StoredViatico = {
    id: number;
    categoria: string;
    zona_id: number;
    cuota: number;
    created_at: string;
    updated_at: string;
};

type FormValues = {
    id: number | null;
    categoria: string;
    zona_id: number | null;
    cuota: number | null;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY_ZONAS = 'sipoa_viatico_zonas_v1';
const STORAGE_KEY_VIATICOS = 'sipoa_viaticos_v1';

const DEFAULT_ZONAS: ViaticoZona[] = [
    { id: 1, nombre: 'Zona 1' },
    { id: 2, nombre: 'Zona 2' },
    { id: 3, nombre: 'Zona 3' },
    { id: 4, nombre: 'Fuera del Estado' }
];

const DEFAULT_VIATICOS: StoredViatico[] = [
    { id: 1, categoria: 'Consejero Presidente', zona_id: 1, cuota: 2993, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, categoria: 'Consejero Presidente', zona_id: 2, cuota: 2703, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, categoria: 'Consejero Presidente', zona_id: 3, cuota: 2510, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, categoria: 'Consejero Presidente', zona_id: 4, cuota: 4344, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 5, categoria: 'Consejero Electoral', zona_id: 1, cuota: 1158, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 6, categoria: 'Consejero Electoral', zona_id: 2, cuota: 1062, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 7, categoria: 'Consejero Electoral', zona_id: 3, cuota: 965, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 8, categoria: 'Consejero Electoral', zona_id: 4, cuota: 1737, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
];

const makeInitialForm = (): FormValues => ({
    id: null,
    categoria: '',
    zona_id: null,
    cuota: null
});

const normalizarCategoria = (nombre: string): string => {
    if (!nombre) return '';
    const name = nombre.trim();
    return name.charAt(0).toUpperCase() + name.slice(1);
};

// ─── Componente Principal ───────────────────────────────────────────────────

export default function ViaticosPrototypeForm() {
    const router = useRouter();
    const { success, error } = useNotification();

    // Estado global
    const [zonas, setZonas] = useState<ViaticoZona[]>([]);
    const [items, setItems] = useState<StoredViatico[]>([]);

    // Estado de filtros
    const [filterCategoria, setFilterCategoria] = useState<string | null>(null);
    const [filterZona, setFilterZona] = useState<number | null>(null);

    // Estado del formulario
    const [form, setForm] = useState<FormValues>(makeInitialForm);
    const [showDialog, setShowDialog] = useState(false);

    // Agregar zona nueva
    const [showAddZona, setShowAddZona] = useState(false);
    const [nuevaZona, setNuevaZona] = useState('');

    // ─── Breadcrumb ────────────────────────────────────────────────────────────

    const breadcrumbItems = [
        { label: 'Inicio', command: () => router.push('/') },
        { label: 'Catálogos', command: () => router.push('/catalogos'), className: 'text-primary font-medium' },
        { label: 'Recursos Humanos, Presupuestarios y Financieros' },
        { label: 'Viáticos', className: 'font-bold text-900' }
    ];
    const breadcrumbHome = { icon: 'pi pi-home', command: () => router.push('/') };

    // ─── Persistencia (con carga inicial por defecto) ──────────────────────────

    const loadFromStorage = () => {
        try {
            const rawZonas = localStorage.getItem(STORAGE_KEY_ZONAS);
            const rawItems = localStorage.getItem(STORAGE_KEY_VIATICOS);

            if (!rawZonas) {
                setZonas(DEFAULT_ZONAS);
                localStorage.setItem(STORAGE_KEY_ZONAS, JSON.stringify(DEFAULT_ZONAS));
            } else {
                setZonas(JSON.parse(rawZonas) as ViaticoZona[]);
            }

            if (!rawItems) {
                setItems(DEFAULT_VIATICOS);
                localStorage.setItem(STORAGE_KEY_VIATICOS, JSON.stringify(DEFAULT_VIATICOS));
            } else {
                setItems(JSON.parse(rawItems) as StoredViatico[]);
            }
        } catch {
            setZonas(DEFAULT_ZONAS);
            setItems(DEFAULT_VIATICOS);
        }
    };

    useEffect(() => {
        loadFromStorage();
    }, []);

    const persistZonas = (next: ViaticoZona[]) => {
        setZonas(next);
        localStorage.setItem(STORAGE_KEY_ZONAS, JSON.stringify(next));
    };

    const persistItems = (next: StoredViatico[]) => {
        setItems(next);
        localStorage.setItem(STORAGE_KEY_VIATICOS, JSON.stringify(next));
    };

    // ─── Opciones para dropdowns ─────────────────────────────────────────────

    const zonaOptions = useMemo(() => zonas.map((z) => ({ label: z.nombre, value: z.id })), [zonas]);

    const categoriasExistentes = useMemo(() => Array.from(new Set(items.map((i) => i.categoria))).sort(), [items]);
    const categoriaFilterOptions = useMemo(() => categoriasExistentes.map((c) => ({ label: c, value: c })), [categoriasExistentes]);

    // ─── Filtrado de tabla ───────────────────────────────────────────────────

    const filteredItems = useMemo(() => {
        let result = items;
        if (filterCategoria) {
            result = result.filter((i) => i.categoria === filterCategoria);
        }
        if (filterZona) {
            result = result.filter((i) => i.zona_id === filterZona);
        }
        return result;
    }, [items, filterCategoria, filterZona]);

    const getZonaNombre = useCallback(
        (id: number) => {
            return zonas.find((z) => z.id === id)?.nombre ?? '—';
        },
        [zonas]
    );

    // ─── Agregar zona nueva ──────────────────────────────────────────────────

    const handleAgregarZona = useCallback(() => {
        const nombre = normalizarCategoria(nuevaZona);
        if (!nombre) {
            error('Escribe un nombre para la zona');
            return;
        }
        if (zonas.some((z) => z.nombre.toLowerCase() === nombre.toLowerCase())) {
            error(`La zona "${nombre}" ya existe`);
            return;
        }
        const nueva: ViaticoZona = { id: Date.now(), nombre };
        const next = [...zonas, nueva];
        persistZonas(next);
        setForm((prev) => ({ ...prev, zona_id: nueva.id }));
        setNuevaZona('');
        setShowAddZona(false);
        success(`Zona "${nombre}" agregada`);
    }, [nuevaZona, zonas, error, success]);

    // ─── Eliminar zona ───────────────────────────────────────────────────────

    const handleDeleteZona = useCallback(
        (zona: ViaticoZona) => {
            const referenced = items.some((i) => i.zona_id === zona.id);
            if (referenced) {
                error(`No se puede eliminar la zona "${zona.nombre}" porque tiene viáticos asociados. Elimina o reasigna los viáticos primero.`);
                return;
            }
            confirmDialog({
                message: `¿Eliminar la zona "${zona.nombre}"?`,
                header: 'Confirmar eliminación',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Eliminar',
                rejectLabel: 'Cancelar',
                acceptClassName: 'p-button-danger',
                accept: () => {
                    const next = zonas.filter((z) => z.id !== zona.id);
                    persistZonas(next);
                    success(`Zona "${zona.nombre}" eliminada`);
                }
            });
        },
        [items, zonas, error, success]
    );

    // ─── Exportar CSV ──────────────────────────────────────────────────────────

    const handleExportCSV = useCallback(() => {
        if (filteredItems.length === 0) {
            error('No hay registros para exportar');
            return;
        }
        const headers = ['Categoría', 'Zona', 'Cuota (MXN)', 'Última actualización'];
        const rows = filteredItems.map((item) => [item.categoria, getZonaNombre(item.zona_id), item.cuota?.toString() ?? '', new Date(item.updated_at).toLocaleString('es-MX')]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `viaticos_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        success('Archivo exportado');
    }, [filteredItems, getZonaNombre, error, success]);

    // ─── CRUD Viáticos ────────────────────────────────────────────────────────

    const closeDialog = useCallback(() => {
        setShowDialog(false);
        setForm(makeInitialForm());
        setShowAddZona(false);
        setNuevaZona('');
    }, []);

    const validate = useCallback((): string | null => {
        const cat = normalizarCategoria(form.categoria);
        if (!cat) return 'La categoría es obligatoria';
        if (!form.zona_id) return 'Selecciona una zona';
        if (!form.cuota || form.cuota <= 0) return 'La cuota debe ser mayor a 0';

        // Validar unicidad (categoria + zona)
        const duplicate = items.find((i) => i.id !== form.id && i.categoria.toLowerCase() === cat.toLowerCase() && i.zona_id === form.zona_id);
        if (duplicate) {
            return `La categoría "${cat}" ya tiene una cuota registrada para la zona seleccionada.`;
        }

        return null;
    }, [form, items]);

    const handleSave = useCallback(() => {
        const err = validate();
        if (err) {
            error(err);
            return;
        }

        const now = new Date().toISOString();
        const categoriaFinal = normalizarCategoria(form.categoria);

        if (form.id) {
            const updated = items.map((item) =>
                item.id === form.id
                    ? {
                          ...item,
                          categoria: categoriaFinal,
                          zona_id: form.zona_id!,
                          cuota: form.cuota!,
                          updated_at: now
                      }
                    : item
            );
            persistItems(updated);
            success('Viático actualizado');
        } else {
            const nuevo: StoredViatico = {
                id: Date.now(),
                categoria: categoriaFinal,
                zona_id: form.zona_id!,
                cuota: form.cuota!,
                created_at: now,
                updated_at: now
            };
            persistItems([...items, nuevo]);
            success('Viático creado');
        }
        closeDialog();
    }, [validate, form, items, success, error, closeDialog]);

    const handleEdit = useCallback((item: StoredViatico) => {
        setForm({
            id: item.id,
            categoria: item.categoria,
            zona_id: item.zona_id,
            cuota: item.cuota
        });
        setShowAddZona(false);
        setNuevaZona('');
        setShowDialog(true);
    }, []);

    const handleDelete = useCallback(
        (item: StoredViatico) => {
            confirmDialog({
                message: `¿Eliminar la cuota de $${item.cuota} para "${item.categoria}" en la zona "${getZonaNombre(item.zona_id)}"?`,
                header: 'Confirmar eliminación',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Eliminar',
                rejectLabel: 'Cancelar',
                acceptClassName: 'p-button-danger',
                accept: () => {
                    const next = items.filter((i) => i.id !== item.id);
                    persistItems(next);
                    success('Registro eliminado');
                }
            });
        },
        [items, getZonaNombre, success]
    );

    const openNew = useCallback(() => {
        setForm(makeInitialForm());
        setShowAddZona(false);
        setNuevaZona('');
        setShowDialog(true);
    }, []);

    // ─── Templates de columnas ────────────────────────────────────────────────

    const zonaBodyTemplate = (row: StoredViatico) => <Tag value={getZonaNombre(row.zona_id)} severity="info" />;

    const cuotaBody = (row: StoredViatico) => <span className="font-semibold text-green-600">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.cuota)}</span>;

    const fechaBody = (row: StoredViatico) => (
        <span className="text-500 text-sm">
            {new Date(row.updated_at).toLocaleString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })}
        </span>
    );

    const actionsBody = (row: StoredViatico) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => handleEdit(row)} tooltip="Editar" tooltipOptions={{ position: 'top' }} />
            <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => handleDelete(row)} tooltip="Eliminar" tooltipOptions={{ position: 'top' }} />
        </div>
    );

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <ConfirmDialog />

            <div className="max-w-7xl mx-auto">
                <BreadCrumb model={breadcrumbItems} home={breadcrumbHome} className="border-none bg-transparent surface-ground px-0 mb-4" />

                <div className="flex align-items-center justify-content-between mb-4">
                    <div className="flex align-items-center gap-3">
                        <div className="surface-0 border-circle flex align-items-center justify-content-center border-1 border-300 shadow-1" style={{ width: '48px', height: '48px' }}>
                            <i className="pi pi-map text-2xl text-primary"></i>
                        </div>
                        <div>
                            <h1 className="m-0 text-2xl font-bold text-900">Viáticos</h1>
                            <span className="text-500 text-sm block mt-1">Gestión de tarifas del tabulador de viáticos por categoría de puesto y zona geográfica</span>
                        </div>
                    </div>
                    <Button label="Regresar a catálogos" icon="pi pi-arrow-left" text onClick={() => router.push('/catalogos')} />
                </div>

                <div className="mb-4 surface-100 p-3 border-round border-1 border-300 text-600 text-sm flex align-items-center gap-2">
                    <i className="pi pi-info-circle text-lg"></i>
                    <span>
                        <strong>Modo Prototipo (Fase 1.3):</strong> La información se guarda localmente en tu navegador. Puedes organizar zonas libremente. La combinación de <em>Categoría + Zona</em> no puede repetirse. Al crear o borrar categorías
                        solo afectará el filtro.
                    </span>
                </div>

                {/* ── Gestión de zonas (vista master) ── */}
                <div className="card mb-3">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <span className="font-medium text-700">
                            <i className="pi pi-map-marker mr-2"></i>Zonas geográficas
                        </span>
                        <Button label="Agregar zona" icon="pi pi-plus" size="small" severity="secondary" outlined onClick={() => setShowAddZona(!showAddZona)} />
                    </div>
                    <div className="flex flex-wrap gap-2 align-items-center">
                        {zonas.map((zona) => {
                            const count = items.filter((i) => i.zona_id === zona.id).length;
                            return (
                                <div key={zona.id} className="flex align-items-center gap-1 surface-100 border-round px-3 py-2">
                                    <span className="text-sm font-medium">{zona.nombre}</span>
                                    {count > 0 && <Tag value={count.toString()} severity="info" className="ml-1" style={{ fontSize: '0.7rem' }} />}
                                    <Button
                                        icon="pi pi-times"
                                        text
                                        size="small"
                                        severity="danger"
                                        onClick={() => handleDeleteZona(zona)}
                                        tooltip={count > 0 ? `Tiene ${count} tarifa(s) asociada(s)` : 'Eliminar zona'}
                                        tooltipOptions={{ position: 'top' }}
                                        className="ml-1"
                                        style={{ width: '1.5rem', height: '1.5rem' }}
                                    />
                                </div>
                            );
                        })}
                        {zonas.length === 0 && <span className="text-sm text-500">Sin zonas creadas.</span>}
                    </div>
                    {showAddZona && (
                        <div className="mt-3 p-3 surface-50 border-round border-1 border-200">
                            <label className="block text-sm font-medium mb-2 text-700">Nombre de la nueva zona</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <InputText
                                    value={nuevaZona}
                                    onChange={(e) => setNuevaZona(e.target.value)}
                                    placeholder="Ej. Zona 5, Internacional..."
                                    style={{ flex: '1 1 auto', minWidth: '200px' }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAgregarZona()}
                                    autoFocus
                                />
                                <Button label="Agregar" icon="pi pi-check" size="small" onClick={handleAgregarZona} style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Toolbar ── */}
                <div className="card mb-3">
                    <div className="flex justify-content-between align-items-center">
                        <div className="flex gap-2 align-items-center">
                            <Button label="Nuevo" icon="pi pi-plus" onClick={openNew} />
                            <Dropdown value={filterCategoria} options={categoriaFilterOptions} onChange={(e) => setFilterCategoria(e.value)} placeholder="Filtrar por categoría (puesto)" showClear className="ml-2" style={{ minWidth: '15rem' }} />
                            <Dropdown value={filterZona} options={zonaOptions} onChange={(e) => setFilterZona(e.value)} placeholder="Filtrar por zona" showClear className="ml-2" style={{ minWidth: '15rem' }} />
                        </div>
                        <div className="flex gap-2">
                            <Button label="Importar" icon="pi pi-upload" severity="secondary" tooltip="Importar desde archivo (próximamente)" tooltipOptions={{ position: 'top' }} disabled />
                            <Button label="Exportar" icon="pi pi-download" severity="help" tooltip="Exportar a CSV" tooltipOptions={{ position: 'top' }} onClick={handleExportCSV} />
                            <Button icon="pi pi-refresh" severity="secondary" onClick={loadFromStorage} tooltip="Actualizar o recargar seed visual" tooltipOptions={{ position: 'top' }} />
                        </div>
                    </div>
                </div>

                <div className="card shadow-1 border-none">
                    <DataTable
                        value={filteredItems}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        emptyMessage="No se encontraron tarifas registradas."
                        className="p-datatable-sm"
                        stripedRows
                        responsiveLayout="scroll"
                        sortField="categoria"
                        sortOrder={1}
                    >
                        <Column field="categoria" header="Categoría (Puesto)" sortable style={{ minWidth: '14rem' }} filter filterPlaceholder="Buscar categoría..." />
                        <Column header="Zona" body={zonaBodyTemplate} style={{ minWidth: '10rem' }} sortable sortField="zona_id" />
                        <Column header="Cuota (MXN)" body={cuotaBody} style={{ minWidth: '10rem' }} sortable sortField="cuota" />
                        <Column header="Última actualización" body={fechaBody} style={{ minWidth: '12rem' }} />
                        <Column body={actionsBody} headerStyle={{ width: '8rem' }} />
                    </DataTable>
                </div>

                {/* ── Dialog: Crear / Editar ── */}
                <Dialog visible={showDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header={form.id ? 'Editar tarifa de viático' : 'Nueva tarifa de viático'} modal onHide={closeDialog}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSave();
                        }}
                        className="flex flex-column gap-4 pt-2"
                    >
                        {/* Categoría */}
                        <div className="field">
                            <label htmlFor="categoria" className="block font-medium mb-2">
                                Categoría (Puesto) <span className="text-red-500">*</span>
                            </label>
                            {/* Usamos un input libre con un datalist para sugerir existentes y permitir crear nuevos directamente */}
                            <InputText
                                id="categoria"
                                value={form.categoria}
                                onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                                placeholder="Ej. Consejero Presidente, Asesor..."
                                className="w-full"
                                list="categorias-existentes"
                                autoFocus
                            />
                            <datalist id="categorias-existentes">
                                {categoriasExistentes.map((cat) => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>

                        {/* Zona */}
                        <div className="field">
                            <label htmlFor="zona" className="block font-medium mb-2">
                                Zona <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="zona"
                                value={form.zona_id}
                                options={zonaOptions}
                                onChange={(e) => setForm((p) => ({ ...p, zona_id: e.value }))}
                                placeholder="Seleccionar zona..."
                                className="w-full"
                                emptyMessage="Sin zonas. Crea una desde la cabecera arriba."
                            />
                        </div>

                        {/* Cuota */}
                        <div className="field">
                            <label htmlFor="cuota" className="block font-medium mb-2">
                                Cuota (MXN) <span className="text-red-500">*</span>
                            </label>
                            <InputNumber id="cuota" value={form.cuota} onValueChange={(e) => setForm((p) => ({ ...p, cuota: e.value ?? null }))} mode="currency" currency="MXN" locale="es-MX" min={0} placeholder="0.00" className="w-full" />
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
