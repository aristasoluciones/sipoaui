import http from '@/src/lib/axios';
import type { CategoriaPrecio, CategoriaPrecioApi } from '@/types/catalogos';

const API_ENDPOINT = '/api/catalogos/categoria-precios';

const transformFromApi = (data: CategoriaPrecioApi): CategoriaPrecio => ({
  id: data.id,
  nombre: data.nombre,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const CategoriaPreciosService = {
  async getAll(): Promise<CategoriaPrecio[]> {
    const response = await http.get<CategoriaPrecioApi[]>(API_ENDPOINT);
    return response.data.map(transformFromApi);
  },

  async create(nombre: string): Promise<CategoriaPrecio> {
    const response = await http.post<CategoriaPrecioApi>(API_ENDPOINT, { nombre });
    return transformFromApi(response.data);
  },

  async update(id: number, nombre: string): Promise<CategoriaPrecio> {
    const response = await http.put<CategoriaPrecioApi>(`${API_ENDPOINT}/${id}`, { nombre });
    return transformFromApi(response.data);
  },

  async delete(id: number): Promise<void> {
    await http.delete(`${API_ENDPOINT}/${id}`);
  },
};
