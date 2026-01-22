'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { TreeNode } from 'primereact/treenode';
import type { Rol, RolFormData, Permiso } from '@/types/usuarios';
import PermissionsTree from '@/src/components/PermissionsTree';

interface RoleFormDialogProps {
  visible: boolean;
  role?: Rol | null;
  onHide: () => void;
  onSave: (formData: RolFormData) => Promise<void>;
  loading?: boolean;
  permissions: Permiso[];
}

const RoleFormDialog: React.FC<RoleFormDialogProps> = ({
  visible,
  role,
  onHide,
  onSave,
  loading = false,
  permissions
}) => {
  const [formData, setFormData] = useState<RolFormData>({
    title: '',
    permissions: []
  });
  const [submitted, setSubmitted] = useState(false);

  // Transformar permisos planos a estructura de árbol simple
  const permissionsTreeData = useMemo((): TreeNode[] => {
    if (!permissions) return [];

    // Función recursiva para construir el árbol basado en parent_id
    const buildTreeNode = (permiso: Permiso): TreeNode => {
      // Encontrar hijos de este permiso
      const children = permissions
        .filter(p => p.parent_id === permiso.id)
        .map(buildTreeNode);

      const node: TreeNode = {
        key: permiso.name,
        label: permiso.title,
        data: {
          permissionId: permiso.id
        }
      };

      // Agregar hijos si existen
      if (children.length > 0) {
        node.children = children;
      }

      return node;
    };

    // Obtener permisos raíz (sin parent_id o parent_id = null)
    const rootPermisos = permissions.filter(p => !p.parent_id);
    const result = rootPermisos.map(buildTreeNode);
    
    console.log('Built permission tree:', result);
    return result;
  }, [permissions]);  // Inicializar formulario cuando se abre o cambia el rol
  useEffect(() => {
    if (visible) {
      if (role) {
        // Editar rol existente
        setFormData({
          title: role.title,
          permissions: role.permissions || []
        });
      } else {
        // Nuevo rol
        setFormData({
          title: '',
          permissions: []
        });
      }
      setSubmitted(false);
    }
  }, [visible, role]);

  const handleSave = async () => {
    setSubmitted(true);

    // Validaciones básicas
    if (!formData.title.trim()) {
      return;
    }

    try {
      await onSave(formData);
      setSubmitted(false);
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleHide = () => {
    setSubmitted(false);
    onHide();
  };

  const handleFieldChange = (field: keyof RolFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const dialogHeader = role ? 'Editar Rol' : 'Nuevo Rol';

  const dialogFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={handleHide}
        disabled={loading}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        onClick={handleSave}
        loading={loading}
        disabled={loading}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '650px', maxHeight: '90vh' }}
      header={
        <div>
          <span className="text-xl font-semibold">
            {role ? 'Editar Rol' : 'Nuevo Rol'}
          </span>
          <p className="text-600 text-sm mt-2 mb-0">
            {role 
              ? 'Modifica el nombre y permisos del rol seleccionado'
              : 'Define un nuevo rol con sus permisos asociados'}
          </p>
        </div>
      }
      modal
      className="p-fluid"
      footer={dialogFooter}
      onHide={handleHide}
      blockScroll
    >
      <div className="grid p-3">
        {/* Título del rol */}
        <div className="col-12">
          <label htmlFor="title" className="block font-medium text-900 mb-2">
            Título del Rol <span className="text-red-500 ml-1">*</span>
          </label>
          <InputText
            id="title"
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Ej: Administrador, Analista, Director..."
            autoFocus
            className={classNames({ 'p-invalid': submitted && !formData.title })}
          />
          {submitted && !formData.title && (
            <small className="p-error block mt-1">El título del rol es requerido</small>
          )}
        </div>

        {/* Permisos */}
        <div className="col-12">
          <label className="block font-medium text-900 mb-2">
            Permisos del Rol
          </label>
          <div className="p-3 border-1 border-300 border-round">
            <PermissionsTree
              selectedPermissions={formData.permissions}
              onPermissionsChange={(permissions: string[]) => handleFieldChange('permissions', permissions)}
              permissionsData={permissionsTreeData}
            />
          </div>
          <div className="flex align-items-center gap-2 mt-2 p-2 bg-blue-50 border-round">
            <i className="pi pi-check-circle text-blue-600"></i>
            <small className="text-600">
              <strong>{formData.permissions?.length || 0}</strong> permisos seleccionados
            </small>
          </div>
        </div>

        <div className="col-12">
          <div className="flex align-items-center gap-2 p-3 bg-blue-50 border-round">
            <i className="pi pi-info-circle text-blue-600"></i>
            <small className="text-600">
              Los usuarios con este rol tendrán acceso solo a las funcionalidades seleccionadas
            </small>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default RoleFormDialog;