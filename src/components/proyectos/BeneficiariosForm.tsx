'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { BeneficiarioProyecto, ActividadPoaApi, CreateBeneficiarioRequest, UpdateBeneficiarioRequest } from '@/types/proyectos.d';
import { Beneficiario } from '@/types/catalogos';

interface BeneficiariosFormProps {
  visible: boolean;
  onHide: () => void;
  onSave: (data: CreateBeneficiarioRequest | UpdateBeneficiarioRequest, isEdit: boolean) => Promise<void>;
  actividad: ActividadPoaApi | null;
  beneficiarioEdit: BeneficiarioProyecto | null;
  catalogoBeneficiarios: Beneficiario[];
  beneficiariosExistentes: BeneficiarioProyecto[];
  readonly?: boolean;
}

const BeneficiariosForm: React.FC<BeneficiariosFormProps> = ({
  visible,
  onHide,
  onSave,
  actividad,
  beneficiarioEdit,
  catalogoBeneficiarios,
  beneficiariosExistentes,
  readonly = false
}) => {
  const [selectedBeneficiario, setSelectedBeneficiario] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState<number>(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const isEditMode = beneficiarioEdit !== null;

  useEffect(() => {
    if (visible) {
      if (isEditMode && beneficiarioEdit) {
        setSelectedBeneficiario(beneficiarioEdit.beneficiarioId);
        setCantidad(beneficiarioEdit.cantidad);
      } else {
        setSelectedBeneficiario(null);
        setCantidad(0);
      }
      setErrors({});
    }
  }, [visible, beneficiarioEdit, isEditMode]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!isEditMode && !selectedBeneficiario) {
      newErrors.beneficiario = 'Debe seleccionar un tipo de beneficiario';
    }

    if (cantidad < 1) {
      newErrors.cantidad = 'La cantidad debe ser al menos 1';
    }

    // Validar duplicados solo en modo crear
    if (!isEditMode && selectedBeneficiario && actividad) {
      const existeDuplicado = beneficiariosExistentes.some(
        b => b.poaActividadId === actividad.id && b.beneficiarioId === selectedBeneficiario
      );
      if (existeDuplicado) {
        newErrors.beneficiario = 'Este tipo de beneficiario ya está asignado a esta actividad';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!actividad) return;

    setLoading(true);
    try {
      if (isEditMode) {
        const updateData: UpdateBeneficiarioRequest = {
          cantidad
        };
        await onSave(updateData, true);
      } else {
        const createData: CreateBeneficiarioRequest = {
          poa_actividad_id: actividad.id,
          beneficiario_id: selectedBeneficiario!,
          cantidad
        };
        await onSave(createData, false);
      }
      handleClose();
    } catch (error) {
      console.error('Error al guardar beneficiario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedBeneficiario(null);
    setCantidad(0);
    setErrors({});
    onHide();
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cerrar"
        icon="pi pi-times"
        onClick={handleClose}
        className="p-button-text"
        disabled={loading}
      />
      {!readonly && (
        <Button
          label={isEditMode ? 'Actualizar' : 'Agregar'}
          icon="pi pi-check"
          onClick={handleSubmit}
          loading={loading}
          autoFocus
        />
      )}
    </div>
  );

  return (
    <Dialog
      header={isEditMode ? 'Editar Beneficiario' : 'Agregar Beneficiario'}
      visible={visible}
      style={{ width: '500px' }}
      onHide={handleClose}
      footer={footer}
      modal
      draggable={false}
    >
      <div className="flex flex-column gap-3">
        {/* Mostrar nombre de actividad */}
        {actividad && (
          <div className="field">
            <label className="font-semibold block mb-2">Actividad</label>
            <div className="p-3 surface-100 border-round">
              <span className="text-sm">{actividad.descripcion}</span>
            </div>
          </div>
        )}

        {/* Selector de tipo de beneficiario (solo en modo crear) */}
        {!isEditMode && (
          <div className="field">
            <label htmlFor="beneficiario" className="font-semibold block mb-2">
              Tipo de Beneficiario <span className="text-red-500">*</span>
            </label>
            <Dropdown
              id="beneficiario"
              value={selectedBeneficiario}
              options={catalogoBeneficiarios}
              onChange={(e) => setSelectedBeneficiario(e.value)}
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccione un tipo"
              filter
              className={`w-full ${errors.beneficiario ? 'p-invalid' : ''}`}
              emptyMessage="No hay beneficiarios disponibles"
              disabled={readonly}
            />
            {errors.beneficiario && (
              <Message severity="error" text={errors.beneficiario} className="w-full mt-2" />
            )}
          </div>
        )}

        {/* Tipo de beneficiario en modo edición */}
        {isEditMode && beneficiarioEdit && (
          <div className="field">
            <label htmlFor="beneficiario" className="font-semibold block mb-2">
              Tipo de Beneficiario <span className="text-red-500">*</span>
            </label>
            {readonly ? (
              <div className="p-3 surface-100 border-round">
                <span className="text-sm">{beneficiarioEdit.beneficiarioNombre}</span>
              </div>
            ) : (
              <Dropdown
                id="beneficiario"
                value={selectedBeneficiario}
                options={catalogoBeneficiarios}
                onChange={(e) => setSelectedBeneficiario(e.value)}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Seleccione un tipo"
                filter
                className={`w-full ${errors.beneficiario ? 'p-invalid' : ''}`}
                emptyMessage="No hay beneficiarios disponibles"
                disabled={readonly}
              />
            )}
            {errors.beneficiario && (
              <Message severity="error" text={errors.beneficiario} className="w-full mt-2" />
            )}
          </div>
        )}

        {/* Cantidad */}
        <div className="field">
          <label htmlFor="cantidad" className="font-semibold block mb-2">
            Cantidad <span className="text-red-500">*</span>
          </label>
          <InputNumber
            id="cantidad"
            value={cantidad}
            onValueChange={(e) => setCantidad(e.value || 0)}
            min={1}
            showButtons
            buttonLayout="horizontal"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            className={`w-full ${errors.cantidad ? 'p-invalid' : ''}`}
            disabled={readonly}
          />
          {errors.cantidad && (
            <Message severity="error" text={errors.cantidad} className="w-full mt-2" />
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default BeneficiariosForm;
export { BeneficiariosForm };
