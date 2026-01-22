'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import type { Rol } from '@/types/usuarios';

interface DeleteRoleConfirmProps {
  visible: boolean;
  role?: Rol | null;
  onHide: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

const DeleteRoleConfirm: React.FC<DeleteRoleConfirmProps> = ({
  visible,
  role,
  onHide,
  onConfirm,
  loading = false
}) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const userCount = (role as any)?.usuarios?.length || 0;
  const hasUsers = userCount > 0;

  const dialogFooter = (
    <>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={onHide}
        disabled={loading}
      />
      <Button
        label={hasUsers ? "No se puede eliminar" : "Eliminar"}
        icon="pi pi-trash"
        className="p-button-danger"
        onClick={handleConfirm}
        loading={loading}
        disabled={loading || hasUsers}
      />
    </>
  );

  if (!role) return null;

  return (
    <Dialog
      visible={visible}
      style={{ width: '500px' }}
      header="Confirmar eliminación"
      modal
      footer={dialogFooter}
      onHide={onHide}
      blockScroll
    >
      <div className="flex flex-column gap-3">
        {/* Información del rol */}
        <div className="flex align-items-center gap-3 p-3 bg-red-50 border-round">
          <div 
            className="w-3rem h-3rem border-round flex align-items-center justify-content-center text-white"
            style={{ backgroundColor: '#6366f1' }}
          >
            <i className="pi pi-users"></i>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-xl">{role.title}</div>
            <div className="text-color-secondary">ID: {role.id}</div>
          </div>
        </div>

        {/* Advertencias */}
        {hasUsers ? (
          <Message
            severity="error"
            text={`No se puede eliminar este rol porque tiene ${userCount} usuario${userCount > 1 ? 's' : ''} asignado${userCount > 1 ? 's' : ''}.`}
            className="w-full"
          />
        ) : (
          <Message
            severity="warn"
            text="¿Estás seguro que deseas eliminar este rol? Esta acción no se puede deshacer."
            className="w-full"
          />
        )}

        {/* Detalles del rol */}
        <div className="grid">
          <div className="col-6">
            <div className="field">
              <label className="font-semibold text-sm text-color-secondary">Permisos</label>
              <div className="mt-1 flex align-items-center gap-2">
                <Tag value={role.permissions.length} severity="info" />
                <span className="text-sm text-color-secondary">permisos configurados</span>
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="field">
              <label className="font-semibold text-sm text-color-secondary">Usuarios asignados</label>
              <div className="mt-1 flex align-items-center gap-2">
                <Tag 
                  value={userCount} 
                  severity={userCount > 0 ? 'warning' : 'success'} 
                />
                <span className="text-sm text-color-secondary">
                  {userCount === 0 ? 'sin usuarios' : `usuario${userCount > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        {!hasUsers && (
          <div className="p-3 bg-yellow-50 border-round">
            <div className="flex align-items-start gap-2">
              <i className="pi pi-info-circle text-yellow-600 mt-1"></i>
              <div className="flex-1">
                <div className="font-semibold text-yellow-800">Información importante</div>
                <ul className="mt-2 mb-0 pl-3 text-sm text-yellow-700">
                  <li>Se eliminarán todos los permisos asociados al rol</li>
                  <li>Esta acción no afectará a los usuarios existentes</li>
                  <li>El historial de acciones del rol se mantendrá por auditoría</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {hasUsers && (
          <div className="p-3 bg-orange-50 border-round">
            <div className="flex align-items-start gap-2">
              <i className="pi pi-exclamation-triangle text-orange-600 mt-1"></i>
              <div className="flex-1">
                <div className="font-semibold text-orange-800">Para eliminar este rol:</div>
                <ul className="mt-2 mb-0 pl-3 text-sm text-orange-700">
                  <li>Primero reasigna los usuarios a otros roles</li>
                  <li>O desactiva los usuarios que tienen este rol</li>
                  <li>Luego podrás eliminar el rol sin problemas</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default DeleteRoleConfirm;