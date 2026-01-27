'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Checkbox } from 'primereact/checkbox';

interface Observacion {
  id: string;
  texto: string;
  resuelta: boolean;
  fechaCreacion: string;
}

interface ObservacionViewerProps {
  visible: boolean;
  onHide: () => void;
  observaciones: Observacion[];
  titulo?: string;
  onGuardarCambios?: (observacionesActualizadas: Observacion[]) => void;
}

const ObservacionViewer: React.FC<ObservacionViewerProps> = ({
  visible,
  onHide,
  observaciones,
  titulo = 'Observaciones',
  onGuardarCambios
}) => {
  const [observacionesLocales, setObservacionesLocales] = useState<Observacion[]>([]);

  // Sincronizar las observaciones cuando cambian las props
  useEffect(() => {
    setObservacionesLocales(observaciones);
  }, [observaciones]);

  const handleObservacionChange = (observacionId: string, resuelta: boolean) => {
    setObservacionesLocales(prev =>
      prev.map(obs =>
        obs.id === observacionId ? { ...obs, resuelta } : obs
      )
    );
  };

  const handleGuardarCambios = () => {
    if (onGuardarCambios) {
      onGuardarCambios(observacionesLocales);
    }
    onHide();
  };

  const observacionesPendientes = observacionesLocales.filter(obs => !obs.resuelta);
  const observacionesResueltas = observacionesLocales.filter(obs => obs.resuelta);
  const header = () => (
    <div className="flex align-items-center gap-2">
      <i className="pi pi-exclamation-triangle text-warning text-xl"></i>
      <h5 className="m-0 text-xl font-semibold text-warning-800">
        {titulo}
      </h5>
    </div>
  );

  const footer = () => (
    <div className="flex justify-content-between align-items-center">
      <div className="text-sm text-600">
        {observacionesPendientes.length} pendiente{observacionesPendientes.length !== 1 ? 's' : ''}, {observacionesResueltas.length} resuelta{observacionesResueltas.length !== 1 ? 's' : ''}
      </div>
      <div className="flex gap-2">
        <Button
          label="Cerrar"
          icon="pi pi-times"
          outlined
          onClick={onHide}
        />
        {onGuardarCambios && (
          <Button
            label="Guardar Cambios"
            icon="pi pi-check"
            onClick={handleGuardarCambios}
            disabled={observacionesLocales.every(obs => obs.resuelta === observaciones.find(o => o.id === obs.id)?.resuelta)}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={header}
      footer={footer}
      className="w-full md:w-6 lg:w-4"
      modal
      draggable={false}
      resizable={false}
    >
      <ScrollPanel style={{ height: '500px' }} className="custom-scrollbar">
        <div className="p-3">
          {/* Observaciones Pendientes */}
          {observacionesPendientes.length > 0 && (
            <div className="mb-4">
              <h6 className="text-orange-800 font-semibold m-0 mb-3 flex align-items-center gap-2">
                <i className="pi pi-exclamation-triangle text-orange-600"></i>
                Observaciones Pendientes ({observacionesPendientes.length})
              </h6>
              <div className="space-y-3">
                {observacionesPendientes.map((obs) => (
                  <div key={obs.id} className="bg-orange-50 border-1 border-orange-200 border-round p-3">
                    <div className="flex align-items-start gap-3">
                      <Checkbox
                        inputId={`obs-${obs.id}`}
                        checked={obs.resuelta}
                        onChange={(e) => handleObservacionChange(obs.id, e.checked || false)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-orange-700 m-0 whitespace-pre-line">
                          {obs.texto}
                        </p>
                        <small className="text-orange-600 block mt-2">
                          {new Date(obs.fechaCreacion).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observaciones Resueltas */}
          {observacionesResueltas.length > 0 && (
            <div>
              <h6 className="text-green-800 font-semibold m-0 mb-3 flex align-items-center gap-2">
                <i className="pi pi-check-circle text-green-600"></i>
                Observaciones Resueltas ({observacionesResueltas.length})
              </h6>
              <div className="space-y-3">
                {observacionesResueltas.map((obs) => (
                  <div key={obs.id} className="bg-green-50 border-1 border-green-200 border-round p-3 opacity-75">
                    <div className="flex align-items-start gap-3">
                      <Checkbox
                        inputId={`obs-${obs.id}`}
                        checked={obs.resuelta}
                        onChange={(e) => handleObservacionChange(obs.id, e.checked || false)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-green-700 m-0 whitespace-pre-line line-through">
                          {obs.texto}
                        </p>
                        <small className="text-green-600 block mt-2">
                          Resuelta - {new Date(obs.fechaCreacion).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay observaciones */}
          {observacionesLocales.length === 0 && (
            <div className="bg-green-50 border-1 border-green-200 border-round p-4 text-center">
              <i className="pi pi-check-circle text-green-600 text-2xl mb-2 block"></i>
              <p className="text-green-700 m-0 font-medium">No hay observaciones registradas</p>
              <small className="text-green-600">Esta etapa no tiene observaciones pendientes</small>
            </div>
          )}
        </div>
      </ScrollPanel>
    </Dialog>
  );
};

export default ObservacionViewer;