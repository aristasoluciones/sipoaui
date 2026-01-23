import http from '@/src/lib/axios';
import type { Partida, PartidaApi, Estatus } from '@/types/catalogos';

const API_ENDPOINT = '/api/catalogos/partidas';

// Transformadores de datos
const transformFromApi = (data: PartidaApi): Partida => ({
  id: data.id,
  capituloId: data.capitulo_id,
  nombre: data.nombre,
  codigo: data.codigo,
  descripcion: data.descripcion,
  estado: data.estatus,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const transformToApi = (data: Partial<Partida>): Partial<PartidaApi> => ({
  capitulo_id: data.capituloId,
  nombre: data.nombre,
  codigo: data.codigo,
  descripcion: data.descripcion,
  estatus: data.estado,
});

export const PartidasService = {
  async getAll(): Promise<Partida[]> {
    const response = await http.get<PartidaApi[]>(API_ENDPOINT);
    return response.data.map(transformFromApi);
  },

  async getByCapitulo(capituloId: number): Promise<Partida[]> {
    const response = await http.get<PartidaApi[]>(`${API_ENDPOINT}?capitulo_id=${capituloId}`);
    return response.data.map(transformFromApi);
  },

  async getById(id: number): Promise<Partida> {
    const response = await http.get<PartidaApi>(`${API_ENDPOINT}/${id}`);
    return transformFromApi(response.data);
  },

  async create(data: Partial<Partida>): Promise<Partida> {
    const response = await http.post<PartidaApi>(API_ENDPOINT, transformToApi(data));
    return transformFromApi(response.data);
  },

  async update(id: number, data: Partial<Partida>): Promise<Partida> {
    const response = await http.put<PartidaApi>(`${API_ENDPOINT}/${id}`, transformToApi(data));
    return transformFromApi(response.data);
  },

  async delete(id: number): Promise<void> {
    await http.delete(`${API_ENDPOINT}/${id}`);
  },

  async toggleStatus(id: number): Promise<Partida> {
    const response = await http.patch<PartidaApi>(`${API_ENDPOINT}/${id}/toggle-status`);
    return transformFromApi(response.data);
  },
};
