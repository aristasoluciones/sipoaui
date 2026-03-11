import http from '@/src/lib/axios';
import type { CategoriaPrecio, CategoriaPrecioApi } from '@/types/catalogos';

const API_ENDPOINT = '/api/catalogos/categoria-precios';

const transformFromApi = (data: CategoriaPrecioApi): CategoriaPrecio => ({
  id: data.id,
  nombre: data.nombre,
  partidaId: data.partida_id,
  partida: data.partida ? {
    id: data.partida.id,
    nombre: data.partida.nombre,
    codigo: data.partida.codigo,
    capituloId: data.partida.capitulo_id ?? 0,
    estado: data.partida.estatus ?? 'Activo',
    createdAt: data.partida.created_at ?? '',
    updatedAt: data.partida.updated_at ?? '',
  } : undefined,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const CategoriaPreciosService = {
  async getAll(): Promise<CategoriaPrecio[]> {
    const response = await http.get<CategoriaPrecioApi[]>(API_ENDPOINT);
    return response.data.map(transformFromApi);
  },

  async create(nombre: string, partidaId: number): Promise<CategoriaPrecio> {
    const response = await http.post<CategoriaPrecioApi>(API_ENDPOINT, { nombre, partida_id: partidaId });
    return transformFromApi(response.data);
  },

  async update(id: number, nombre: string, partidaId: number): Promise<CategoriaPrecio> {
    const response = await http.put<CategoriaPrecioApi>(`${API_ENDPOINT}/${id}`, { nombre, partida_id: partidaId });
    return transformFromApi(response.data);
  },

  async delete(id: number): Promise<void> {
    await http.delete(`${API_ENDPOINT}/${id}`);
  },
};
