'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Badge } from 'primereact/badge';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { Card } from 'primereact/card';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { BreadCrumb } from 'primereact/breadcrumb';
import { classNames } from 'primereact/utils';

// Components
import { PermissionGuard } from '@/src/components/PermissionGuard';
import { PageAccessDenied } from '@/src/components/AccessDeneid';

// Services
import { UsuarioService, RolService } from '@/src/services/usuarios';
import type { Usuario, Rol, UsuarioFormData, UsuarioUpdateData } from '@/types/usuarios';
import { useNotification } from '@/layout/context/notificationContext';
import { usePermissions } from '@/src/hooks/usePermissions';
import { arrayToCamelCase } from '@/src/utils/transformers';
import { unidadesService } from '@/src/services/catalogos.service';


const UsuariosPage = () => {
  const { canCreate,canUpdate,canManage, canDelete } = usePermissions();

  const router = useRouter();

  const accessCreate = canCreate('rolesyusuarios.usuarios');
  const accessEdit = canUpdate('rolesyusuarios.usuarios');
  const accessDelete = canDelete('rolesyusuarios.usuarios');

  const { success, error } = useNotification();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  
  // Estados para el diálogo
  const [userDialog, setUserDialog] = useState(false);
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Función de validación de contraseña
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }
    
    if (!/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  // Estado para el formulario
  const [formData, setFormData] = useState<UsuarioFormData>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    roles: [],
    unidad: 0 
  });

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await UsuarioService.getAll();
      setUsuarios(arrayToCamelCase(data));
    } catch (err) {
      errorRef.current('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const data = await RolService.getAll();
      setRoles(data);
    } catch (_error) {
      errorRef.current('Error loading roles:');
    }
  }, []);

  const loadUnidades = useCallback(async () => {
    try {
      const response = await unidadesService.getAll();
      setUnidades(arrayToCamelCase(response.data || response));
    } catch (_error) {
      errorRef.current('Error loading unidades:');
    }
  }, []);

  // Refs para mantener referencias estables a funciones que pueden cambiar
  const successRef = useRef(success);
  const errorRef = useRef(error);
  const loadUsuariosRef = useRef(loadUsuarios);
  
  // Refs para variables que cambian y afectan los templates
  const rolesRef = useRef(roles);
  const unidadesRef = useRef(unidades);
  const accessEditRef = useRef(accessEdit);
  const accessDeleteRef = useRef(accessDelete);
  const hasLoaded = useRef(false);
  
  // Actualizar refs cuando cambien las funciones
  useEffect(() => {

    successRef.current = success;
    errorRef.current = error;
    loadUsuariosRef.current = loadUsuarios;
    rolesRef.current = roles;
    unidadesRef.current = unidades;
    accessEditRef.current = accessEdit;
    accessDeleteRef.current = accessDelete;
  }, [ roles, unidades, accessEdit, accessDelete]);

  useEffect(() => {
    // Solo ejecutar una vez, ignorando React Strict Mode
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadRoles();
      loadUnidades();
      loadUsuarios();
    }
  }, []); // Dependencias vacías = solo al montar

  

  const openNew = () => {
    // limpiar el uuid
    setUsuario(null);

    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      roles: [],
      unidad: undefined
    });
    setSubmitted(false);
    setUserDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setUserDialog(false);
    setPasswordDialog(false);
  };

  const hideDeleteUserDialog = () => {
    setDeleteUserDialog(false);
  };

  const saveUser = async () => {
    setSubmitted(true);

    // Validaciones básicas
    if (!formData.name.trim() || !formData.email.trim() || !formData.roles || formData.unidad === undefined) {
      return;
    }

    // Validación de contraseña solo para usuarios nuevos
    const isNewUser = !usuario?.uuid;
    if (isNewUser) {
      if (!formData.password.trim()) {
        return;
      }
      
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        return;
      }
      
      if (formData.password !== formData.password_confirmation) {
        return;
      }
    }

    try {
      if (usuario?.uuid) {
        // Actualizar usuario existente (sin contraseña)
        const updateData: UsuarioUpdateData = {
          name: formData.name,
          email: formData.email,
          roles: formData.roles,
          unidad: formData.unidad
        };
        await UsuarioService.update(usuario.uuid, updateData);
        successRef.current('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        await UsuarioService.create(formData);
        successRef.current('Usuario creado correctamente');
      }
      
      loadUsuariosRef.current();
      setUserDialog(false);
      setUsuario(null);
    } catch (err) {
      errorRef.current('Error al guardar usuario');
    }
  };

  // Refs para funciones de manejo de eventos completamente estables
  const editUserRef = useRef((user: Usuario) => {
    setUsuario(user);
    setFormData({
      name: user.nombre,
      email: user.email,
      password: '', // No se muestra en edición
      password_confirmation: '', // No se muestra en edición
      roles: user.roles,
      unidad: user.unidad?.id
    });
    setUserDialog(true);
  });

  const confirmDeleteUserRef = useRef((user: Usuario) => {
    setUsuario(user);
    setDeleteUserDialog(true);
  });

  const openPasswordDialog = useCallback((user: Usuario) => {
    setUsuario(user);
    setNewPassword('');
    setTimeout(() => setPasswordDialog(true), 0);
  },[]);

  const toggleUserStatusRef = useRef(async (user: Usuario) => {
    try {
      await UsuarioService.toggleStatus(user.uuid);
      loadUsuariosRef.current();
      successRef.current(`Usuario ${user.isActive ? 'desactivado' : 'activado'} correctamente`);
    } catch (err) {
      errorRef.current('Error al cambiar estado del usuario');
    }
  });

  // Funciones memoizadas que usan refs - completamente estables
  const editUser = useCallback((user: Usuario) => editUserRef.current(user), []);
  const confirmDeleteUser = useCallback((user: Usuario) => confirmDeleteUserRef.current(user), []);
  //const openPasswordDialog = useCallback((user: Usuario) => openPasswordDialogRef.current(user), []);
  const toggleUserStatus = useCallback((user: Usuario) => toggleUserStatusRef.current(user), []);

  // Funciones async que necesitan acceso a estado actual
  const deleteUser = useCallback(async () => {
    if (usuario) {
      try {
        await UsuarioService.delete(usuario.uuid);
        loadUsuariosRef.current();
        setDeleteUserDialog(false);
        setUsuario(null);
        successRef.current('Usuario eliminado correctamente');
      } catch (err) {
        errorRef.current('Error al eliminar usuario');
      }
    }
  }, [usuario]);

  const changePassword = useCallback(async () => {
    if (usuario && newPassword.trim()) {
      try {
        await UsuarioService.changePassword(usuario.uuid, newPassword);
        setPasswordDialog(false);
        setNewPassword('');
        successRef.current('Contraseña actualizada correctamente');
      } catch (err) {
        errorRef.current('Error al cambiar contraseña');
      }
    }
  }, [usuario, newPassword]);

  // Plantillas para las columnas - usar useCallback para evitar re-renders
  const statusBodyTemplate = useCallback((rowData: Usuario) => {
    return (
      <Tag
        value={rowData.isActive ? 'Activo' : 'Inactivo'}
        severity={rowData.isActive ? 'success' : 'danger'}
        style={{ fontSize: '0.75rem' }}
      />
    );
  }, []);

  const roleBodyTemplate = useCallback((rowData: Usuario) => {
    console.log('Rendering roles for user:', rowData);
    return (

      <div className="flex gap-1">
        {rowData.roles.length > 0 ? rowData.roles.map(roleName => {
          // Buscar el rol en la lista actual de roles usando ref
          const role = rolesRef.current.find((r: any) => r.name === roleName);
          return <Tag style={{ fontSize: '0.75rem' }} key={roleName} value={role ? role.title : 'Desconocido'} />;
        }) : <Tag style={{ fontSize: '0.75rem', backgroundColor: 'var(--gray-600)', color: 'white' }}>Sin rol</Tag>}
      </div>
    );
  }, []); // Sin dependencias - usar refs para acceso a datos

  const dateBodyTemplate = useCallback((date: string | undefined) => {
    return date ? new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }) : '-';
  }, []);

  const actionBodyTemplate = useCallback((rowData: Usuario) => {
    return (
      <div className="flex gap-2">
        {accessEditRef.current && (
          <Button
            icon="pi pi-pencil"
            rounded
            text
            size="small"
            onClick={() => editUser(rowData)}
            tooltip="Editar"
          />
        )}
        {accessEditRef.current && (
          <Button
            icon="pi pi-key"
            rounded
            text
            size="small"
            severity="warning"
            onClick={() => openPasswordDialog(rowData)}
            tooltip="Cambiar contraseña"
          />
        )}
        {accessEditRef.current && (
          <Button
            icon={rowData.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'}
            rounded
            text
            size="small"
            severity={rowData.isActive ? 'warning' : 'success'}
            onClick={() => toggleUserStatus(rowData)}
            tooltip={rowData.isActive ? 'Desactivar' : 'Activar'}
          />
        )}
        {accessDeleteRef.current && rowData.uuid !== '1' && (
          <Button
            icon="pi pi-trash"
            rounded
            text
            size="small"
            severity="danger"
            onClick={() => confirmDeleteUser(rowData)}
            tooltip="Eliminar"
          />
        )}
      </div>
    );
  }, []); // Sin dependencias - usar refs para acceso a permisos

  // Unidades template - usar useCallback
  const unidadBodyTemplate = useCallback((rowData: Usuario) => {
    const unidad = unidadesRef.current.find((u: any) => u.id === rowData.unidad?.id);
    return unidad ? unidad.nombre : 'Sin unidad';
  }, []); // Sin dependencias - usar ref para acceso a unidades

  // Memoizar las opciones del MultiSelect y Dropdown para evitar re-renders
  const roleOptions = useMemo(() => roles, [roles]);
  const unidadOptions = useMemo(() => unidades, [unidades]);

  const leftToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        {accessCreate && (
          <Button
            label="Nuevo Usuario"
            icon="pi pi-plus"
            severity='success'
            onClick={openNew}
          />
        )}
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Buscar usuarios..."
          className="w-20rem"
        />
      </span>
    );
  };

  const userDialogFooter = (
    <>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={hideDialog}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        onClick={saveUser}
      />
    </>
  );

  const deleteUserDialogFooter = (
    <>
      <Button
        label="No"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={hideDeleteUserDialog}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteUser}
      />
    </>
  );

  const home = { icon: 'pi pi-home', command: () => router.push('/') };
  const breadcrumbItems = [
    { label: 'Inicio', command: () => router.push('/') },
    { 
      label: 'Roles y Usuarios', 
      command: () => router.push('/roles'),
      className: 'text-primary font-medium'
    },
    { 
      label: "Usuarios",
      className: 'font-bold text-900'
     },
  ];

  const passwordDialogFooter = (
    <>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={hideDialog}
      />
      <Button
        label="Cambiar"
        icon="pi pi-check"
        onClick={changePassword}
        disabled={!newPassword.trim()}
      />
    </>
  );

  return (
    <>
    <PermissionGuard 
      resource="roles_y_usuarios.usuarios" 
      action="access"
      fallback={<PageAccessDenied />}
      >
      <div className="grid">
      <div className="col-12">
        <BreadCrumb model={breadcrumbItems} home={home} className="mb-4" />
      </div>
      
      {/* Título y descripción del módulo */}
      <div className="col-12">
        <div className="card mb-3">
          <div className="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-3">
            <div className="flex align-items-center gap-3">
              <div className="flex align-items-center justify-content-center bg-blue-100 border-round"
                   style={{ width: '3rem', height: '3rem' }}>
                <i className="pi pi-users text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-900 m-0">Gestión de Usuarios</h2>
                <p className="text-600 m-0 mt-1">Administra los usuarios del sistema, asigna roles y permisos, y controla el acceso a las diferentes funcionalidades</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {accessCreate && (
                <Button
                  label="Nuevo Usuario"
                  icon="pi pi-plus"
                  onClick={openNew}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-12">
        <div className="card p-0 overflow-hidden">
          <ConfirmDialog />

          <DataTable
            value={usuarios}
            loading={loading}
            dataKey="uuid"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            className="datatable-responsive"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
            globalFilter={globalFilter}
            emptyMessage="No se encontraron usuarios"
            responsiveLayout="scroll"
          >
            <Column
              field="nombre"
              header="Nombre"
              sortable
              className="min-w-12rem"
            />
            <Column
              field="email"
              header="Email"
              sortable
              className="min-w-12rem"
            />
            <Column
              field="rol"
              header="Rol de Usuario"
              body={roleBodyTemplate}
              className="min-w-12rem"
            />
            <Column
              field="unidad"
              header="Unidad"
              body={unidadBodyTemplate}
              className="min-w-10rem"
            />
            <Column
              field="isActive"
              header="Estado"
              body={statusBodyTemplate}
              className="min-w-8rem"
            />
            <Column
              field="createdAt"
              header="Fecha Creación"
              body={(rowData) => dateBodyTemplate(rowData.createdAt)}
              sortable
              className="min-w-10rem"
            />
            <Column
              body={actionBodyTemplate}
              header="Acciones"
              className="min-w-12rem"
              exportable={false}
            />
          </DataTable>
        </div>
      </div>
    </div>
    </PermissionGuard>
     <Dialog
            visible={userDialog}
            style={{ width: '550px' }}
            header={
              <div>
                <span className="text-xl font-semibold">
                  {usuario?.uuid ? "Editar Usuario" : "Crear Usuario"}
                </span>
                <p className="text-600 text-sm mt-2 mb-0">
                  {usuario?.uuid 
                    ? 'Actualiza la información del usuario seleccionado'
                    : 'Complete los campos para crear un nuevo usuario en el sistema'}
                </p>
              </div>
            }
            modal
            className="p-fluid"
            footer={userDialogFooter}
            onHide={hideDialog}
          >
            <div className="grid p-3">
              <div className="col-12">
                <label htmlFor="nombre" className="block font-medium text-900 mb-2">
                  Nombre <span className="text-red-500 ml-1">*</span>
                </label>
                <InputText
                  id="nombre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ingrese el nombre completo"
                  required
                  autoFocus
                  className={classNames({ 'p-invalid': submitted && !formData.name })}
                />
                {submitted && !formData.name && 
                  <small className="p-error block mt-1">El nombre es requerido</small>
                }
              </div>

              <div className="col-12">
                <label htmlFor="email" className="block font-medium text-900 mb-2">
                  Correo Electrónico <span className="text-red-500 ml-1">*</span>
                </label>
                <InputText
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                  required
                  className={classNames({ 'p-invalid': submitted && !formData.email })}
                />
                {submitted && !formData.email && 
                  <small className="p-error block mt-1">El correo electrónico es requerido</small>
                }
              </div>

              {!usuario?.uuid && (
                <>
                  <div className="col-12">
                    <label htmlFor="password" className="block font-medium text-900 mb-2">
                      Contraseña <span className="text-red-500 ml-1">*</span>
                    </label>
                    <InputText
                      id="password"
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Ingrese una contraseña segura"
                      required
                      className={classNames({ 'p-invalid': submitted && (!formData.password || !validatePassword(formData.password).isValid) })}
                    />
                    {submitted && !formData.password && 
                      <small className="p-error block mt-1">La contraseña es requerida</small>
                    }
                    {submitted && formData.password && !validatePassword(formData.password).isValid && (
                      <div className="mt-1">
                        {validatePassword(formData.password).errors.map((error, index) => (
                          <small key={index} className="p-error block">{error}</small>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label htmlFor="password_confirmation" className="block font-medium text-900 mb-2">
                      Confirmar Contraseña <span className="text-red-500 ml-1">*</span>
                    </label>
                    <InputText
                      id="password_confirmation"
                      type="password"
                      value={formData.password_confirmation || ''}
                      onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                      placeholder="Confirme la contraseña"
                      required
                      className={classNames({ 'p-invalid': submitted && (!formData.password_confirmation || formData.password !== formData.password_confirmation) })}
                    />
                    {submitted && !formData.password_confirmation && 
                      <small className="p-error block mt-1">La confirmación de contraseña es requerida</small>
                    }
                    {submitted && formData.password_confirmation && formData.password !== formData.password_confirmation && (
                      <small className="p-error block mt-1">Las contraseñas no coinciden</small>
                    )}
                  </div>

                  <div className="col-12">
                    <div className="flex align-items-start gap-2 p-3 bg-amber-50 border-round">
                      <i className="pi pi-info-circle text-amber-600 mt-1"></i>
                      <div>
                        <small className="text-600 block mb-1"><strong>Requisitos de contraseña:</strong></small>
                        <small className="text-600 block">• Mínimo 8 caracteres</small>
                        <small className="text-600 block">• Una mayúscula, minúscula y número</small>
                        <small className="text-600 block">• Un carácter especial (!@#$%...)</small>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="col-12">
                <label htmlFor="rol" className="block font-medium text-900 mb-2">
                  Rol(es) <span className="text-red-500 ml-1">*</span>
                </label>
                <MultiSelect
                  id="rol"
                  filter
                  filterBy="name"
                  value={formData.roles}
                  options={roleOptions}
                  optionLabel="title"
                  optionValue="name"
                  placeholder="Seleccione uno o más roles"
                  onChange={(e) => setFormData({ ...formData, roles: e.value })}
                  required
                  className={classNames({ 'p-invalid': submitted && !formData.roles })}
                />
                {submitted && !formData.roles && 
                  <small className="p-error block mt-1">Debe seleccionar al menos un rol</small>
                }
              </div>

              <div className="col-12">
                <label htmlFor="unidad" className="block font-medium text-900 mb-2">
                  Unidad Responsable <span className="text-red-500 ml-1">*</span>
                </label>
                <Dropdown
                  id="unidad"
                  filter
                  filterBy="nombre"
                  value={formData.unidad}
                  options={unidadOptions}
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Seleccione una unidad"
                  onChange={(e) => setFormData({ ...formData, unidad: e.value })}
                  showClear
                  className={classNames({ 'p-invalid': submitted && formData.unidad === undefined })}
                />
                {submitted && formData.unidad === undefined && 
                  <small className="p-error block mt-1">Debe seleccionar una unidad</small>
                }
              </div>

              <div className="col-12">
                <div className="flex align-items-center gap-2 p-3 bg-blue-50 border-round">
                  <i className="pi pi-info-circle text-blue-600"></i>
                  <small className="text-600">Los campos marcados con <span className="text-red-500">*</span> son obligatorios</small>
                </div>
              </div>
            </div>
     </Dialog>

          {/* Diálogo para cambiar contraseña */}
          <Dialog
            visible={passwordDialog}
            style={{ width: '500px' }}
            header={
              <div>
                <span className="text-xl font-semibold">Cambiar Contraseña</span>
                <p className="text-600 text-sm mt-2 mb-0">
                  Usuario: <strong>{usuario?.nombre}</strong>
                </p>
              </div>
            }
            modal
            className="p-fluid"
            footer={passwordDialogFooter}
            onHide={hideDialog}
          >
            <div className="grid p-3">
              <div className="col-12">
                <label htmlFor="newPassword" className="block font-medium text-900 mb-2">
                  Nueva Contraseña <span className="text-red-500 ml-1">*</span>
                </label>
                <InputText
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingrese la nueva contraseña"
                  className="w-full"
                />
              </div>

              <div className="col-12">
                <div className="flex align-items-start gap-2 p-3 bg-amber-50 border-round">
                  <i className="pi pi-info-circle text-amber-600 mt-1"></i>
                  <div>
                    <small className="text-600 block mb-1"><strong>Requisitos de contraseña:</strong></small>
                    <small className="text-600 block">• Mínimo 8 caracteres</small>
                    <small className="text-600 block">• Una mayúscula, minúscula y número</small>
                    <small className="text-600 block">• Un carácter especial (!@#$%...)</small>
                  </div>
                </div>
              </div>
            </div>
          </Dialog>

          {/* Diálogo de confirmación para eliminar */}
          <Dialog
            visible={deleteUserDialog}
            style={{ width: '500px' }}
            header={
              <span className="text-xl font-semibold">Confirmar Eliminación</span>
            }
            modal
            footer={deleteUserDialogFooter}
            onHide={hideDeleteUserDialog}
          >
            <div className="grid p-3">
              <div className="col-12">
                <div className="flex align-items-start gap-3 p-4 bg-red-50 border-round">
                  <i className="pi pi-exclamation-triangle text-red-600 text-3xl"></i>
                  <div>
                    <p className="text-900 font-semibold mb-2">¿Está seguro de eliminar este usuario?</p>
                    {usuario && (
                      <p className="text-600 mb-0">
                        El usuario <strong className="text-900">{usuario.nombre}</strong> ({usuario.email}) será eliminado permanentemente del sistema.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div className="flex align-items-center gap-2 p-3 bg-amber-50 border-round">
                  <i className="pi pi-info-circle text-amber-600"></i>
                  <small className="text-600">Esta acción no se puede deshacer</small>
                </div>
              </div>
            </div>
          </Dialog>
        </>
  );
};

export default UsuariosPage;