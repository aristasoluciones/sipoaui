'use client';

import { useState, useEffect, useCallback } from 'react';
import { RolService } from '@/src/services/usuarios';
import { useNotification } from '@/layout/context/notificationContext';
import type { Rol, RolFormData, Permiso } from '@/types/usuarios';

interface UseRolesManagementReturn {
  // Estado
  roles: Rol[];
  permissions: Permiso[];
  loading: boolean;
  saving: boolean;
  
  // Dialogs state
  roleDialogVisible: boolean;
  deleteDialogVisible: boolean;
  permissionsViewerVisible: boolean;
  
  // Selected items
  selectedRole: Rol | null;
  roleToDelete: Rol | null;
  roleToViewPermissions: Rol | null;
  
  // Actions
  loadRoles: () => Promise<void>;
  loadPermissions: () => Promise<void>;
  
  // Dialog actions
  showCreateRoleDialog: () => void;
  showEditRoleDialog: (role: Rol) => void;
  showDeleteDialog: (role: Rol) => void;
  showPermissionsViewer: (role: Rol) => void;
  hideAllDialogs: () => void;
  
  // CRUD operations
  handleSaveRole: (formData: RolFormData) => Promise<void>;
  handleDeleteRole: () => Promise<void>;
  
  // Utilities
  refreshData: () => Promise<void>;
}

export const useRolesManagement = (): UseRolesManagementReturn => {
  // Estado principal
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permissions, setPermissions] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados de dialogs
  const [roleDialogVisible, setRoleDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [permissionsViewerVisible, setPermissionsViewerVisible] = useState(false);
  
  // Items seleccionados
  const [selectedRole, setSelectedRole] = useState<Rol | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Rol | null>(null);
  const [roleToViewPermissions, setRoleToViewPermissions] = useState<Rol | null>(null);
  
  const { success, error } = useNotification();

  // Cargar roles
  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const roles = await RolService.getAll();

      setRoles(roles);
    } catch (err) {
      error('Error', 'No se pudieron cargar los roles');
    } finally {
      setLoading(false);
    }
  }, [error]);

  // Cargar permisos
  const loadPermissions = useCallback(async () => {
    try {
      const permissions = await RolService.getPermissions();
      setPermissions(permissions);
    } catch (err) {
      console.error('Error loading permissions:', err);
      error('Error', 'No se pudieron cargar los permisos');
    }
  }, [error]);

  // Inicialización
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        loadRoles(),
        loadPermissions()
      ]);
    };

    initializeData();
  }, [loadRoles, loadPermissions]);

  // Acciones de dialogs
  const showCreateRoleDialog = useCallback(() => {
    setSelectedRole(null);
    setRoleDialogVisible(true);
  }, []);

  const showEditRoleDialog = useCallback((role: Rol) => {
    setSelectedRole(role);
    setRoleDialogVisible(true);
  }, []);

  const showDeleteDialog = useCallback((role: Rol) => {
    setRoleToDelete(role);
    setDeleteDialogVisible(true);
  }, []);

  const showPermissionsViewer = useCallback((role: Rol) => {
    setRoleToViewPermissions(role);
    setPermissionsViewerVisible(true);
  }, []);

  const hideAllDialogs = useCallback(() => {
    setRoleDialogVisible(false);
    setDeleteDialogVisible(false);
    setPermissionsViewerVisible(false);
    setSelectedRole(null);
    setRoleToDelete(null);
    setRoleToViewPermissions(null);
  }, []);

  // Operaciones CRUD
  const handleSaveRole = useCallback(async (formData: RolFormData) => {
    try {
      setSaving(true);
      
      if (selectedRole) {
        // Actualizar rol existente
        await RolService.update(selectedRole.id, formData);
        success('Rol actualizado correctamente');
      } else {
        // Crear nuevo rol
        await RolService.create(formData);
        success('Rol creado correctamente');
      }
      
      // Recargar datos y cerrar dialog
      await loadRoles();
      hideAllDialogs();
      
    } catch (err: any) {
      console.error('Error saving role:', err);
      error('Error al guardar el rol', err?.message);
    } finally {
      setSaving(false);
    }
  }, [selectedRole, success, error, loadRoles, hideAllDialogs]);

  const handleDeleteRole = useCallback(async () => {
    if (!roleToDelete) return;
    
    try {
      setSaving(true);
      await RolService.delete(roleToDelete.id);
      
      success('Rol eliminado correctamente');
      
      // Recargar datos y cerrar dialog
      await loadRoles();
      hideAllDialogs();
      
    } catch (err: any) {
      console.error('Error deleting role:', err);
      error('Error al eliminar el rol', err?.message);
    } finally {
      setSaving(false);
    }
  }, [roleToDelete, success, error, loadRoles, hideAllDialogs]);

  // Utilidades
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadRoles(),
      loadPermissions()
    ]);
  }, [loadRoles, loadPermissions]);

  return {
    // Estado
    roles,
    permissions,
    loading,
    saving,
    
    // Dialog state
    roleDialogVisible,
    deleteDialogVisible,
    permissionsViewerVisible,
    
    // Selected items
    selectedRole,
    roleToDelete,
    roleToViewPermissions,
    
    // Actions
    loadRoles,
    loadPermissions,
    
    // Dialog actions
    showCreateRoleDialog,
    showEditRoleDialog,
    showDeleteDialog,
    showPermissionsViewer,
    hideAllDialogs,
    
    // CRUD operations
    handleSaveRole,
    handleDeleteRole,
    
    // Utilities
    refreshData
  };
};