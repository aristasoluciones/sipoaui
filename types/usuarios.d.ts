// Tipos para el sistema de usuarios y roles
export interface UsuarioApi {
  uuid: string;
  nombre: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  roles: string[]; // Array de nombres de roles
  unidad?: { id: number , nombre: string } | null; // Puede ser null o un objeto con detalles de la unidad
}

export interface Usuario {
  uuid: string;
  nombre: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  roles: string[];
  unidad?: { id: number , nombre: string } | null;
}

export interface Rol {
  id: number;
  title: string;       // Campo de presentación al usuario
  permissions: string[]; // Array de nombres de permisos (name de Permiso)
  created_at?: string;
  updated_at?: string;
  users_count?: number;  // Opcional: cantidad de usuarios con este rol
}

export interface UsuarioFormData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  roles: string[];
  unidad?: number;
}

export interface UsuarioUpdateData {
  name: string;
  email: string;
  roles: string[];
  unidad?: number;
}

export interface RolFormData {
  title: string;
  permissions: string[];
}

export interface PermisoCategoria {
  id: string;
  nombre: string;
  descripcion: string;
  permisos: Permiso[];
}

export interface Permiso {
  id: number;
  name: string;        // Campo técnico para identificación (ej: "users.create")
  title: string;       // Campo de presentación al usuario (ej: "Crear usuarios")
  parent_id?: number | null;  // ID del permiso padre para jerarquía
  created_at?: string;
  updated_at?: string;
}