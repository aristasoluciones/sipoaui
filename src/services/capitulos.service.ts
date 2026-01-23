import http from '@/src/lib/axios';
import type { Capitulo, CapituloApi, Estatus, Partida, PartidaApi } from '@/types/catalogos';

const API_ENDPOINT = '/api/catalogos/capitulos';

// Transformadores de datos
const transformFromApi = (data: CapituloApi): Capitulo => ({
  id: data.id,
  nombre: data.nombre,
  codigo: data.codigo,
  descripcion: data.descripcion,
  estado: data.estatus,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const transformToApi = (data: Partial<Capitulo>): Partial<CapituloApi> => ({
  nombre: data.nombre,
  codigo: data.codigo,
  descripcion: data.descripcion,
  estatus: data.estado,
});

const transformPartidaFromApi = (data: PartidaApi): Partida => ({
  id: data.id,
  capituloId: data.capitulo_id,
  nombre: data.nombre,
  codigo: data.codigo,
  descripcion: data.descripcion,
  estado: data.estatus,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const CapitulosService = {
  async getAll(): Promise<Capitulo[]> {
    const response = await http.get<CapituloApi[]>(API_ENDPOINT);
    return response.data.map(transformFromApi);
  },

  async getById(id: number): Promise<Capitulo> {
    const response = await http.get<CapituloApi>(`${API_ENDPOINT}/${id}`);
    return transformFromApi(response.data);
  },

  async create(data: Partial<Capitulo>): Promise<Capitulo> {
    const response = await http.post<CapituloApi>(API_ENDPOINT, transformToApi(data));
    return transformFromApi(response.data);
  },

  async update(id: number, data: Partial<Capitulo>): Promise<Capitulo> {
    const response = await http.put<CapituloApi>(`${API_ENDPOINT}/${id}`, transformToApi(data));
    return transformFromApi(response.data);
  },

  async delete(id: number): Promise<void> {
    await http.delete(`${API_ENDPOINT}/${id}`);
  },

  async getPartidas(capituloId: number): Promise<Partida[]> {
    const response = await http.get<PartidaApi[]>(`${API_ENDPOINT}/${capituloId}/partidas`);
    return response.data.map(transformPartidaFromApi);
  },

  async toggleStatus(id: number): Promise<Capitulo> {
    const response = await http.patch<CapituloApi>(`${API_ENDPOINT}/${id}/toggle-status`);
    return transformFromApi(response.data);
  },
};
