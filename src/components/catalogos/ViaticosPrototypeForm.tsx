'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BreadCrumb } from 'primereact/breadcrumb';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { ListBox } from 'primereact/listbox';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Checkbox } from 'primereact/checkbox';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import ImportCatalogDialog from './ImportCatalogDialog';
import { useNotification } from '@/layout/context/notificationContext';
import { viaticosService, Viatico, Municipio, ZonaType, SubZona1 } from '@/src/services/viaticos.service';

type FormViatico = {
    id: number | null;
    nivel: string;
    categoria: string;
    cuota_zona1: number | 'N/A' | null;
    cuota_zona2: number | 'N/A' | null;
    cuota_zona3: number | 'N/A' | null;
    cuota_fuera_estado: number | 'N/A' | null;
    cuota_internacional: number | 'N/A' | null;
};

interface FormMunicipio {
    id: number | null;
    numero: number | null;
    nombre: string;
    clasificacion_zona: ZonaType;
    subclasificacion_z1?: SubZona1;
}

// ─── Constantes y Helpers ─────────────────────────────────────────────────────

const makeInitialFormViatico = (): FormViatico => ({
    id: null,
    nivel: '',
    categoria: '',
    cuota_zona1: null,
    cuota_zona2: null,
    cuota_zona3: null,
    cuota_fuera_estado: null,
    cuota_internacional: null
});

const makeInitialFormMunicipio = (): FormMunicipio => ({
    id: null,
    numero: null,
    nombre: '',
    clasificacion_zona: 'ZONA_1',
    subclasificacion_z1: null
});

// ─── Auxiliares ───────────────────────────────────────────────────────────────

const getAbreviatura = (sub?: SubZona1) => {
    if (sub === 'Medio') return ' (M)';
    if (sub === 'Bajo') return ' (B)';
    if (sub === 'Muy Bajo') return ' (MB)';
    return '';
};

const transformViaticoToForm = (v: Viatico): FormViatico => {
    const parseCuota = (val: string | number | null): number | 'N/A' | null => {
        if (val === 'N/A') return 'N/A';
        if (val === null || val === undefined) return null;
        const n = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(n) ? null : n;
    };

    return {
        id: v.id,
        nivel: v.nivel,
        categoria: v.categoria,
        cuota_zona1: parseCuota(v.cuota_zona1),
        cuota_zona2: parseCuota(v.cuota_zona2),
        cuota_zona3: parseCuota(v.cuota_zona3),
        cuota_fuera_estado: parseCuota(v.cuota_fuera_estado),
        cuota_internacional: parseCuota(v.cuota_internacional)
    };
};

const getZonaLabel = (z: ZonaType) => {
    if (z === 'ZONA_1') return 'Zona 1';
    if (z === 'ZONA_2') return 'Zona 2';
    if (z === 'ZONA_3') return 'Zona 3';
    return 'Fuera del Estado';
};

// ─── Componente Principal ───────────────────────────────────────────────────

export default function ViaticosPrototypeForm() {
    const router = useRouter();
    const { success, error } = useNotification();

    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [viaticos, setViaticos] = useState<Viatico[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [globalFilterViaticos, setGlobalFilterViaticos] = useState('');
    const [globalFilterMunicipios, setGlobalFilterMunicipios] = useState('');

    // Dialogs Form
    const [formViatico, setFormViatico] = useState<FormViatico>(makeInitialFormViatico);
    const [showDialogViatico, setShowDialogViatico] = useState(false);

    const [formMunicipio, setFormMunicipio] = useState<FormMunicipio>(makeInitialFormMunicipio);
    const [showDialogMunicipio, setShowDialogMunicipio] = useState(false);

    // Dialog Reasignación Masiva
    const [showDialogMasiva, setShowDialogMasiva] = useState(false);
    const [selectedReasignacion, setSelectedReasignacion] = useState<Municipio[]>([]);
    const [zonaOrigenFilter, setZonaOrigenFilter] = useState<ZonaType>('ZONA_2');
    const [zonaDestinoFilter, setZonaDestinoFilter] = useState<ZonaType>('ZONA_3');
    const [subclasificacionDestinoTransfer, setSubclasificacionDestinoTransfer] = useState<SubZona1 | undefined>(undefined);
    const [saving, setSaving] = useState(false);

    // Dialog Eliminación (Personalizado para controlar loading)
    const [deleteConfig, setDeleteConfig] = useState({ visible: false, header: '', message: '', onAccept: () => {} });

    // ─── Estados Importación y Selección ──────────────────────────────────
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [selectedViaticos, setSelectedViaticos] = useState<Viatico[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Carga de Datos ──────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [viaticosData, municipiosData] = await Promise.all([viaticosService.getViaticos(), viaticosService.getMunicipios()]);
            setViaticos(viaticosData);
            setMunicipios(municipiosData);
        } catch (err) {
            error('Error al cargar datos desde la API');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [error]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ─── Reasignación Masiva ────────────────────────────────────────────────
    const municipiosOrigen = useMemo(() => municipios.filter((m) => m.clasificacion_zona === zonaOrigenFilter).sort((a, b) => a.nombre.localeCompare(b.nombre)), [municipios, zonaOrigenFilter]);
    const municipiosDestino = useMemo(() => municipios.filter((m) => m.clasificacion_zona === zonaDestinoFilter).sort((a, b) => a.nombre.localeCompare(b.nombre)), [municipios, zonaDestinoFilter]);

    const handleTransfer = async () => {
        if (selectedReasignacion.length === 0) return;

        const isTargetZona1 = zonaDestinoFilter === 'ZONA_1';
        if (isTargetZona1 && subclasificacionDestinoTransfer === undefined) {
            error('Debes seleccionar una subclasificación (Medio, Bajo, Muy Bajo) para Zona 1.');
            return;
        }

        try {
            setSaving(true);
            await viaticosService.reassignMunicipios({
                municipio_ids: selectedReasignacion.map((m) => m.id),
                nueva_zona: zonaDestinoFilter,
                nueva_subclasificacion: isTargetZona1 ? subclasificacionDestinoTransfer : undefined
            });

            await loadData();
            setSelectedReasignacion([]);
            if (isTargetZona1) {
                setSubclasificacionDestinoTransfer(undefined);
            }
            success('Reasignación completada');
            setShowDialogMasiva(false);
        } catch (err: any) {
            const errData = err?.response?.data;
            const msg = errData?.errors ? Object.values(errData.errors).flat().join('\n') : errData?.message ?? 'Error al reasignar municipios';
            error(msg);
        } finally {
            setSaving(false);
        }
    };

    // ─── CRUD Municipios ────────────────────────────────────────────────────
    const openNewMunicipio = () => {
        setFormMunicipio(makeInitialFormMunicipio());
        setShowDialogMunicipio(true);
    };

    // Al dar clic en la tarjeta visual, la abre para editar
    const handleEditMunicipio = (row: Municipio) => {
        setFormMunicipio({ ...row });
        setShowDialogMunicipio(true);
    };

    // Lógica para el Delete integrada en Save o usar Dialog Confirm
    const handleDeleteMunicipio = async () => {
        if (!formMunicipio.id) return;
        setDeleteConfig({
            visible: true,
            header: 'Confirmar eliminación',
            message: `¿Eliminar "${formMunicipio.nombre}" del catálogo?`,
            onAccept: async () => {
                try {
                    setSaving(true);
                    const res = await viaticosService.deleteMunicipio(formMunicipio.id!);
                    success(res.message || 'Municipio eliminado');
                    setMunicipios((prev) => prev.filter((m) => m.id !== formMunicipio.id));
                    setDeleteConfig((prev) => ({ ...prev, visible: false }));
                    loadData(); // Sin await para liberar el UI de inmediato
                } catch (err: any) {
                    const errData = err?.response?.data;
                    const msg = errData?.errors ? Object.values(errData.errors).flat().join('\n') : errData?.message ?? 'Error al eliminar el municipio';
                    error(msg);
                } finally {
                    setSaving(false);
                }
            }
        });
    };

    const formatTitleCase = (str: string) => {
        const lowerWords = ['de', 'la', 'el', 'los', 'las', 'un', 'una', 'para', 'con', 'por', 'y', 'a', 'en', 'del'];
        return str
            .toLowerCase()
            .split(' ')
            .map((word, index) => {
                if (index > 0 && lowerWords.includes(word)) return word;
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    };

    const handleSaveMunicipio = async () => {
        const trimmedName = formMunicipio.nombre.trim();
        if (!trimmedName) {
            error('El nombre es obligatorio');
            return;
        }

        const formattedName = formatTitleCase(trimmedName);

        try {
            setSaving(true);
            const data = {
                nombre: formattedName,
                numero: formMunicipio.numero,
                clasificacion_zona: formMunicipio.clasificacion_zona,
                subclasificacion_z1: formMunicipio.clasificacion_zona === 'ZONA_1' ? formMunicipio.subclasificacion_z1 : null
            };

            if (formMunicipio.id) {
                const res = await viaticosService.updateMunicipio(formMunicipio.id, data);
                success(res.message || 'Municipio actualizado');
            } else {
                const res = await viaticosService.createMunicipio(data);
                success(res.message || 'Municipio creado');
            }
            setShowDialogMunicipio(false);
            await loadData();
        } catch (err: any) {
            const errData = err?.response?.data;
            const msg = errData?.errors ? Object.values(errData.errors).flat().join('\n') : errData?.message ?? 'Error al guardar el municipio';
            error(msg);
        } finally {
            setSaving(false);
        }
    };

    // ─── CRUD Viáticos ──────────────────────────────────────────────────────
    const openNewViatico = () => {
        setFormViatico(makeInitialFormViatico());
        setShowDialogViatico(true);
    };
    const handleEditViatico = (item: Viatico) => {
        setFormViatico(transformViaticoToForm(item));
        setShowDialogViatico(true);
    };
    const handleDeleteViaticos = async (item: Viatico) => {
        setDeleteConfig({
            visible: true,
            header: 'Confirmación',
            message: `¿Eliminar tarifa para "${item.categoria}"?`,
            onAccept: async () => {
                try {
                    setSaving(true);
                    const res = await viaticosService.deleteViatico(item.id);
                    success(res.message || 'Tarifa eliminada');
                    setViaticos((prev) => prev.filter((v) => v.id !== item.id));
                    setDeleteConfig((prev) => ({ ...prev, visible: false }));
                    loadData(); // Sin await para liberar el estado saving
                } catch (err: any) {
                    const errData = err?.response?.data;
                    const msg = errData?.errors ? Object.values(errData.errors).flat().join('\n') : errData?.message ?? 'Error al eliminar tarifa';
                    error(msg);
                } finally {
                    setSaving(false);
                }
            }
        });
    };

    const handleDeleteMassViaticos = async () => {
        if (selectedViaticos.length === 0) return;

        setDeleteConfig({
            visible: true,
            header: 'Eliminación Masiva',
            message: `¿Estás seguro de eliminar los ${selectedViaticos.length} registros seleccionados? Esta acción no se puede deshacer.`,
            onAccept: async () => {
                try {
                    setSaving(true);
                    const ids = selectedViaticos.map((v) => v.id);
                    const res = await viaticosService.deleteMassViaticos(ids);
                    success(res.message || 'Registros eliminados correctamente');
                    setSelectedViaticos([]);
                    setDeleteConfig((prev) => ({ ...prev, visible: false }));
                    await loadData();
                } catch (err: any) {
                    const errData = err?.response?.data;
                    const msg = errData?.message ?? 'Error al eliminar registros masivamente';
                    error(msg);
                } finally {
                    setSaving(false);
                }
            }
        });
    };
    const handleSaveViatico = async () => {
        const trimmedCat = formViatico.categoria.trim();
        const trimmedNivel = formViatico.nivel.trim();

        if (!trimmedNivel) {
            error('El Nivel es obligatorio');
            return;
        }
        if (!trimmedCat) {
            error('El Puesto es obligatorio');
            return;
        }

        const formattedCat = formatTitleCase(trimmedCat);

        try {
            setSaving(true);
            const data = {
                nivel: trimmedNivel.toUpperCase(),
                categoria: formattedCat,
                cuota_zona1: formViatico.cuota_zona1 === 'N/A' ? 'N/A' : formViatico.cuota_zona1?.toString() || null,
                cuota_zona2: formViatico.cuota_zona2 === 'N/A' ? 'N/A' : formViatico.cuota_zona2?.toString() || null,
                cuota_zona3: formViatico.cuota_zona3 === 'N/A' ? 'N/A' : formViatico.cuota_zona3?.toString() || null,
                cuota_fuera_estado: formViatico.cuota_fuera_estado === 'N/A' ? 'N/A' : formViatico.cuota_fuera_estado?.toString() || null,
                cuota_internacional: formViatico.cuota_internacional === 'N/A' ? 'N/A' : formViatico.cuota_internacional?.toString() || null
            };

            if (formViatico.id) {
                const res = await viaticosService.updateViatico(formViatico.id, data);
                success(res.message || 'Tarifa actualizada');
            } else {
                const res = await viaticosService.createViatico(data);
                success(res.message || 'Tarifa creada');
            }
            setShowDialogViatico(false);
            await loadData();
        } catch (err: any) {
            const errData = err?.response?.data;
            const msg = errData?.errors ? Object.values(errData.errors).flat().join('\n') : errData?.message ?? 'Error al guardar tarifa';
            error(msg);
        } finally {
            setSaving(false);
        }
    };

    // ─── Importar / Exportar ──────────────────────────────────────────────
    const handleExportCSV = () => {
        const csvRows = [];
        const headers = ['Nivel', 'Categoria', 'Zona 1', 'Zona 2', 'Zona 3', 'Fuera de Estado', 'Internacional'];
        csvRows.push(headers.join(','));

        viaticos.forEach((v) => {
            const row = [v.nivel, `"${v.categoria}"`, v.cuota_zona1 ?? '', v.cuota_zona2 ?? '', v.cuota_zona3 ?? '', v.cuota_fuera_estado ?? '', v.cuota_internacional ?? ''];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `tabulador_viaticos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImport = () => setShowImportDialog(true);

    // ─── Render Helpers ─────────────────────────────────────────────────────
    const currencyBody = (val: any, isDolar: boolean = false) => {
        if (val === 'N/A')
            return (
                <div className="flex justify-content-center">
                    <Tag value="N/A" severity="warning" className="text-xs" />
                </div>
            );
        if (val === null || val === undefined || val === '') return <span className="text-400">-</span>;

        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return <span className="text-400">-</span>;

        return <span className="font-semibold text-green-700">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: isDolar ? 'USD' : 'MXN' }).format(num)}</span>;
    };
    const viaticosActionsBody = (row: Viatico) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => handleEditViatico(row as any)} />
            <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => handleDeleteViaticos(row)} />
        </div>
    );

    // DICCIONARIO PARA VISUALIZACION
    const filteredMuns = useMemo(() => {
        const query = globalFilterMunicipios.toLowerCase();
        return municipios.filter((m) => m.nombre.toLowerCase().includes(query) || m.numero?.toString().includes(query));
    }, [globalFilterMunicipios, municipios]);

    const munsByZone = useMemo(() => {
        return {
            ZONA_3: filteredMuns.filter((m) => m.clasificacion_zona === 'ZONA_3').sort((a, b) => a.nombre.localeCompare(b.nombre)),
            ZONA_2: filteredMuns.filter((m) => m.clasificacion_zona === 'ZONA_2').sort((a, b) => a.nombre.localeCompare(b.nombre)),
            ZONA_1: filteredMuns.filter((m) => m.clasificacion_zona === 'ZONA_1').sort((a, b) => a.nombre.localeCompare(b.nombre)),
            FUERA_ESTADO: filteredMuns.filter((m) => m.clasificacion_zona === 'FUERA_ESTADO').sort((a, b) => a.nombre.localeCompare(b.nombre))
        };
    }, [filteredMuns]);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', position: 'relative' }}>
            {/* Spinner Superficial Minimalista */}
            {saving && (
                <div className="fixed top-0 left-0 right-0 z-5 flex justify-content-center p-3 pointer-events-none fadein">
                    <div className="surface-0 shadow-2 border-round-3xl px-4 py-2 flex align-items-center gap-2 border-1 border-200">
                        <i className="pi pi-spinner pi-spin text-primary text-xl"></i>
                        <span className="text-700 font-medium text-sm">Procesando...</span>
                    </div>
                </div>
            )}

            {/* Diálogo de Confirmación de Eliminación Personalizado */}
            <Dialog
                visible={deleteConfig.visible}
                onHide={() => !saving && setDeleteConfig((prev) => ({ ...prev, visible: false }))}
                header={deleteConfig.header}
                style={{ width: '350px' }}
                modal
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="No" icon="pi pi-times" text onClick={() => setDeleteConfig((prev) => ({ ...prev, visible: false }))} disabled={saving} />
                        <Button label="Sí" icon="pi pi-check" severity="danger" onClick={() => deleteConfig.onAccept()} loading={saving} />
                    </div>
                }
            >
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3 text-red-500" style={{ fontSize: '2rem' }}></i>
                    <span>{deleteConfig.message}</span>
                </div>
            </Dialog>

            <ConfirmDialog />
            <div className="max-w-7xl mx-auto">
                <BreadCrumb
                    model={[{ label: 'Inicio', command: () => router.push('/') }, { label: 'Catalogos', command: () => router.push('/catalogos') }, { label: 'Tabuladores', command: () => router.push('/catalogos') }, { label: 'Viáticos' }]}
                    home={{ icon: 'pi pi-home', command: () => router.push('/') }}
                    className="mb-4 surface-0 border-round shadow-1"
                />

                <div className="flex align-items-center justify-content-between mb-5">
                    <div className="flex align-items-center">
                        <i className="pi pi-map text-4xl text-pink-500 mr-3"></i>
                        <div>
                            <h1 className="m-0 text-3xl font-bold text-900">Viáticos</h1>
                            <p className="text-600 m-0">Gestión de tarifas de viáticos por zona geográfica</p>
                        </div>
                    </div>
                    <Button label="Regresar a catalogos" icon="pi pi-arrow-left" outlined className="p-button-secondary text-pink-500 border-pink-400" onClick={() => router.push('/catalogos')} />
                </div>

                {/* ── MATRIZ PRINCIPAL ── */}
                <div className="card shadow-2 border-round-2xl border-1 border-300 bg-white p-0 mb-6 overflow-hidden">
                    <div className="flex justify-content-between align-items-center p-4 border-bottom-1 border-200 surface-50">
                        <div className="flex gap-2 align-items-center">
                            <Button label="Registrar" icon="pi pi-plus" className="border-round-lg" onClick={openNewViatico} />
                            <span className="p-input-icon-left ml-2 w-15rem md:w-20rem">
                                <i className="pi pi-search text-400" />
                                <InputText value={globalFilterViaticos} onChange={(e) => setGlobalFilterViaticos(e.target.value)} placeholder="Buscar..." className="w-full border-round-lg" />
                            </span>
                        </div>
                        <div className="flex flex-column align-items-end gap-2">
                            {/* Badge Minimalista sobre los botones */}
                            <div className="hidden md:flex align-items-center px-2 py-1 bg-white border-1 border-100 border-round-lg shadow-sm" style={{ height: '22px' }}>
                                <span className="text-500 font-bold uppercase mr-1" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                                    Registros
                                </span>
                                <span className="text-pink-600 font-bold px-1" style={{ fontSize: '0.75rem' }}>
                                    {viaticos.length}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                {selectedViaticos.length > 0 && <Button label={`Eliminar ${selectedViaticos.length}`} icon="pi pi-trash" severity="danger" className="border-round-lg pulse" onClick={handleDeleteMassViaticos} />}
                                <Button label="Importar" icon="pi pi-upload" severity="secondary" className="border-round-lg" onClick={handleImport} />
                                <Button label="Exportar" icon="pi pi-download" severity="help" className="border-round-lg" onClick={handleExportCSV} />
                                <Button icon="pi pi-refresh" severity="secondary" className="border-round-lg" onClick={loadData} loading={loading} />
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <DataTable
                            value={viaticos.filter((i) => i.categoria.toLowerCase().includes(globalFilterViaticos.toLowerCase()) || (i.nivel ?? '').toLowerCase().includes(globalFilterViaticos.toLowerCase()))}
                            className="p-datatable-sm"
                            emptyMessage="Sin resultados."
                            selectionMode="multiple"
                            selection={selectedViaticos}
                            onSelectionChange={(e) => setSelectedViaticos(e.value as Viatico[])}
                            dataKey="id"
                            rowClassName={(data: Viatico) => {
                                const isComplete = data.cuota_zona1 && data.cuota_zona2 && data.cuota_zona3 && data.cuota_fuera_estado;
                                return isComplete ? 'surface-ground' : '';
                            }}
                        >
                            <Column selectionMode="multiple" headerStyle={{ width: '3rem', backgroundColor: '#f8fafc' }}></Column>
                            <Column
                                field="nivel"
                                header="NIVEL"
                                headerStyle={{ textAlign: 'center', whiteSpace: 'nowrap', backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }}
                                style={{ width: '5rem', textAlign: 'center' }}
                            />
                            <Column
                                field="categoria"
                                header="CATEGORÍA / PUESTO"
                                headerStyle={{ textAlign: 'left', whiteSpace: 'nowrap', backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.92rem' }}
                                style={{ minWidth: '16rem' }}
                                className="text-900 font-medium"
                            />
                            <Column
                                header="ZONA 1"
                                headerClassName="justify-content-center text-center"
                                headerStyle={{ textAlign: 'center', whiteSpace: 'nowrap', backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569' }}
                                body={(row) => currencyBody(row.cuota_zona1)}
                                style={{ textAlign: 'center' }}
                            />
                            <Column
                                header="ZONA 2"
                                headerClassName="justify-content-center text-center"
                                headerStyle={{ textAlign: 'center', whiteSpace: 'nowrap', backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569' }}
                                body={(row) => currencyBody(row.cuota_zona2)}
                                style={{ textAlign: 'center' }}
                            />
                            <Column
                                header="ZONA 3"
                                headerClassName="justify-content-center text-center"
                                headerStyle={{ textAlign: 'center', whiteSpace: 'nowrap', backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569' }}
                                body={(row) => currencyBody(row.cuota_zona3)}
                                style={{ textAlign: 'center' }}
                            />
                            <Column
                                header="FUERA DE ESTADO"
                                headerClassName="justify-content-center text-center"
                                headerStyle={{ textAlign: 'center', whiteSpace: 'nowrap', backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569' }}
                                body={(row) => currencyBody(row.cuota_fuera_estado)}
                                style={{ textAlign: 'center' }}
                            />
                            <Column
                                header="INTERNACIONAL"
                                headerClassName="justify-content-center text-center"
                                headerStyle={{ textAlign: 'center', whiteSpace: 'nowrap', backgroundColor: '#f8fafc', fontWeight: 600, color: '#475569' }}
                                body={(row) => currencyBody(row.cuota_internacional, true)}
                                style={{ textAlign: 'center' }}
                            />
                            <Column body={viaticosActionsBody} headerStyle={{ backgroundColor: '#f8fafc' }} style={{ width: '7rem', textAlign: 'center' }} />
                        </DataTable>
                    </div>
                </div>

                {/* ── CATÁLOGO VISUAL DE ZONAS ── */}
                <div className="card shadow-2 border-round-xl border-none p-0 overflow-hidden mb-6">
                    <div className="bg-white p-4 font-bold flex flex-wrap align-items-center justify-content-between border-bottom-1 border-200">
                        <div className="text-xl text-800 flex align-items-center">
                            <i className="pi pi-map mr-2 text-primary"></i> 2. Municipios y Zonas Geográficas
                            <span className="text-base text-600 font-semibold ml-2 bg-blue-50 px-2 py-1 border-round text-primary-dark">(Grado de Marginación)</span>
                        </div>
                        <div className="text-sm font-semibold text-600 bg-gray-50 px-3 py-1 border-round-3xl border-1 border-300 shadow-1 mt-2 md:mt-0">
                            Total: <span className="text-primary">{filteredMuns.length}</span>
                        </div>
                    </div>

                    <div className="p-4 border-bottom-1 border-300 surface-50 flex justify-content-between flex-wrap gap-3">
                        <div className="flex gap-2">
                            <Button label="Nuevo Registro" icon="pi pi-plus" onClick={openNewMunicipio} outlined />
                            <Button label="Reasignar" icon="pi pi-arrow-right-arrow-left" severity="warning" onClick={() => setShowDialogMasiva(true)} />
                        </div>
                        <div className="flex align-items-center gap-2">
                            <span className="p-input-icon-left w-full md:w-20rem">
                                <i className="pi pi-search" />
                                <InputText value={globalFilterMunicipios} onChange={(e) => setGlobalFilterMunicipios(e.target.value)} placeholder="Filtrar municipios..." className="w-full border-round-3xl" />
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-nowrap overflow-x-auto bg-white p-3 gap-3">
                        {/* ZONA 3 - MUY ALTO */}
                        <div className="flex-1 min-w-20rem border-round-xl shadow-2 p-3 flex flex-column bg-pink-50" style={{ border: '1px dashed #fbcfe8' }}>
                            <div className="text-center text-pink-800 mt-0 pt-2 border-bottom-1 border-pink-200 pb-3 mb-3" style={{ borderBottomStyle: 'dashed' }}>
                                <i className="pi pi-circle-fill text-pink-400 mr-2 text-xl opacity-70"></i>
                                <span className="text-2xl font-bold uppercase">ZONA 3</span> <br />
                                <span className="text-sm font-semibold text-pink-600 uppercase tracking-widest mt-1 block opacity-80">MUY ALTO ({munsByZone['ZONA_3'].length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-content-center align-content-start pb-4">
                                {munsByZone['ZONA_3'].map((m) => (
                                    <span
                                        key={m.id}
                                        onClick={() => handleEditMunicipio(m)}
                                        className="bg-white px-3 py-2 text-sm border-round-2xl shadow-1 text-700 cursor-pointer hover:bg-pink-100 hover:text-pink-900 transition-all font-medium flex align-items-center"
                                    >
                                        <span className="text-400 mr-2 text-xs font-bold bg-gray-100 px-2 py-1 border-round">#{m.numero}</span> {m.nombre}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* ZONA 2 - ALTO */}
                        <div className="flex-1 min-w-20rem border-round-xl shadow-2 p-3 flex flex-column bg-orange-50" style={{ border: '1px dashed #fed7aa' }}>
                            <div className="text-center text-orange-800 mt-0 pt-2 border-bottom-1 border-orange-200 pb-3 mb-3" style={{ borderBottomStyle: 'dashed' }}>
                                <i className="pi pi-circle-fill text-orange-400 mr-2 text-xl opacity-70"></i>
                                <span className="text-2xl font-bold uppercase">ZONA 2</span> <br />
                                <span className="text-sm font-semibold text-orange-600 uppercase tracking-widest mt-1 block opacity-80">ALTO ({munsByZone['ZONA_2'].length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-content-center align-content-start pb-4">
                                {munsByZone['ZONA_2'].map((m) => (
                                    <span
                                        key={m.id}
                                        onClick={() => handleEditMunicipio(m)}
                                        className="bg-white px-3 py-2 text-sm border-round-2xl shadow-1 text-700 cursor-pointer hover:bg-orange-100 hover:text-orange-900 transition-all font-medium flex align-items-center"
                                    >
                                        <span className="text-400 mr-2 text-xs font-bold bg-gray-100 px-2 py-1 border-round">#{m.numero}</span> {m.nombre}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* ZONA 1 - MEDIO, BAJO, MUY BAJO */}
                        <div className="flex-1 min-w-20rem border-round-xl shadow-2 p-3 flex flex-column bg-green-50" style={{ border: '1px dashed #bbf7d0' }}>
                            <div className="text-center text-green-800 mt-0 pt-2 border-bottom-1 border-green-200 pb-3 mb-3" style={{ borderBottomStyle: 'dashed' }}>
                                <i className="pi pi-circle-fill text-green-400 mr-2 text-xl opacity-70"></i>
                                <span className="text-2xl font-bold uppercase">ZONA 1</span> <br />
                                <span className="text-sm font-semibold text-green-600 uppercase tracking-widest mt-1 block opacity-80">M, B, MB ({munsByZone['ZONA_1'].length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-content-center align-content-start pb-4">
                                {munsByZone['ZONA_1'].map((m) => (
                                    <span
                                        key={m.id}
                                        onClick={() => handleEditMunicipio(m)}
                                        className="bg-white px-3 py-2 text-sm border-round-2xl shadow-1 text-700 cursor-pointer hover:bg-green-100 hover:text-green-900 transition-all font-medium flex align-items-center"
                                    >
                                        <span className="text-400 mr-2 text-xs font-bold bg-gray-100 px-2 py-1 border-round">#{m.numero}</span> {m.nombre}{' '}
                                        <span className="text-green-500 font-italic font-bold text-xs ml-1">{getAbreviatura(m.subclasificacion_z1)}</span>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* FUERA DEL ESTADO */}
                        <div className="flex-1 min-w-20rem border-round-xl shadow-2 p-3 flex flex-column bg-yellow-50" style={{ border: '1px solid #fef08a' }}>
                            <div className="text-center text-yellow-800 mt-0 pt-2 border-bottom-1 border-yellow-200 pb-3 mb-3">
                                <i className="pi pi-globe text-yellow-500 mr-2 text-xl"></i>
                                <span className="text-2xl font-bold uppercase">EXTERIOR</span> <br />
                                <span className="text-sm font-semibold text-yellow-600 uppercase tracking-widest mt-1 block">FUERA ESTADO ({munsByZone['FUERA_ESTADO'].length})</span>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-content-center align-content-start pb-4">
                                {munsByZone['FUERA_ESTADO'].map((m) => (
                                    <span
                                        key={m.id}
                                        onClick={() => handleEditMunicipio(m)}
                                        className="bg-white px-3 py-2 text-sm border-round-2xl shadow-1 text-700 cursor-pointer hover:bg-yellow-100 hover:text-yellow-900 transition-all font-medium flex align-items-center"
                                    >
                                        {m.nombre}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── DIALOG: REASIGNACIÓN MASIVA ── */}
                <Dialog
                    visible={showDialogMasiva}
                    onHide={() => {
                        setShowDialogMasiva(false);
                        setSelectedReasignacion([]);
                    }}
                    header="Reasignación Masiva entre Zonas"
                    style={{ width: '60rem' }}
                    modal
                >
                    <div className="flex gap-4 p-fluid mt-3 align-items-stretch" style={{ minHeight: '400px' }}>
                        <div className="flex-1 border-1 border-300 border-round p-3 surface-50 flex flex-column">
                            <label className="font-bold mb-2">De la Zona (Origen):</label>
                            <Dropdown
                                value={zonaOrigenFilter}
                                onChange={(e) => {
                                    setZonaOrigenFilter(e.value);
                                    setSelectedReasignacion([]);
                                }}
                                options={[
                                    { label: 'Zona 1', value: 'ZONA_1' },
                                    { label: 'Zona 2', value: 'ZONA_2' },
                                    { label: 'Zona 3', value: 'ZONA_3' },
                                    { label: 'Fuera del Estado', value: 'FUERA_ESTADO' }
                                ]}
                                className="mb-3"
                            />
                            <ListBox
                                value={selectedReasignacion}
                                onChange={(e) => setSelectedReasignacion(e.value)}
                                options={municipiosOrigen}
                                optionLabel="nombre"
                                multiple
                                filter
                                filterPlaceholder="Buscar..."
                                className="flex-grow-1 shadow-2"
                                listStyle={{ minHeight: '300px' }}
                            />
                        </div>
                        <div className="flex flex-column justify-content-center align-items-center px-2 py-4 border-1 border-dashed border-400 border-round surface-0">
                            <span className="text-sm text-500 mb-3 text-center w-8rem font-bold">{selectedReasignacion.length} lugares seleccionados</span>
                            <Button
                                icon="pi pi-angle-double-right"
                                label="Mover"
                                className="mb-2 p-button-warning"
                                iconPos="right"
                                onClick={handleTransfer}
                                loading={saving}
                                disabled={saving || selectedReasignacion.length === 0 || zonaOrigenFilter === zonaDestinoFilter}
                            />
                        </div>
                        <div className="flex-1 border-1 border-300 border-round p-3 surface-50 flex flex-column">
                            <label className="font-bold mb-2">A la Zona (Destino):</label>
                            <Dropdown
                                value={zonaDestinoFilter}
                                onChange={(e) => setZonaDestinoFilter(e.value)}
                                options={[
                                    { label: 'Zona 1', value: 'ZONA_1' },
                                    { label: 'Zona 2', value: 'ZONA_2' },
                                    { label: 'Zona 3', value: 'ZONA_3' },
                                    { label: 'Fuera del Estado', value: 'FUERA_ESTADO' }
                                ]}
                                className="mb-3"
                            />

                            {zonaDestinoFilter === 'ZONA_1' && (
                                <div className="mb-3 p-3 bg-blue-50 border-round border-1 border-blue-200">
                                    <label className="font-semibold text-blue-800 text-sm block mb-2">
                                        <i className="pi pi-filter mr-1"></i>Subclasificación Obligatoria para Z1:
                                    </label>
                                    <Dropdown
                                        value={subclasificacionDestinoTransfer}
                                        onChange={(e) => setSubclasificacionDestinoTransfer(e.value)}
                                        options={[
                                            { label: '(M) Medio', value: 'Medio' },
                                            { label: '(B) Bajo', value: 'Bajo' },
                                            { label: '(MB) Muy Bajo', value: 'Muy Bajo' }
                                        ]}
                                        placeholder="Elige la sub-zona..."
                                        className="w-full"
                                    />
                                </div>
                            )}

                            <ListBox value={null} options={municipiosDestino} optionLabel="nombre" disabled className="flex-grow-1 opacity-80" listStyle={{ minHeight: '300px' }} />
                        </div>
                    </div>
                </Dialog>

                {/* ── DIALOG: FORMULARIO MUNICIPIO ── */}
                <Dialog visible={showDialogMunicipio} onHide={() => setShowDialogMunicipio(false)} header={formMunicipio.id ? 'Editar Registro' : 'Nuevo Registro'} style={{ width: '35rem' }} modal className="p-fluid">
                    <div className="grid pt-3">
                        <div className="field col-12 md:col-4">
                            <label className="font-semibold text-700">Número</label>
                            <InputNumber value={formMunicipio.numero} onValueChange={(e) => setFormMunicipio({ ...formMunicipio, numero: e.value ?? null })} placeholder="#" useGrouping={false} />
                        </div>
                        <div className="field col-12 md:col-8">
                            <label className="font-semibold text-700">
                                {' '}
                                Nombre o Estado <span className="text-red-500">*</span>
                            </label>
                            <InputText value={formMunicipio.nombre} onChange={(e) => setFormMunicipio({ ...formMunicipio, nombre: e.target.value })} placeholder="Ej. Tuxtla, Chiapas..." autoFocus />
                        </div>
                        <div className="field col-12">
                            <label className="font-semibold text-700">Asignación Global</label>
                            <Dropdown
                                value={formMunicipio.clasificacion_zona}
                                onChange={(e) => setFormMunicipio({ ...formMunicipio, clasificacion_zona: e.value })}
                                options={[
                                    { label: 'Zona 1', value: 'ZONA_1' },
                                    { label: 'Zona 2', value: 'ZONA_2' },
                                    { label: 'Zona 3', value: 'ZONA_3' },
                                    { label: 'Fuera del Estado', value: 'FUERA_ESTADO' }
                                ]}
                            />
                        </div>
                        {formMunicipio.clasificacion_zona === 'ZONA_1' && (
                            <div className="field col-12 mt-2 bg-blue-50 p-3 border-round border-1 border-blue-200 fadein">
                                <label className="font-semibold text-blue-800">
                                    <i className="pi pi-filter mr-2"></i>Subclasificación
                                </label>
                                <Dropdown
                                    className="mt-2"
                                    value={formMunicipio.subclasificacion_z1}
                                    onChange={(e) => setFormMunicipio({ ...formMunicipio, subclasificacion_z1: e.value })}
                                    options={[
                                        { label: '(M) Medio', value: 'Medio' },
                                        { label: '(B) Bajo', value: 'Bajo' },
                                        { label: '(MB) Muy Bajo', value: 'Muy Bajo' }
                                    ]}
                                    placeholder="Selecciona el nivel de la Zona 1"
                                    showClear
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-content-between mt-3 pt-3 border-top-1 border-200">
                        {formMunicipio.id ? <Button label="Eliminar" icon="pi pi-trash" outlined severity="danger" onClick={handleDeleteMunicipio} loading={saving} disabled={saving} /> : <div></div>}
                        <div className="flex gap-2">
                            <Button label="Cancelar" icon="pi pi-times" outlined severity="secondary" onClick={() => setShowDialogMunicipio(false)} disabled={saving} />
                            <Button label="Guardar" icon="pi pi-save" onClick={handleSaveMunicipio} loading={saving} disabled={saving} />
                        </div>
                    </div>
                </Dialog>

                {/* ── DIALOG VIATICO ── */}
                <Dialog visible={showDialogViatico} onHide={() => setShowDialogViatico(false)} header={formViatico.id ? 'Editar Tarifas' : 'Nueva Fila'} style={{ width: '45rem' }} modal className="p-fluid">
                    <div className="formgrid grid pt-3">
                        <div className="field col-12 md:col-3">
                            <label className="font-semibold text-700">
                                Nivel <span className="text-red-500">*</span>
                            </label>
                            <InputText value={formViatico.nivel} onChange={(e) => setFormViatico({ ...formViatico, nivel: e.target.value })} placeholder="Ej. A, B..." />
                        </div>
                        <div className="field col-12 md:col-9">
                            <label className="font-semibold text-700">
                                Categoría / Puesto <span className="text-red-500">*</span>
                            </label>
                            <InputText value={formViatico.categoria} onChange={(e) => setFormViatico({ ...formViatico, categoria: e.target.value })} placeholder="Ej. Ejecutivo" autoFocus />
                        </div>
                        <div className="col-12 mt-3 mb-3 border-bottom-1 border-300 pb-2">
                            <h5 className="m-0 text-primary uppercase text-sm">
                                <i className="pi pi-money-bill mr-2"></i>Cuotas Fijas
                            </h5>
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="text-sm text-600 font-semibold uppercase">Zona 1</label>
                            <InputNumber value={formViatico.cuota_zona1 as number} onValueChange={(e) => setFormViatico({ ...formViatico, cuota_zona1: e.value ?? null })} mode="currency" currency="MXN" />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="text-sm text-600 font-semibold uppercase">Zona 2</label>
                            <InputNumber value={formViatico.cuota_zona2 as number} onValueChange={(e) => setFormViatico({ ...formViatico, cuota_zona2: e.value ?? null })} mode="currency" currency="MXN" />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="text-sm text-600 font-semibold uppercase">Zona 3</label>
                            <InputNumber value={formViatico.cuota_zona3 as number} onValueChange={(e) => setFormViatico({ ...formViatico, cuota_zona3: e.value ?? null })} mode="currency" currency="MXN" />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="text-sm text-600 font-semibold uppercase">Fuera del Estado</label>
                            <InputNumber value={formViatico.cuota_fuera_estado as number} onValueChange={(e) => setFormViatico({ ...formViatico, cuota_fuera_estado: e.value ?? null })} mode="currency" currency="MXN" />
                        </div>
                        <div className="field col-12 md:col-6">
                            <div className="flex justify-content-between align-items-center mb-1">
                                <label className="text-sm text-600 font-semibold uppercase">Internacional (USD)</label>
                                <div className="flex align-items-center gap-2">
                                    <span className="text-xs text-500">N/A</span>
                                    <Checkbox onChange={(e) => setFormViatico({ ...formViatico, cuota_internacional: e.checked ? 'N/A' : null })} checked={formViatico.cuota_internacional === 'N/A'} className="p-checkbox-sm" />
                                </div>
                            </div>
                            <InputNumber
                                value={formViatico.cuota_internacional === 'N/A' ? null : formViatico.cuota_internacional}
                                onValueChange={(e) => setFormViatico({ ...formViatico, cuota_internacional: e.value ?? null })}
                                mode="currency"
                                currency="USD"
                                placeholder={formViatico.cuota_internacional === 'N/A' ? 'N/A' : ''}
                                disabled={formViatico.cuota_internacional === 'N/A'}
                            />
                        </div>
                    </div>
                    <div className="flex justify-content-end gap-2 mt-4 pt-4 border-top-1 border-200">
                        <Button label="Cancelar" icon="pi pi-times" outlined severity="secondary" onClick={() => setShowDialogViatico(false)} disabled={saving} />
                        <Button label="Guardar" icon="pi pi-save" onClick={handleSaveViatico} loading={saving} disabled={saving} />
                    </div>
                </Dialog>

                <ImportCatalogDialog
                    visible={showImportDialog}
                    onHide={() => setShowImportDialog(false)}
                    catalogKey="viaticos"
                    catalogTitle="Importar catálogo de Viáticos"
                    onRefresh={loadData}
                    description="Selecciona un archivo CSV, XLS o XLSX para actualizar masivamente las cuotas de viáticos."
                />
            </div>
        </div>
    );
}
