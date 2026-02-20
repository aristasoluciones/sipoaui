'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Badge } from 'primereact/badge';
import { FilterMatchMode } from 'primereact/api';
import { useAuth } from '@/layout/context/authContext';
import { CatalogoConfig } from '@/types/catalogos';
import { usePermissions } from '@/src/hooks/usePermissions';
import { useNotification } from '@/layout/context/notificationContext';
import { formatApiError } from '@/src/utils';
import http from '@/src/lib/axios';
import * as yup from 'yup';

interface CatalogoManagerProps {
    config: CatalogoConfig;
    data: any[];
    onSave: (item: any) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onRefresh: () => Promise<void>;
}

interface ImportErrorItem {
    row?: number | string;
    field?: string;
    message?: string;
    [key: string]: any;
}

interface ImportResult {
    totalCreated: number;
    totalUpdated: number;
    totalErrors: number;
    errors: ImportErrorItem[];
}

interface ImportPreviewRow {
    rowNumber: number;
    fileRowNumber: number;
    backendRowNumber?: number;
    values: string[];
}

const CatalogoManager: React.FC<CatalogoManagerProps> = ({ config, data, onSave, onDelete, onRefresh }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>(data);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [filters, setFilters] = useState<any>({});
    const [showDialog, setShowDialog] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
    const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
    const [allPreviewRows, setAllPreviewRows] = useState<ImportPreviewRow[]>([]);
    const [validationErrors, setValidationErrors] = useState<any>({});
    const [sortMode, setSortMode] = useState<'datetime' | 'alphabetical'>('datetime');
    const [tableSortField, setTableSortField] = useState<string>('__groupDate');
    const [tableSortOrder, setTableSortOrder] = useState<1 | -1>(-1);
    const toast = useRef<Toast>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // notifications
    const { success: showMsgSuccess, error: showMsgError } = useNotification();

    // Verificar permisos
    const { canAccess } = usePermissions();

    const canCreate = canAccess(config.permissions[0], ['create']);
    const canUpdate = canAccess(config.permissions[0], ['update']);
    const canDelete = canAccess(config.permissions[0], ['delete']);

    // Crear esquema de validación dinámico
    const createValidationSchema = useCallback(() => {
        const schema: any = {};

        config.columns?.forEach((column) => {
            let fieldSchema: any;

            // Validaciones específicas por tipo
            switch (column.type) {
                case 'text':
                case 'textarea':
                    fieldSchema = yup.string();
                    if (column.field === 'codigo') {
                        fieldSchema = fieldSchema.max(20, 'El código no puede tener más de 20 caracteres');
                    }
                    if (column.field === 'nombre') {
                        fieldSchema = fieldSchema.min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede tener más de 100 caracteres');
                    }
                    if (column.field === 'descripcion') {
                        fieldSchema = fieldSchema.max(500, 'La descripción no puede tener más de 500 caracteres');
                    }
                    break;
                case 'number':
                    fieldSchema = yup.number().positive('Debe ser un número positivo');
                    break;
                case 'date':
                    fieldSchema = yup.date().nullable();
                    break;
                case 'select':
                    fieldSchema = yup.mixed();
                    if (column.options) {
                        const validValues = column.options.map((opt: any) => opt.value);
                        fieldSchema = fieldSchema.oneOf(validValues, `Seleccione una opción válida para ${column.header}`);
                    }
                    break;
                default:
                    fieldSchema = yup.mixed();
            }

            // Campos requeridos
            if (['nombre', 'estado', 'codigo'].includes(column.field)) {
                fieldSchema = fieldSchema.required(`${column.header} es requerido`);
            }

            schema[column.field] = fieldSchema;
        });

        return yup.object().shape(schema);
    }, [config.columns]);

    const validationSchema = useMemo(() => createValidationSchema(), [createValidationSchema]);

    const parseItemDate = useCallback((item: any): Date | null => {
        const rawDate =
            item?.updated_at ||
            item?.updatedAt ||
            item?.fechaModificacion ||
            item?.fecha_actualizacion ||
            item?.fechaActualizacion ||
            item?.created_at ||
            item?.createdAt ||
            item?.fechaCreacion;

        if (!rawDate) return null;

        if (rawDate instanceof Date) {
            return Number.isNaN(rawDate.getTime()) ? null : rawDate;
        }

        const value = String(rawDate).trim();
        const normalizedDateTime = value.replace(' ', 'T');
        const parsedDateTime = new Date(normalizedDateTime);
        if (!Number.isNaN(parsedDateTime.getTime())) return parsedDateTime;

        const ymdMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (ymdMatch) {
            const year = Number(ymdMatch[1]);
            const month = Number(ymdMatch[2]) - 1;
            const day = Number(ymdMatch[3]);
            const parsed = new Date(year, month, day);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }, []);

    const getDateGroupKey = useCallback((item: any): string => {
        const date = parseItemDate(item);
        if (!date) return '0000-00-00';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, [parseItemDate]);

    const getDateTimeValue = useCallback((item: any): number => {
        const date = parseItemDate(item);
        return date ? date.getTime() : 0;
    }, [parseItemDate]);

    const formatDateGroupLabel = (groupKey: string): string => {
        if (groupKey === '0000-00-00') return 'Sin fecha';
        const [year, month, day] = groupKey.split('-').map(Number);
        if (!year || !month || !day) return 'Sin fecha';

        const groupDate = new Date(year, month - 1, day);
        const today = new Date();
        const isToday =
            groupDate.getFullYear() === today.getFullYear() &&
            groupDate.getMonth() === today.getMonth() &&
            groupDate.getDate() === today.getDate();

        const formatted = groupDate.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        return isToday ? `Hoy - ${formatted}` : formatted;
    };

    const sortedItems = useMemo(() => {
        return [...items]
            .map((item) => ({
                ...item,
                __groupDate: getDateGroupKey(item),
                __dateTimeValue: getDateTimeValue(item)
            }))
            .sort((a, b) => {
                if (sortMode === 'alphabetical') {
                    const nameA = String(a?.nombre || '').toLocaleLowerCase('es-MX');
                    const nameB = String(b?.nombre || '').toLocaleLowerCase('es-MX');
                    const nameCompare = nameA.localeCompare(nameB, 'es-MX');
                    if (nameCompare !== 0) return nameCompare;
                    return b.__dateTimeValue - a.__dateTimeValue;
                }

                return b.__dateTimeValue - a.__dateTimeValue;
            });
    }, [items, getDateGroupKey, getDateTimeValue, sortMode]);

    useEffect(() => {
        setItems(data);
    }, [data]);

    useEffect(() => {
        // Inicializar filtros
        const initialFilters: any = { global: { value: null, matchMode: FilterMatchMode.CONTAINS } };
        config.columns?.forEach((col) => {
            if (col.filterable) {
                initialFilters[col.field] = { value: null, matchMode: FilterMatchMode.CONTAINS };
            }
        });
        setFilters(initialFilters);
    }, [config.columns]);

    // Redirigir a página personalizada para catálogos específicos
    useEffect(() => {
        if (config.key === 'partidas') {
            router.push('/catalogos/partidas');
        }
    }, [config.key, router]);

    // Validar si el catálogo tiene componente personalizado
    if (config.customComponent) {
        return (
            <div className="card">
                <div className="flex flex-column align-items-center justify-content-center py-8">
                    <i className="pi pi-cog text-6xl text-500 mb-4"></i>
                    <h3 className="text-900 font-semibold mb-3">{config.title}</h3>
                    <p className="text-600 text-center max-w-30rem mb-4">Este catálogo requiere una interfaz especializada y no puede ser gestionado desde esta vista.</p>
                    <p className="text-500 text-sm">Por favor, contacte al administrador del sistema para gestionar este catálogo.</p>
                </div>
            </div>
        );
    }

    // Validar que tenga columnas definidas
    if (!config.columns || config.columns.length === 0) {
        return (
            <div className="card">
                <div className="flex flex-column align-items-center justify-content-center py-8">
                    <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-4"></i>
                    <h3 className="text-900 font-semibold mb-3">Configuración Incompleta</h3>
                    <p className="text-600 text-center max-w-30rem">
                        Este catálogo no tiene columnas configuradas. Verifique la configuración en <code>catalogos.ts</code>.
                    </p>
                </div>
            </div>
        );
    }

    const openNew = () => {
        setEditingItem({
            nombre: '',
            codigo: '',
            descripcion: '',
            estado: 'Activo'
        });
        setValidationErrors({});
        setShowDialog(true);
    };

    const editItem = (item: any) => {
        setEditingItem({ ...item });
        setValidationErrors({});
        setShowDialog(true);
    };

    const hideDialog = () => {
        setShowDialog(false);
        setEditingItem(null);
    };

    const saveItem = async () => {
        try {
            // Validar con yup
            await validationSchema.validate(editingItem, { abortEarly: false });
            setValidationErrors({});

            setSaving(true);
            await onSave(editingItem);
            hideDialog();
            await onRefresh();
            showMsgSuccess('Elemento guardado exitosamente');
        } catch (validationError: any) {
            if (validationError.name === 'ValidationError') {
                // Errores de validación de yup
                const errors: any = {};
                validationError.inner.forEach((err: any) => {
                    errors[err.path] = err.message;
                });
                setValidationErrors(errors);
                showMsgError('Por favor corrija los errores en el formulario');
            } else {
                // Otros errores
                const errorMessage = formatApiError(validationError);
                showMsgError(errorMessage);
            }
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (item: any) => {
        if (window.confirm(`¿Está seguro de eliminar "${item.nombre}"?`)) {
            deleteItem(item);
        }
    };

    const deleteItem = async (item: any) => {
        try {
            setSaving(true);
            await onDelete(item.id);
            await onRefresh();
            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Elemento eliminado',
                life: 3000
            });
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al eliminar el elemento',
                life: 3000
            });
        } finally {
            setSaving(false);
        }
    };

    const deleteSelectedItems = () => {
        if (window.confirm(`¿Está seguro de eliminar ${selectedItems.length} elementos?`)) {
            selectedItems.forEach((item) => deleteItem(item));
            setSelectedItems([]);
        }
    };

    const exportCSV = () => {
        // Implementar exportación a CSV
        const csvData = items.map((item) => {
            const row: any = {};
            config.columns?.forEach((col) => {
                row[col.header] = item[col.field];
            });
            return row;
        });

        // Convertir a CSV y descargar
        const csv = convertToCSV(csvData);
        downloadCSV(csv, `${config.title}.csv`);
    };

    const convertToCSV = (data: any[]) => {
        if (!data.length) return '';

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map((row) => Object.values(row).join(','));
        return [headers, ...rows].join('\n');
    };

    const downloadCSV = (csv: string, filename: string) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRefresh = async () => {
        try {
            setLoading(true);
            await onRefresh();
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al actualizar los datos',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImport = () => {
        setImportFile(null);
        setImportResult(null);
        setPreviewHeaders([]);
        setPreviewRows([]);
        setAllPreviewRows([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowImportDialog(true);
    };

    const hideImportDialog = () => {
        if (importing) return;
        setShowImportDialog(false);
    };

    const getCatalogImportKey = () => {
        const path = (pathname || config.route || '').split('?')[0].split('#')[0];
        const pathKey = path.split('/').filter(Boolean).pop();

        // El backend de importacion valida catalogos con claves canonicas (snake_case),
        // pero algunas rutas del frontend usan kebab-case o nombres distintos.
        // Se normaliza aqui para evitar errores 422 al enviar FormData.
        const importCatalogMap: Record<string, string> = {
            unidades: 'unidades',
            objetivos: 'objetivos',
            politicas: 'politicas',
            programas: 'programas',
            'marco-normativo': 'marcos_normativos',
            'tipos-actividad': 'tipos_actividad',
            entregables: 'entregables',
            beneficiarios: 'beneficiarios'
        };

        const rawKey = pathKey || config.key;
        return importCatalogMap[rawKey] || rawKey;
    };

    const parseCsvRow = (line: string) => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const next = line[i + 1];

            if (char === '"' && inQuotes && next === '"') {
                current += '"';
                i++;
                continue;
            }

            if (char === '"') {
                inQuotes = !inQuotes;
                continue;
            }

            if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
                continue;
            }

            current += char;
        }

        result.push(current.trim());
        return result;
    };

    const loadPreviewFromFile = async (file: File) => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        let rows: string[][] = [];

        if (extension === 'xlsx' || extension === 'xls') {
            const XLSX = await import('xlsx');
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const firstSheet = workbook.Sheets[firstSheetName];
            rows = (XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][]).map((row) => row.map((cell) => String(cell ?? '').trim()));
        } else {
            const content = await file.text();
            rows = content
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => parseCsvRow(line));
        }

        if (!rows.length) {
            setPreviewHeaders([]);
            setPreviewRows([]);
            setAllPreviewRows([]);
            return;
        }

        const headers = rows[0].map((header) => String(header || '').trim());
        const normalizedRows = rows.slice(1).map((row, index) => {
            const dataRowNumber = index + 1;
            const fileRowNumber = index + 2; // Incluye encabezado en fila 1
            return {
                rowNumber: dataRowNumber,
                fileRowNumber,
                values: row.map((value) => String(value ?? '').trim())
            };
        });
        const firstFiveRows = normalizedRows.slice(0, 5);

        setPreviewHeaders(headers);
        setPreviewRows(firstFiveRows);
        setAllPreviewRows(normalizedRows);
    };

    const normalizeImportResult = (payload: any): ImportResult => {
        const extractRowFromMessage = (message: string): number | undefined => {
            const match = message.match(/(?:fila|row|linea|line)\s*[:#-]?\s*(\d+)/i);
            if (!match) return undefined;
            const row = Number(match[1]);
            return Number.isFinite(row) ? row : undefined;
        };

        const toNumberRow = (value: any): number | undefined => {
            const row = Number(value);
            return Number.isFinite(row) ? row : undefined;
        };

        const totalCreated = Number(payload?.total_created ?? payload?.totalCreated ?? 0);
        const totalUpdated = Number(payload?.total_updated ?? payload?.totalUpdated ?? 0);
        const totalErrors = Number(payload?.total_errors ?? payload?.totalErrors ?? 0);
        const rawErrors = payload?.errors;

        let errors: ImportErrorItem[] = [];
        if (Array.isArray(rawErrors)) {
            errors = rawErrors.map((item: any) => {
                if (typeof item === 'string') {
                    return {
                        row: extractRowFromMessage(item),
                        message: item
                    };
                }

                const message = item?.message ?? item?.error ?? JSON.stringify(item);
                const explicitRow = item?.row ?? item?.fila ?? item?.line ?? item?.linea;
                return {
                    row: toNumberRow(explicitRow) ?? extractRowFromMessage(String(message)),
                    field: item?.field ?? item?.campo,
                    message
                };
            });
        } else if (rawErrors && typeof rawErrors === 'object') {
            errors = Object.entries(rawErrors).flatMap(([field, value]) => {
                if (Array.isArray(value)) {
                    return value.map((message: any) => {
                        const msg = String(message);
                        return {
                            field,
                            row: extractRowFromMessage(msg),
                            message: msg
                        };
                    });
                }
                const msg = String(value);
                return [{ field, row: extractRowFromMessage(msg), message: msg }];
            });
        }

        return {
            totalCreated: Number.isFinite(totalCreated) ? totalCreated : 0,
            totalUpdated: Number.isFinite(totalUpdated) ? totalUpdated : 0,
            totalErrors: Number.isFinite(totalErrors) ? totalErrors : errors.length,
            errors
        };
    };

    const executeImport = async () => {
        if (!importFile) {
            showMsgError('Selecciona un archivo para importar');
            return;
        }

        const formData = new FormData();
        formData.append('archivo', importFile);
        formData.append('catalogo', getCatalogImportKey());

        try {
            setImporting(true);
            setImportResult(null);

            const response = await http.post('/api/catalogos/importar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const payload = response?.data ?? response ?? {};
            const normalizedResult = normalizeImportResult(payload);
            setImportResult(normalizedResult);
            await onRefresh();

            if (normalizedResult.totalErrors > 0) {
                showMsgError(`Importacion completada con errores. Creados: ${normalizedResult.totalCreated}, actualizados: ${normalizedResult.totalUpdated}, errores: ${normalizedResult.totalErrors}.`);
            } else {
                showMsgSuccess(`Importacion completada. Creados: ${normalizedResult.totalCreated}, actualizados: ${normalizedResult.totalUpdated}.`);
            }
        } catch (error: any) {
            const payload = error?.response?.data ?? {};
            const normalizedResult = normalizeImportResult(payload);
            const hasStructuredErrors = normalizedResult.errors.length > 0 || normalizedResult.totalErrors > 0;
            if (hasStructuredErrors) {
                setImportResult(normalizedResult);
            }
            const message = formatApiError(error);
            showMsgError(message || 'No fue posible importar el archivo');
        } finally {
            setImporting(false);
        }
    };

    const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const extension = file.name.split('.').pop()?.toLowerCase();
        const validExtensions = ['csv', 'xls', 'xlsx'];

        if (!extension || !validExtensions.includes(extension)) {
            showMsgError('Formato no permitido. Use archivos CSV, XLS o XLSX.');
            event.target.value = '';
            return;
        }

        setImportResult(null);
        setImportFile(file);
        setPreviewHeaders([]);
        setPreviewRows([]);
        setAllPreviewRows([]);

        try {
            await loadPreviewFromFile(file);
        } catch (error) {
            setPreviewHeaders([]);
            setPreviewRows([]);
            showMsgError('No se pudo generar la vista previa del archivo');
        }
    };

    const isHeaderErrorMessage = (message?: string) => {
        if (!message) return false;
        const normalized = message.toLowerCase();
        return (
            normalized.includes('encabezad') ||
            normalized.includes('header') ||
            normalized.includes('estructura requerida') ||
            normalized.includes('columnas obligatorias') ||
            normalized.includes('columnas no permitidas')
        );
    };

    const hasHeaderError = (importResult?.errors || []).some((item) => isHeaderErrorMessage(item.message));

    const backendErrorRows = (importResult?.errors || [])
        .filter((item) => !isHeaderErrorMessage(item.message))
        .map((item) => Number(item.row))
        .filter((row) => Number.isFinite(row) && row > 0);

    const previewByDataRow = new Map(allPreviewRows.map((row) => [row.rowNumber, row]));

    const errorPreviewRows = backendErrorRows
        .map((backendRow) => {
            const baseRow = previewByDataRow.get(backendRow - 1);
            if (!baseRow) return null;
            return {
                ...baseRow,
                backendRowNumber: backendRow
            } as ImportPreviewRow;
        })
        .filter((row): row is ImportPreviewRow => row !== null);

    const mappedErrorRows = new Set(errorPreviewRows.map((row) => row.rowNumber));
    const showErrorRowsPreview = errorPreviewRows.length > 0;
    const displayedPreviewRows = showErrorRowsPreview ? errorPreviewRows : previewRows;

    const statusBodyTemplate = (rowData: any) => {
        const severity = rowData.estado === 'Activo' ? 'success' : 'danger';
        const value = rowData.estado === 'Activo' ? 'Activo' : 'Inactivo';
        return <Badge value={value} severity={severity} />;
    };

    const actionBodyTemplate = (rowData: any) => {
        return (
            <div className="flex gap-2">
                {canUpdate && <Button icon="pi pi-pencil" size="small" severity="success" rounded onClick={() => editItem(rowData)} tooltip="Editar" />}
                {canDelete && <Button icon="pi pi-trash" size="small" severity="danger" rounded onClick={() => confirmDelete(rowData)} tooltip="Eliminar" />}
            </div>
        );
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex gap-2">
                {canCreate && <Button label="Nuevo" icon="pi pi-plus" onClick={openNew} />}
                {canDelete && selectedItems.length > 0 && <Button label="Eliminar Seleccionados" icon="pi pi-trash" severity="danger" onClick={deleteSelectedItems} />}
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <div className="flex gap-2">
                <input ref={fileInputRef} type="file" accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleImportFileChange} />
                <Button label="Importar" icon="pi pi-upload" severity="secondary" tooltip="Importar desde archivo" tooltipOptions={{ position: 'top' }} onClick={handleImport} loading={importing} disabled={importing} />
                <Button label="Exportar" icon="pi pi-download" severity="help" tooltip="Exportar a CSV" tooltipOptions={{ position: 'top' }} onClick={exportCSV} />
                <Button icon="pi pi-refresh" severity="secondary" onClick={handleRefresh} tooltip="Actualizar" tooltipOptions={{ position: 'top' }} />
            </div>
        );
    };

    const header = (
        <div className="flex justify-content-between align-items-center">
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" onInput={(e) => setGlobalFilter((e.target as HTMLInputElement).value)} placeholder="Buscar..." />
            </span>
        </div>
    );

    const rowGroupHeaderTemplate = (rowData: any) => {
        const resetToDefaultSort = () => {
            setSortMode('datetime');
            setTableSortField('__groupDate');
            setTableSortOrder(-1);
        };

        return (
            <div className="date-group-header">
                <div
                    className="date-group-tab"
                    role="button"
                    tabIndex={0}
                    onClick={resetToDefaultSort}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            resetToDefaultSort();
                        }
                    }}
                    title="Ordenar por fecha y hora"
                >
                    <i className="pi pi-calendar mr-2"></i>
                    <span>{formatDateGroupLabel(rowData.__groupDate)}</span>
                </div>
                <div className="date-group-divider" />
            </div>
        );
    };

    const renderFormField = (column: any, value: any, onChange: (value: any) => void, error?: string) => {
        const hasError = !!error;
        const fieldClass = hasError ? 'w-full p-invalid' : 'w-full';

        switch (column.type) {
            case 'select':
                return (
                    <>
                        <Dropdown id={column.field} value={value} showClear options={column.options} onChange={(e) => onChange(e.value)} placeholder={`Seleccionar ${column.header.toLowerCase()}`} className={fieldClass} />
                        {hasError && <small className="p-error block mt-1">{error}</small>}
                    </>
                );
            case 'number':
                return (
                    <>
                        <InputText id={column.field} type="number" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={`Ingrese ${column.header.toLowerCase()}`} className={fieldClass} />
                        {hasError && <small className="p-error block mt-1">{error}</small>}
                    </>
                );
            case 'date':
                return (
                    <>
                        <InputText id={column.field} type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
                        {hasError && <small className="p-error block mt-1">{error}</small>}
                    </>
                );
            case 'textarea':
                return (
                    <>
                        <InputTextarea id={column.field} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={`Ingrese ${column.header.toLowerCase()}`} rows={3} className={fieldClass} />
                        {hasError && <small className="p-error block mt-1">{error}</small>}
                    </>
                );
            default:
                return (
                    <>
                        <InputText id={column.field} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={`Ingrese ${column.header.toLowerCase()}`} className={fieldClass} />
                        {hasError && <small className="p-error block mt-1">{error}</small>}
                    </>
                );
        }
    };

    return (
        <>
            <ConfirmDialog />

            {/* Toolbar separado en card */}
            <div className="card mb-3">
                <div className="flex flex-wrap justify-content-between align-items-center gap-3">
                    <div className="flex align-items-center">{leftToolbarTemplate()}</div>
                    <div className="flex align-items-center">{rightToolbarTemplate()}</div>
                </div>
            </div>

            {/* DataTable en card con p-0 overflow-hidden */}
            <div className="card p-0 overflow-hidden">
                <DataTable
                    value={sortedItems}
                    selection={selectedItems}
                    onSelectionChange={(e) => setSelectedItems(e.value)}
                    onSort={(e: any) => {
                        setTableSortField(e?.sortField || '__groupDate');
                        setTableSortOrder(e?.sortOrder === 1 ? 1 : -1);
                        if (e?.sortField === 'nombre') {
                            setSortMode('alphabetical');
                        }
                    }}
                    dataKey="id"
                    paginator
                    rows={15}
                    rowsPerPageOptions={[5, 15, 25]}
                    className="datatable-responsive catalogo-datatable-grouped"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} elementos"
                    globalFilter={globalFilter}
                    filters={filters}
                    onFilter={(e) => setFilters(e.filters)}
                    header={header}
                    emptyMessage="No se encontraron elementos."
                    loading={loading}
                    rowGroupMode={sortMode === 'datetime' ? 'subheader' : undefined}
                    groupRowsBy={sortMode === 'datetime' ? '__groupDate' : undefined}
                    sortField={tableSortField}
                    sortOrder={tableSortOrder}
                    rowGroupHeaderTemplate={sortMode === 'datetime' ? rowGroupHeaderTemplate : undefined}
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                    {config.columns?.map((col, index) => (
                        <Column
                            key={col.field}
                            field={col.field}
                            header={col.header}
                            sortable={col.sortable}
                            filter={col.filterable}
                            filterPlaceholder={`Buscar por ${col.header.toLowerCase()}`}
                            body={col.field === 'estado' ? statusBodyTemplate : undefined}
                            style={col.type === 'number' ? { textAlign: 'right' } : undefined}
                        />
                    ))}

                    <Column body={actionBodyTemplate} headerStyle={{ width: '8rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} />
                </DataTable>
            </div>

            <Dialog
                visible={showDialog}
                style={{ width: '650px' }}
                header={
                    <div>
                        <span className="text-xl font-semibold">{editingItem?.id ? 'Editar Registro' : 'Nuevo Registro'}</span>
                        <p className="text-600 text-sm mt-2 mb-0">{editingItem?.id ? 'Modifica la información del registro seleccionado' : 'Completa los campos requeridos para crear un nuevo registro'}</p>
                    </div>
                }
                modal
                className="p-fluid"
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined onClick={hideDialog} />
                        <Button label="Guardar" icon="pi pi-check" onClick={saveItem} loading={saving} />
                    </div>
                }
                onHide={hideDialog}
            >
                {editingItem && (
                    <div className="grid p-3">
                        {/* Campos dinámicos del catálogo */}
                        {config.columns
                            ?.filter((col) => col.field !== 'estado')
                            .map((column) => {
                                // Campos de texto largo ocupan toda la fila
                                const isFullWidth = column.type === 'textarea' || column.field === 'descripcion';
                                const colClass = isFullWidth ? 'col-12' : 'col-12 md:col-6';

                                return (
                                    <div key={column.field} className={colClass}>
                                        <label htmlFor={column.field} className="block font-medium text-900 mb-2">
                                            {column.header}
                                            {['nombre', 'codigo'].includes(column.field) && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        {renderFormField(column, editingItem[column.field], (value) => setEditingItem({ ...editingItem, [column.field]: value }), validationErrors[column.field])}
                                    </div>
                                );
                            })}

                        {/* Campo de estado */}
                        <div className="col-12 md:col-6">
                            <label htmlFor="estado" className="block font-medium text-900 mb-2">
                                Estado <span className="text-red-500 ml-1">*</span>
                            </label>
                            <Dropdown
                                id="estado"
                                value={editingItem.estado}
                                options={[
                                    { label: 'Activo', value: 'Activo' },
                                    { label: 'Inactivo', value: 'Inactivo' }
                                ]}
                                onChange={(e) => setEditingItem({ ...editingItem, estado: e.value })}
                                placeholder="Seleccionar estado"
                                className={validationErrors.estado ? 'w-full p-invalid' : 'w-full'}
                            />
                            {validationErrors.estado && <small className="p-error block mt-1">{validationErrors.estado}</small>}
                        </div>

                        {/* Mensaje de campos requeridos */}
                        <div className="col-12">
                            <div className="flex align-items-center gap-2 p-3 bg-blue-50 border-round mt-2">
                                <i className="pi pi-info-circle text-blue-600"></i>
                                <small className="text-600">
                                    Los campos marcados con <span className="text-red-500">*</span> son obligatorios
                                </small>
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>

            <Dialog
                visible={showImportDialog}
                style={{ width: '650px' }}
                header="Importar archivo"
                modal
                onHide={hideImportDialog}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cerrar" icon="pi pi-times" severity="secondary" outlined onClick={hideImportDialog} disabled={importing} />
                        <Button label="Importar" icon="pi pi-check" onClick={executeImport} loading={importing} disabled={!importFile || importing} />
                    </div>
                }
            >
                <div className="flex flex-column gap-3">
                    <p className="m-0 text-600">Selecciona un archivo CSV, XLS o XLSX para importar este catalogo.</p>
                    <div className="flex gap-2 align-items-center">
                        <Button
                            label={importFile ? 'Cambiar archivo' : 'Elegir archivo'}
                            icon="pi pi-file"
                            onClick={() => {
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                    fileInputRef.current.click();
                                }
                            }}
                        />
                        <small className="text-700">{importFile ? importFile.name : 'No hay archivo seleccionado'}</small>
                    </div>

                    {displayedPreviewRows.length > 0 && (
                        <div className="border-1 surface-border border-round-xl p-0 overflow-hidden">
                            <div className="flex align-items-center justify-content-between px-3 py-2 bg-blue-50 border-bottom-1 surface-border">
                                <div className="flex align-items-center gap-2">
                                    <i className="pi pi-table text-blue-600"></i>
                                    <span className="font-semibold text-900">Vista previa</span>
                                </div>
                                <span className={`text-xs px-2 py-1 border-round font-medium ${showErrorRowsPreview ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {showErrorRowsPreview ? `Filas con error (${errorPreviewRows.length})` : 'Primeras 5 filas'}
                                </span>
                            </div>
                            <div className="overflow-auto">
                                <table className="w-full text-sm table-fixed">
                                    <thead>
                                        <tr className={hasHeaderError ? 'bg-red-50' : 'bg-gray-50'}>
                                            <th className={`text-left p-2 border-bottom-1 surface-border w-5rem ${hasHeaderError ? 'text-red-700 font-semibold' : 'text-700'}`}>Fila</th>
                                            {previewHeaders.map((header, idx) => (
                                                <th key={`preview-header-${idx}`} className={`text-left p-2 border-bottom-1 surface-border ${hasHeaderError ? 'text-red-700 font-semibold' : 'text-700'}`}>
                                                    <div className="white-space-nowrap overflow-hidden text-overflow-ellipsis" title={header || `Columna ${idx + 1}`}>
                                                        {header || `Columna ${idx + 1}`}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedPreviewRows.map((row) => {
                                            const hasError = mappedErrorRows.has(row.rowNumber);
                                            const displayedRowNumber = row.backendRowNumber ?? row.rowNumber;
                                            return (
                                                <tr key={`preview-row-${row.rowNumber}`} className={hasError ? 'bg-red-50' : row.rowNumber % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className={`p-2 border-bottom-1 surface-border ${hasError ? 'text-red-700 font-medium' : 'text-700'}`}>
                                                        <span className={`px-2 py-1 border-round text-xs ${hasError ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-700'}`}>{displayedRowNumber}</span>
                                                    </td>
                                                    {previewHeaders.map((_, idx) => (
                                                        <td key={`preview-cell-${row.rowNumber}-${idx}`} className={`p-2 border-bottom-1 surface-border ${hasError ? 'text-red-700' : 'text-800'}`}>
                                                            <div className="white-space-nowrap overflow-hidden text-overflow-ellipsis" title={row.values[idx] || '-'}>
                                                                {row.values[idx] || '-'}
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-3 py-2 bg-gray-50 border-top-1 surface-border">
                                <small className="text-600">
                                    {hasHeaderError
                                        ? 'Se detectaron errores en encabezados (fila 1 del archivo).'
                                        : showErrorRowsPreview
                                          ? 'Mostrando filas con error reportadas por el backend (numeracion original).'
                                          : 'Las filas con error se resaltan en rojo.'}
                                </small>
                            </div>
                        </div>
                    )}

                    {importResult && (
                        <div className={`border-1 border-round p-3 ${importResult.totalErrors > 0 ? 'border-red-300 bg-red-50' : 'surface-border'}`}>
                            <div className="font-semibold mb-2">Resultado</div>
                            <div className="text-sm mb-1">Creados: {importResult.totalCreated}</div>
                            <div className="text-sm mb-1">Actualizados: {importResult.totalUpdated}</div>
                            <div className={`text-sm mb-2 ${importResult.totalErrors > 0 ? 'text-red-700 font-medium' : ''}`}>Errores: {importResult.totalErrors}</div>

                            {importResult.errors.length > 0 && (
                                <div className="max-h-15rem overflow-auto border-top-1 border-red-300 pt-2">
                                    {importResult.errors.map((errorItem, index) => (
                                        <div key={`import-error-${index}`} className="text-sm mb-2 text-red-700">
                                            <span className="font-medium">Error {index + 1}:</span>{' '}
                                            {errorItem.row !== undefined ? `Fila ${errorItem.row}. ` : ''}
                                            {errorItem.field ? `${errorItem.field}: ` : ''}
                                            {errorItem.message || 'Error de validacion'}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Dialog>

            <style jsx global>{`
                .catalogo-datatable-grouped .p-rowgroup-header > td {
                    background: #f8fafc !important;
                    padding: 0.75rem 1rem !important;
                    border-bottom: 0 !important;
                    border-top: 0 !important;
                    text-align: right !important;
                }

                .catalogo-datatable-grouped .date-group-header {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    width: 100%;
                }

                .catalogo-datatable-grouped .date-group-tab {
                    display: inline-flex;
                    align-items: center;
                    background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
                    color: #ffffff;
                    padding: 0.375rem 0.9rem;
                    border-radius: 0.9rem 0.9rem 0.45rem 0.45rem;
                    font-size: 0.85rem;
                    font-weight: 700;
                    letter-spacing: 0.01em;
                    white-space: nowrap;
                    box-shadow: 0 4px 10px rgba(219, 39, 119, 0.28);
                    border: 1px solid #be185d;
                    cursor: pointer;
                    user-select: none;
                }

                .catalogo-datatable-grouped .date-group-tab .pi {
                    font-size: 0.75rem;
                    opacity: 0.95;
                }

                .catalogo-datatable-grouped .date-group-divider {
                    flex: 1;
                    height: 4px;
                    border-radius: 999px;
                    background: linear-gradient(90deg, #f9a8d4 0%, #fce7f3 55%, rgba(252, 231, 243, 0) 100%);
                }
            `}</style>
        </>
    );
};

export default CatalogoManager;
