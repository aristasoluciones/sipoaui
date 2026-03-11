import http from '@/src/lib/axios';
import type { Precio, PrecioApi } from '@/types/catalogos';

const API_ENDPOINT = '/api/catalogos/combustibles';

// Transforma la respuesta de la API (snake_case) a tipo frontend (camelCase)
const transformFromApi = (data: PrecioApi): Precio => ({
  id: data.id,
  categoriaPrecioId: data.categoria_precio_id,
  concepto: data.concepto,
  unidadMedida: data.unidad_medida,
  costoTotal: Number(data.costo_total),
  subtipoCombustible: data.subtipo_combustible ?? null,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

// Transforma del tipo frontend (camelCase) al formato que espera la API (snake_case)
const transformToApi = (data: Partial<Precio>): Partial<PrecioApi> => ({
  concepto: data.concepto,
  unidad_medida: data.unidadMedida,
  costo_total: data.costoTotal,
  subtipo_combustible: data.subtipoCombustible ?? undefined,
});

export const CombustiblesService = {
  async create(data: Omit<Precio, 'id' | 'createdAt' | 'updatedAt' | 'categoriaPrecioId'>): Promise<Precio> {
    const response = await http.post<PrecioApi>(API_ENDPOINT, transformToApi(data));
    return transformFromApi(response.data);
  },

  async update(id: number, data: Partial<Precio>): Promise<Precio> {
    const response = await http.put<PrecioApi>(`${API_ENDPOINT}/${id}`, transformToApi(data));
    return transformFromApi(response.data);
  },
};
