import http from '@/src/lib/axios';

export interface CatalogoActualizacionItem {
  is_unread: boolean;
  updated_at?: string | null;
}

export type CatalogosActualizacionesResponse = Record<string, CatalogoActualizacionItem>;

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === '') return false;
  }
  return false;
};

const API_TO_CONFIG_KEY: Record<string, string> = {
  unidades: 'unidades',
  objetivos: 'objetivos',
  politicas: 'politicas',
  programas: 'programas',
  marcos_normativos: 'marcoNormativo',
  tipos_actividad: 'tipos-actividad',
  tipos_proyecto: 'tipo-proyecto',
  entregables: 'entregables',
  beneficiarios: 'beneficiarios'
};

export const CatalogosActualizacionesService = {
  getAll(): Promise<CatalogosActualizacionesResponse> {
    return http.get('/api/catalogos/actualizaciones').then(response => {
      const rawData = (response?.data?.data || response?.data || response || {}) as Record<
        string,
        string | {
          is_unread?: boolean;
          unread?: boolean | number | string;
          is_read?: boolean | number | string;
          read?: boolean | number | string;
          updated_at?: string | null;
          last_updated?: string | null;
          fecha_actualizacion?: string | null;
          fecha?: string | null;
        }
      >;
      const normalized: CatalogosActualizacionesResponse = {};

      Object.entries(rawData).forEach(([apiKey, value]) => {
        const configKey = API_TO_CONFIG_KEY[apiKey] || apiKey;
        if (typeof value === 'string') {
          normalized[configKey] = {
            is_unread: false,
            updated_at: value
          };
          return;
        }

        const isUnreadRaw =
          value?.is_unread ??
          value?.unread ??
          (value?.is_read !== undefined ? !toBoolean(value?.is_read) : undefined) ??
          (value?.read !== undefined ? !toBoolean(value?.read) : undefined) ??
          false;

        const updatedAt =
          value?.updated_at ??
          value?.last_updated ??
          value?.fecha_actualizacion ??
          value?.fecha ??
          null;

        normalized[configKey] = {
          is_unread: toBoolean(isUnreadRaw),
          updated_at: updatedAt
        };
      });

      return normalized;
    });
  },

  markAsRead(catalogo: string): Promise<void> {
    return http.patch(`/api/catalogos/actualizaciones/${encodeURIComponent(catalogo)}/read`);
  },

  markAllAsRead(): Promise<void> {
    return http.patch('/api/catalogos/actualizaciones/read-all');
  }
};
