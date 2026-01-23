'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { Badge } from 'primereact/badge';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useNotification } from '@/layout/context/notificationContext';
import { usePermissions } from '@/src/hooks/usePermissions';
import { CapitulosService } from '@/src/services/capitulos.service';
import { PartidasService } from '@/src/services/partidas.service';
import { Capitulo, Partida } from '@/types/catalogos';
import { formatApiError } from '@/src/utils';

const PartidasPresupuestariasPage = () => {
  const router = useRouter();
  
  // Estados
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [selectedCapitulo, setSelectedCapitulo] = useState<Capitulo | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Dialogs
  const [showCapituloDialog, setShowCapituloDialog] = useState(false);
  const [showPartidaDialog, setShowPartidaDialog] = useState(false);
  const [editingCapitulo, setEditingCapitulo] = useState<Partial<Capitulo> | null>(null);
  const [editingPartida, setEditingPartida] = useState<Partial<Partida> | null>(null);
  
  // Filtros y búsqueda
  const [filterCapitulos, setFilterCapitulos] = useState('');
  const [filterPartidas, setFilterPartidas] = useState('');
  
  // Notificaciones
  const { success, error } = useNotification();
  
  // Permisos
  const { canAccess } = usePermissions();
  const canCreate = canAccess('catalogos.recursos_humanos_presupuestarios_y_financieros.partidas_presupuestarias', ['create']);
  const canUpdate = canAccess('catalogos.recursos_humanos_presupuestarios_y_financieros.partidas_presupuestarias', ['update']);
  const canDelete = canAccess('catalogos.recursos_humanos_presupuestarios_y_financieros.partidas_presupuestarias', ['delete']);

  // Cargar datos iniciales
  useEffect(() => {
    loadCapitulos();
  }, []);

  useEffect(() => {
    if (selectedCapitulo) {
      loadPartidas(selectedCapitulo.id);
    }
  }, [selectedCapitulo]);

  const loadCapitulos = async () => {
    try {
      setLoading(true);
      const data = await CapitulosService.getAll();
      setCapitulos(data || []);
    } catch (err) {
      error(formatApiError(err));
      setCapitulos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPartidas = async (capituloId: number) => {
    try {
      setLoading(true);
      const data = await CapitulosService.getPartidas(capituloId);
      setPartidas(data || []);
    } catch (err) {
      error(formatApiError(err));
      setPartidas([]);
    } finally {
      setLoading(false);
    }
  };

  // ========== CAPÍTULOS ==========
  const openNewCapitulo = () => {
    setEditingCapitulo({ nombre: '', codigo: '', descripcion: '' });
    setShowCapituloDialog(true);
  };

  const editCapitulo = (capitulo: Capitulo) => {
    setEditingCapitulo({ ...capitulo });
    setShowCapituloDialog(true);
  };

  const saveCapitulo = async () => {
    if (!editingCapitulo?.nombre || !editingCapitulo?.codigo) {
      error('Nombre y código son requeridos');
      return;
    }

    try {
      setSaving(true);
      const isEditingSelected = editingCapitulo.id === selectedCapitulo?.id;
      
      if (editingCapitulo.id) {
        await CapitulosService.update(editingCapitulo.id, editingCapitulo);
        success('Capítulo actualizado exitosamente');
        
        // Limpiar selección si se editó el capítulo seleccionado
        if (isEditingSelected) {
          setSelectedCapitulo(null);
          setPartidas([]);
        }
      } else {
        await CapitulosService.create(editingCapitulo);
        success('Capítulo creado exitosamente');
      }
      setShowCapituloDialog(false);
      await loadCapitulos();
    } catch (err) {
      error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteCapitulo = async (capitulo: Capitulo) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el capítulo"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await CapitulosService.delete(capitulo.id);
          success('Capítulo eliminado exitosamente');
          await loadCapitulos();
          if (selectedCapitulo?.id === capitulo.id) {
            setSelectedCapitulo(null);
            setPartidas([]);
          }
        } catch (err) {
          error(formatApiError(err));
        }
      }
    });
  };

  const toggleCapituloStatus = async (capitulo: Capitulo) => {
    try {
      await CapitulosService.toggleStatus(capitulo.id);
      success(`Estado del capítulo ${capitulo.estado === 'Activo' ? 'desactivado' : 'activado'} exitosamente`);
      
      // Limpiar selección si se cambió el estado del capítulo seleccionado
      if (selectedCapitulo?.id === capitulo.id) {
        setSelectedCapitulo(null);
        setPartidas([]);
      }
      
      await loadCapitulos();
    } catch (err) {
      error(formatApiError(err));
    }
  };

  // ========== PARTIDAS ==========
  const openNewPartida = () => {
    if (!selectedCapitulo) {
      error('Seleccione un capítulo primero');
      return;
    }
    setEditingPartida({
      capituloId: selectedCapitulo.id,
      nombre: '',
      codigo: '',
      descripcion: ''
    });
    setShowPartidaDialog(true);
  };

  const editPartida = (partida: Partida) => {
    setEditingPartida({ ...partida });
    setShowPartidaDialog(true);
  };

  const savePartida = async () => {
    if (!editingPartida?.nombre || !editingPartida?.codigo) {
      error('Nombre y código son requeridos');
      return;
    }

    try {
      setSaving(true);
      if (editingPartida.id) {
        await PartidasService.update(editingPartida.id, editingPartida);
        success('Partida actualizada exitosamente');
      } else {
        await PartidasService.create(editingPartida);
        success('Partida creada exitosamente');
      }
      setShowPartidaDialog(false);
      if (selectedCapitulo) {
        await loadPartidas(selectedCapitulo.id);
      }
    } catch (err) {
      error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const deletePartida = async (partida: Partida) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la partida "${partida.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await PartidasService.delete(partida.id);
          success('Partida eliminada exitosamente');
          if (selectedCapitulo) {
            await loadPartidas(selectedCapitulo.id);
          }
        } catch (err) {
          error(formatApiError(err));
        }
      }
    });
  };

  const togglePartidaStatus = async (partida: Partida) => {
    try {
      await PartidasService.toggleStatus(partida.id);
      success(`Estado de la partida ${partida.estado === 'Activo' ? 'desactivado' : 'activado'} exitosamente`);
      if (selectedCapitulo) {
        await loadPartidas(selectedCapitulo.id);
      }
    } catch (err) {
      error(formatApiError(err));
    }
  };

  // Filtered data
  const filteredCapitulos = capitulos.filter((capitulo) => {
    if (!filterCapitulos) return true;
    const searchLower = filterCapitulos.toLowerCase();
    return (
      (capitulo.codigo?.toLowerCase() || '').includes(searchLower) ||
      (capitulo.nombre?.toLowerCase() || '').includes(searchLower)
    );
  });

  const filteredPartidas = partidas.filter((partida) => {
    if (!filterPartidas) return true;
    const searchLower = filterPartidas.toLowerCase();
    return (
      (partida.codigo?.toLowerCase() || '').includes(searchLower) ||
      (partida.nombre?.toLowerCase() || '').includes(searchLower)
    );
  });

  // ========== TEMPLATES ==========
  const statusBodyTemplate = (rowData: any) => {
    if (!rowData) return null;
    const severity = rowData.estado === 'Activo' ? 'success' : 'danger';
    return <Badge value={rowData.estado} severity={severity} />;
  };

  const capituloActionsTemplate = (rowData: Capitulo) => {
    if (!rowData) return null;
    return (
      <div className="flex gap-1">
        {canUpdate && (
          <Button
            icon="pi pi-pencil"
            text
            size="small"
            severity="success"
            onClick={() => editCapitulo(rowData)}
            tooltip="Editar"
          />
        )}
        {canUpdate && (
          <Button
            icon={rowData.estado === 'Activo' ? 'pi pi-eye-slash' : 'pi pi-eye'}
            text
            size="small"
            severity={rowData.estado === 'Activo' ? 'warning' : 'info'}
            onClick={() => toggleCapituloStatus(rowData)}
            tooltip={rowData.estado === 'Activo' ? 'Desactivar' : 'Activar'}
          />
        )}
        {canDelete && (
          <Button
            icon="pi pi-trash"
            text
            size="small"
            severity="danger"
            onClick={() => deleteCapitulo(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  const partidaActionsTemplate = (rowData: Partida) => {
    if (!rowData) return null;
    return (
      <div className="flex gap-1">
        {canUpdate && (
          <Button
            icon="pi pi-pencil"
            text
            size="small"
            severity="success"
            onClick={() => editPartida(rowData)}
            tooltip="Editar"
          />
        )}
        {canUpdate && (
          <Button
            icon={rowData.estado === 'Activo' ? 'pi pi-eye-slash' : 'pi pi-eye'}
            text
            size="small"
            severity={rowData.estado === 'Activo' ? 'warning' : 'info'}
            onClick={() => togglePartidaStatus(rowData)}
            tooltip={rowData.estado === 'Activo' ? 'Desactivar' : 'Activar'}
          />
        )}
        {canDelete && (
          <Button
            icon="pi pi-trash"
            text
            size="small"
            severity="danger"
            onClick={() => deletePartida(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  };

  return (
    <>
      <ConfirmDialog />
      <div className="grid">
      <div className="col-12">
        <div className="card mb-3">
          <div className="flex justify-content-between align-items-start">
            <div className="flex-grow-1">
              <h5 className="m-0">
                <i className="pi pi-calculator mr-2"></i>
                Partidas Presupuestarias
              </h5>
              <p className="text-600 mt-2 mb-0">
                Gestión de capítulos y partidas presupuestarias del sistema
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

      {/* CAPÍTULOS */}
      <div className="col-12 lg:col-6">
        <div className="card p-0 overflow-hidden">
          <DataTable
            value={filteredCapitulos}
            loading={loading}
            dataKey="id"
            paginator
            rows={10}
            selectionMode="single"
            selection={selectedCapitulo!}
            onSelectionChange={(e) => setSelectedCapitulo(e.value || null)}
            emptyMessage="No hay capítulos registrados"
            header={
              <div className="p-3">
                <div className="flex justify-content-between align-items-center mb-3">
                  <h6 className="m-0">Capítulos</h6>
                  <div className="flex gap-2">
                    {canCreate && (
                      <Button
                        label="Nuevo Capítulo"
                        icon="pi pi-plus"
                        size="small"
                        onClick={openNewCapitulo}
                      />
                    )}
                    <Button
                      icon="pi pi-refresh"
                      severity="secondary"
                      size="small"
                      onClick={loadCapitulos}
                      tooltip="Actualizar"
                    />
                  </div>
                </div>
                <div className="flex justify-content-end">
                  <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                      placeholder="Buscar capítulo..."
                      value={filterCapitulos}
                      onChange={(e) => setFilterCapitulos(e.target.value)}
                    />
                  </span>
                </div>
              </div>
            }
          >
            <Column field="codigo" header="Código" sortable style={{ width: '15%' }} />
            <Column field="nombre" header="Nombre" sortable />
            <Column field="estado" header="Estado" body={statusBodyTemplate} sortable style={{ width: '15%' }} />
            <Column body={capituloActionsTemplate} headerStyle={{ width: '8rem' }} bodyStyle={{ textAlign: 'center' }} />
          </DataTable>
        </div>
      </div>

      {/* PARTIDAS */}
      <div className="col-12 lg:col-6">
        {selectedCapitulo ? (
          <div className="card p-0 overflow-hidden">
            <DataTable
              value={filteredPartidas}
              loading={loading}
              dataKey="id"
              paginator
              rows={10}
              emptyMessage="No hay partidas registradas para este capítulo"
              header={
                <div className="p-3 bg-primary-50 border-bottom-1 border-primary-100">
                  <div className="flex justify-content-between align-items-center">
                    <h6 className="m-0 text-primary-700">
                      Partidas del Capítulo: {selectedCapitulo?.codigo} - {selectedCapitulo?.nombre}
                    </h6>
                    <div className="flex gap-2">
                      {canCreate && (
                        <Button
                          label="Nueva Partida"
                          icon="pi pi-plus"
                          size="small"
                          onClick={openNewPartida}
                        />
                      )}
                      <Button
                        icon="pi pi-refresh"
                        severity="secondary"
                        size="small"
                        onClick={() => selectedCapitulo && loadPartidas(selectedCapitulo.id)}
                        tooltip="Actualizar"
                      />
                    </div>
                  </div>
                  <div className="flex justify-content-end mt-3">
                    <span className="p-input-icon-left">
                      <i className="pi pi-search" />
                      <InputText
                        placeholder="Buscar partida..."
                        value={filterPartidas}
                        onChange={(e) => setFilterPartidas(e.target.value)}
                      />
                    </span>
                  </div>
                </div>
              }
            >
              <Column field="codigo" header="Código" sortable style={{ width: '15%' }} />
              <Column field="nombre" header="Nombre" sortable />
              <Column field="estado" header="Estado" body={statusBodyTemplate} sortable style={{ width: '15%' }} />
              <Column body={partidaActionsTemplate} headerStyle={{ width: '8rem' }} bodyStyle={{ textAlign: 'center' }} />
            </DataTable>
          </div>
        ) : (
          <div className="card">
            <div className="flex flex-column align-items-center justify-content-center py-8">
              <i className="pi pi-info-circle text-6xl text-400 mb-4"></i>
              <p className="text-600 text-center">
                Seleccione un capítulo de la lista izquierda para ver sus partidas
              </p>
            </div>
          </div>
        )}
      </div>

      {/* DIALOG CAPÍTULO */}
      <Dialog
        visible={showCapituloDialog}
        style={{ width: '550px' }}
        header={
          <div>
            <span className="text-xl font-semibold">
              {editingCapitulo?.id ? 'Editar Capítulo' : 'Nuevo Capítulo'}
            </span>
            <p className="text-600 text-sm mt-2 mb-0">
              {editingCapitulo?.id 
                ? 'Modifica la información del capítulo'
                : 'Completa los campos para crear un nuevo capítulo'}
            </p>
          </div>
        }
        modal
        className="p-fluid"
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={() => setShowCapituloDialog(false)}
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              onClick={saveCapitulo}
              loading={saving}
            />
          </div>
        }
        onHide={() => setShowCapituloDialog(false)}
      >
        <div className="grid p-3">
          <div className="col-12">
            <label htmlFor="codigo" className="block font-medium text-900 mb-2">
              Código <span className="text-red-500">*</span>
            </label>
            <InputText
              id="codigo"
              value={editingCapitulo?.codigo || ''}
              onChange={(e) => setEditingCapitulo(prev => ({ ...prev!, codigo: e.target.value }))}
              placeholder="Ej: 1000"
            />
          </div>

          <div className="col-12">
            <label htmlFor="nombre" className="block font-medium text-900 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <InputText
              id="nombre"
              value={editingCapitulo?.nombre || ''}
              onChange={(e) => setEditingCapitulo(prev => ({ ...prev!, nombre: e.target.value }))}
              placeholder="Ej: Servicios Personales"
            />
          </div>

          <div className="col-12">
            <label htmlFor="descripcion" className="block font-medium text-900 mb-2">
              Descripción
            </label>
            <InputTextarea
              id="descripcion"
              value={editingCapitulo?.descripcion || ''}
              onChange={(e) => setEditingCapitulo(prev => ({ ...prev!, descripcion: e.target.value }))}
              rows={3}
              placeholder="Descripción del capítulo (opcional)"
            />
          </div>

          <div className="col-12">
            <div className="flex align-items-center gap-2 p-3 bg-blue-50 border-round">
              <i className="pi pi-info-circle text-blue-600"></i>
              <small className="text-600">Los campos marcados con <span className="text-red-500">*</span> son obligatorios</small>
            </div>
          </div>
        </div>
      </Dialog>

      {/* DIALOG PARTIDA */}
      <Dialog
        visible={showPartidaDialog}
        style={{ width: '550px' }}
        header={
          <div>
            <span className="text-xl font-semibold">
              {editingPartida?.id ? 'Editar Partida' : 'Nueva Partida'}
            </span>
            <p className="text-600 text-sm mt-2 mb-0">
              {editingPartida?.id 
                ? 'Modifica la información de la partida'
                : 'Completa los campos para crear una nueva partida'}
            </p>
          </div>
        }
        modal
        className="p-fluid"
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={() => setShowPartidaDialog(false)}
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              onClick={savePartida}
              loading={saving}
            />
          </div>
        }
        onHide={() => setShowPartidaDialog(false)}
      >
        <div className="grid p-3">
          <div className="col-12">
            <label htmlFor="codigo-partida" className="block font-medium text-900 mb-2">
              Código <span className="text-red-500">*</span>
            </label>
            <InputText
              id="codigo-partida"
              value={editingPartida?.codigo || ''}
              onChange={(e) => setEditingPartida(prev => ({ ...prev!, codigo: e.target.value }))}
              placeholder="Ej: 1101"
            />
          </div>

          <div className="col-12">
            <label htmlFor="nombre-partida" className="block font-medium text-900 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <InputText
              id="nombre-partida"
              value={editingPartida?.nombre || ''}
              onChange={(e) => setEditingPartida(prev => ({ ...prev!, nombre: e.target.value }))}
              placeholder="Ej: Sueldos Base"
            />
          </div>

          <div className="col-12">
            <label htmlFor="descripcion-partida" className="block font-medium text-900 mb-2">
              Descripción
            </label>
            <InputTextarea
              id="descripcion-partida"
              value={editingPartida?.descripcion || ''}
              onChange={(e) => setEditingPartida(prev => ({ ...prev!, descripcion: e.target.value }))}
              rows={3}
              placeholder="Descripción de la partida (opcional)"
            />
          </div>

          <div className="col-12">
            <div className="flex align-items-center gap-2 p-3 bg-blue-50 border-round">
              <i className="pi pi-info-circle text-blue-600"></i>
              <small className="text-600">Los campos marcados con <span className="text-red-500">*</span> son obligatorios</small>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
    </>
  );
};

export default PartidasPresupuestariasPage;

