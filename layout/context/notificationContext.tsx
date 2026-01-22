'use client';
import React, { createContext, useContext, useRef } from 'react';
import { Toast } from 'primereact/toast';

/**
 * Contexto de notificaciones para SIPOA
 *
 * Limitaciones de PrimeReact Toast:
 * - No soporta preventOpenDuplicates (propiedad no existe)
 * - clear() solo puede limpiar todas las notificaciones, no específicas por ID
 * - No hay método replace() nativo con ID
 * - Para evitar duplicados, usar la opción sticky o life apropiada
 */

// Tipos específicos y bien definidos
export interface ToastMessage {
  severity: 'success' | 'info' | 'warn' | 'error';
  summary: string;
  detail?: string;
  life?: number;
  sticky?: boolean;
  closable?: boolean;
}

export interface ToastOptions extends Omit<ToastMessage, 'severity'> {
  id?: string;
}

type NotificationContextType = {
  // API simple y consistente
  show: (message: ToastMessage) => void;
  success: (summary: string, detail?: string, options?: Partial<ToastOptions>) => void;
  error: (summary: string, detail?: string, options?: Partial<ToastOptions>) => void;
  info: (summary: string, detail?: string, options?: Partial<ToastOptions>) => void;
  warning: (summary: string, detail?: string, options?: Partial<ToastOptions>) => void;
  
  // Control avanzado (limitado por PrimeReact Toast API)
  clear: () => void; // Solo puede limpiar todas las notificaciones
  replace: (message: ToastMessage) => void; // No soporta ID específico
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const toastRef = useRef<Toast>(null);

  // Configuración global del Toast
  const defaultOptions = {
    life: 3000,
    closable: true,
    position: 'top-right' as const,
  };

  const show = (message: ToastMessage) => {
    const options = { ...defaultOptions, ...message };
    toastRef.current?.show(options);
  };

  // Métodos convenientes con API consistente
  const success = (summary: string, detail?: string, options: Partial<ToastOptions> = {}) => {
    show({
      severity: 'success',
      summary,
      detail,
      ...options
    });
  };

  const error = (summary: string, detail?: string, options: Partial<ToastOptions> = {}) => {
    show({
      severity: 'error',
      summary,
      detail,
      ...options
    });
  };

  const info = (summary: string, detail?: string, options: Partial<ToastOptions> = {}) => {
    show({
      severity: 'info',
      summary,
      detail,
      ...options
    });
  };

  const warning = (summary: string, detail?: string, options: Partial<ToastOptions> = {}) => {
    show({
      severity: 'warn',
      summary,
      detail,
      ...options
    });
  };

  const clear = () => {
    // PrimeReact Toast clear() no acepta argumentos para limpiar notificaciones específicas
    // Solo puede limpiar todas las notificaciones activas
    toastRef.current?.clear();
  };

  const replace = (message: ToastMessage) => {
    // PrimeReact Toast no tiene método replace() nativo con ID
    // Simulamos reemplazando mostrando el nuevo mensaje
    // Nota: Esto puede crear múltiples toasts si no se configura preventDuplicates
    const options = { ...defaultOptions, ...message };
    toastRef.current?.show(options);
  };

  return (
    <NotificationContext.Provider value={{ 
      show,
      success,
      error,
      info,
      warning,
      clear,
      replace
    }}>
      <Toast 
        ref={toastRef} 
        position="top-right"
        baseZIndex={9999}
      />
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

/*
Ejemplos de uso:

// En un componente
const { success, error, info, warning } = useNotification();

// Notificaciones básicas
success('Proyecto guardado', 'Los cambios se aplicaron correctamente');
error('Error de validación', 'El nombre es requerido');

// Con opciones adicionales
success('Operación exitosa', 'Datos actualizados', { life: 5000 });
error('Error crítico', 'Contacte al administrador', { sticky: true });

// Notificación personalizada
const { show } = useNotification();
show({
  severity: 'info',
  summary: 'Información',
  detail: 'Esta es una notificación personalizada',
  life: 3000,
  closable: true
});

// Limpiar notificaciones
const { clear } = useNotification();
clear(); // Limpia todas las notificaciones
*/