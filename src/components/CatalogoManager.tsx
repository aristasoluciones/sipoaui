'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
import * as yup from 'yup';

interface CatalogoManagerProps {
    config: CatalogoConfig;
    data: any[];
    onSave: (item: any) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onRefresh: () => Promise<void>;
}

const CatalogoManager: React.FC<CatalogoManagerProps> = ({ config, data, onSave, onDelete, onRefresh }) => {
    const router = useRouter();
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>(data);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [filters, setFilters] = useState<any>({});
    const [showDialog, setShowDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState<any>({});
    const toast = useRef<Toast>(null);

    const { success: showMsgSuccess, error: showMsgError } = useNotification();
    const { canAccess } = usePermissions();

    const canCreate = canAccess(config.permissions[0], ['create']);
    const canUpdate = canAccess(config.permissions[0], ['update']);
    const canDelete = canAccess(config.permissions[0], ['delete']);

    const createValidationSchema = useCallback(() => {
        const schema: any = {};

        config.columns?.forEach((column) => {
            let fieldSchema: any;

            switch (column.type) {
                case 'text':
                case 'textarea':
                    fieldSchema = yup.string();
                    if (column.field === 'codigo') fieldSchema = fieldSchema.max(20, 'El código no puede tener más de 20 caracteres');
                    if (column.field === 'nombre') fieldSchema = fieldSchema.min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede tener más de 100 caracteres');
                    if (column.field === 'descripcion') fieldSchema = fieldSchema.max(500, 'La descripción no puede tener más de 500 caracteres');
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

            if (['nombre', 'estado', 'codigo'].includes(column.field)) {
                fieldSchema = fieldSchema.required(`${column.header} es requerido`);
            }

            schema[column.field] = fieldSchema;
        });

        return yup.object().shape(schema);
    }, [config.columns]);

    const validationSchema = useMemo(() => createValidationSchema(), [createValidationSchema]);

    useEffect(() => {
        setItems(data);
    }, [data]);

    useEffect(() => {
        const initialFilters: any = { global: { value: null, matchMode: FilterMatchMode.CONTAINS } };
        config.columns?.forEach((col) => {
            if (col.filterable) initialFilters[col.field] = { value: null, matchMode: FilterMatchMode.CONTAINS };
        });
        setFilters(initialFilters);
    }, [config.columns]);

    useEffect(() => {
        if (config.key === 'partidas') router.push('/catalogos/partidas');
    }, [config.key, router]);

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
        setEditingItem({ nombre: '', codigo: '', descripcion: '', estado: 'Activo' });
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
            await validationSchema.validate(editingItem, { abortEarly: false });
            setValidationErrors({});
            setSaving(true);
            await onSave(editingItem); // CatalogoBasePage registra en localStorage aquí
            hideDialog();
            await onRefresh();
            showMsgSuccess('Elemento guardado exitosamente');
        } catch (validationError: any) {
            if (validationError.name === 'ValidationError') {
                const errors: any = {};
                validationError.inner.forEach((err: any) => {
                    errors[err.path] = err.message;
                });
                setValidationErrors(errors);
                showMsgError('Por favor corrija los errores en el formulario');
            } else {
                showMsgError(formatApiError(validationError));
            }
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (item: any) => {
        if (window.confirm(`¿Está seguro de eliminar "${item.nombre}"?`)) deleteItem(item);
    };

    const deleteItem = async (item: any) => {
        try {
            setSaving(true);
            await onDelete(item.id); // CatalogoBasePage registra en localStorage aquí
            await onRefresh();
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Elemento eliminado', life: 3000 });
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al eliminar el elemento', life: 3000 });
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
        const csvData = items.map((item) => {
            const row: any = {};
            config.columns?.forEach((col) => {
                row[col.header] = item[col.field];
            });
            return row;
        });
        const csv = convertToCSV(csvData);
        downloadCSV(csv, `${config.title}.csv`);
    };

    const convertToCSV = (data: any[]) => {
        if (!data.length) return '';
        return [Object.keys(data[0]).join(','), ...data.map((row) => Object.values(row).join(','))].join('\n');
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
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al actualizar los datos', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const statusBodyTemplate = (rowData: any) => {
        const severity = rowData.estado === 'Activo' ? 'success' : 'danger';
        const value = rowData.estado === 'Activo' ? 'Activo' : 'Inactivo';
        return <Badge value={value} severity={severity} />;
    };

    const actionBodyTemplate = (rowData: any) => (
        <div className="flex gap-2">
            {canUpdate && <Button icon="pi pi-pencil" size="small" severity="success" rounded onClick={() => editItem(rowData)} tooltip="Editar" />}
            {canDelete && <Button icon="pi pi-trash" size="small" severity="danger" rounded onClick={() => confirmDelete(rowData)} tooltip="Eliminar" />}
        </div>
    );

    const leftToolbarTemplate = () => (
        <div className="flex gap-2">
            {canCreate && <Button label="Nuevo" icon="pi pi-plus" onClick={openNew} />}
            {canDelete && selectedItems.length > 0 && <Button label="Eliminar Seleccionados" icon="pi pi-trash" severity="danger" onClick={deleteSelectedItems} />}
        </div>
    );

    const rightToolbarTemplate = () => (
        <div className="flex gap-2">
            <Button label="Exportar" icon="pi pi-upload" severity="help" tooltip="Exportar a CSV" tooltipOptions={{ position: 'top' }} onClick={exportCSV} />
            <Button icon="pi pi-refresh" severity="secondary" onClick={handleRefresh} tooltip="Actualizar" tooltipOptions={{ position: 'top' }} />
        </div>
    );

    const header = (
        <div className="flex justify-content-between align-items-center">
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" onInput={(e) => setGlobalFilter((e.target as HTMLInputElement).value)} placeholder="Buscar..." />
            </span>
        </div>
    );

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

            {/* Toolbar */}
            <div className="card mb-3">
                <div className="flex flex-wrap justify-content-between align-items-center gap-3">
                    <div className="flex align-items-center">{leftToolbarTemplate()}</div>
                    <div className="flex align-items-center">{rightToolbarTemplate()}</div>
                </div>
            </div>

            <div className="card p-0 overflow-hidden">
                <DataTable
                    value={items}
                    selection={selectedItems}
                    onSelectionChange={(e) => setSelectedItems(e.value)}
                    dataKey="id"
                    paginator
                    rows={15}
                    rowsPerPageOptions={[5, 15, 25]}
                    className="datatable-responsive"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} elementos"
                    globalFilter={globalFilter}
                    filters={filters}
                    onFilter={(e) => setFilters(e.filters)}
                    header={header}
                    emptyMessage="No se encontraron elementos."
                    loading={loading}
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                    {config.columns?.map((col) => (
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
                        {config.columns
                            ?.filter((col) => col.field !== 'estado')
                            .map((column) => {
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
        </>
    );
};

export default CatalogoManager;
