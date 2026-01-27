'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';

interface ObservacionDialogProps {
  visible: boolean;
  onHide: () => void;
  onSubmit: (observacion: string) => void;
  isSubmitting?: boolean;
}

const ObservacionDialog: React.FC<ObservacionDialogProps> = ({
  visible,
  onHide,
  onSubmit,
  isSubmitting = false
}) => {
  const [observacion, setObservacion] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!observacion.trim()) {
      setError('La observación es obligatoria');
      return;
    }

    if (observacion.trim().length < 10) {
      setError('La observación debe tener al menos 10 caracteres');
      return;
    }

    onSubmit(observacion);
    setObservacion('');
    setError('');
  };

  const handleCancel = () => {
    setObservacion('');
    setError('');
    onHide();
  };

  const handleHide = () => {
    if (!isSubmitting) {
      handleCancel();
    }
  };

  return (
    <Dialog
      header="Agregar Observación"
      visible={visible}
      onHide={handleHide}
      style={{ width: '600px' }}
      modal
      closable={!isSubmitting}
      footer={
        <div className="flex gap-2 justify-content-end">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            outlined
            severity="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          />
          <Button
            label="Observar"
            icon="pi pi-check"
            severity="warning"
            onClick={handleSubmit}
            loading={isSubmitting}
          />
        </div>
      }
    >
      <div className="flex flex-column gap-3">
        <p className="text-600 m-0">
          Ingrese las observaciones que desea agregar a esta etapa. El proyecto se habilitará para que se realicen las correcciones necesarias.
        </p>
        
        <div className="field">
          <label htmlFor="observacion" className="block font-medium text-900 mb-2">
            Observación *
          </label>
          <InputTextarea
            id="observacion"
            value={observacion}
            onChange={(e) => {
              setObservacion(e.target.value);
              setError('');
            }}
            rows={6}
            className={`w-full ${error ? 'p-invalid' : ''}`}
            placeholder="Escriba aquí las observaciones..."
            disabled={isSubmitting}
            autoFocus
          />
          {error && (
            <small className="p-error block mt-1">{error}</small>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default ObservacionDialog;
