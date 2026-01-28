'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Observacion } from '@/types/proyectos.d';

interface ObservacionViewerProps {
  visible: boolean;
  onHide: () => void;
  observaciones: Observacion[];
  titulo?: string;
  onGuardarCambios?: (observacionesActualizadas: Observacion[]) => void;
  projectUuid?: string;
  onGetObservaciones?: (projectUuid: string) => Promise<any[]>;
}

const ObservacionViewer: React.FC<ObservacionViewerProps> = ({
  visible,
  onHide,
  observaciones,
  titulo = 'Observaciones',
  onGuardarCambios,
  projectUuid,
  onGetObservaciones
}) => {
  const [observacionesLocales, setObservacionesLocales] = useState<Observacion[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar observaciones desde API cuando se abre el dialog
  useEffect(() => {
    const loadObservaciones = async () => {
      if (visible && projectUuid && onGetObservaciones) {
        setLoading(true);
        try {
          const apiObservaciones = await onGetObservaciones(projectUuid);
          // Mapear la respuesta de la API al formato esperado
          const mappedObservaciones: Observacion[] = apiObservaciones.map((obs: any) => ({
            id: obs.id,
            texto: obs.observacion,
            resuelta: obs.estatus === 'resuelta' || obs.estatus === 'Resuelta', // Asumiendo que el estatus indica si está resuelta
            fechaCreacion: obs.fecha_creacion,
            etapa: obs.etapa,
            observado_por: obs.observado_por,
            estatus: obs.estatus
          }));
          setObservacionesLocales(mappedObservaciones);
        } catch (error) {
          console.error('Error cargando observaciones:', error);
          // Si falla la API, usar las observaciones pasadas por props
          setObservacionesLocales(observaciones);
        } finally {
          setLoading(false);
        }
      }
    };

    loadObservaciones();
  }, [visible, projectUuid, onGetObservaciones, observaciones]);

  const handleResolverObservaciones = () => {
    if (onGuardarCambios) {
      // Pasar todas las observaciones como resueltas
      const observacionesResueltas = observacionesLocales.map(obs => ({
        ...obs,
        resuelta: true
      }));
      onGuardarCambios(observacionesResueltas);
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
        {onGuardarCambios && observacionesPendientes.length > 0 && (
          <Button
            label="Resolver"
            icon="pi pi-check"
            onClick={handleResolverObservaciones}
            disabled={loading}
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
          {loading ? (
            <div className="flex align-items-center justify-content-center p-4">
              <i className="pi pi-spin pi-spinner text-2xl text-primary"></i>
              <span className="ml-2">Cargando observaciones...</span>
            </div>
          ) : (
            <>
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
                            {obs.observado_por && ` - Observado por: ${obs.observado_por}`}
                          </small>
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
                            {obs.observado_por && ` - Observado por: ${obs.observado_por}`}
                          </small>
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
            </>
          )}
        </div>
      </ScrollPanel>
    </Dialog>
  );
};

export default ObservacionViewer;