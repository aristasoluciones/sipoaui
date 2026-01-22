import { MOCK_CONFIG, MOCK_USUARIOS, MOCK_ROLES, MOCK_PERMISSIONS, mockUtils } from '@/src/mocks';
import http from '@/src/lib/axios';
import type { UsuarioApi, Rol, UsuarioFormData, UsuarioUpdateData, RolFormData, PermisoCategoria, Permiso } from '@/types/usuarios';

// Servicio para gestión de usuarios
export const UsuarioService = {
  async getAll(): Promise<UsuarioApi[]> {

    const response = await http.get('/api/users');
    return response.data || [];
  },

  async getById(uuid: string): Promise<UsuarioApi> {

    const response = await http.get(`/api/users/${uuid}`);
    return response.data;
  },

  async create(data: UsuarioFormData): Promise<UsuarioApi> {
   
    return await http.post('/api/users', data);
  },

  async update(uuid: string, data: UsuarioUpdateData): Promise<UsuarioApi> {
    
    return await http.patch(`/api/users/${uuid}`, data);
  },

  async delete(uuid: string): Promise<void> {

    return await http.delete(`/api/users/${uuid}`);
  },

  async changePassword(uuid: string, newPassword: string): Promise<void> {
    return await http.post(`/api/users/${uuid}/change-password`, { password: newPassword });
  },

  async toggleStatus(uuid: string): Promise<UsuarioApi> {
 
    return await http.patch(`/api/users/${uuid}/toggle-status`);
  }
};

// Servicio para gestión de roles
export const RolService = {
  async getAll(): Promise<Rol[]> {
  
    const response = await http.get('/api/roles');
    return response.data || [];
  },

  async getById(id: number): Promise<Rol> {
   
    return await http.get(`/api/roles/${id}`);
  },

  async create(data: RolFormData): Promise<Rol> {

    return await http.post('/api/roles', data);
  },

  async update(id: number, data: RolFormData): Promise<Rol> {
    
    return await http.patch(`/api/roles/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    
    return await http.delete(`/api/roles/${id}`);
  },

  async getPermissions(): Promise<Permiso[]> {

    const response = await http.get('/api/permissions');
    return response.data || [];
  }
};