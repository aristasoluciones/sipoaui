import http from '@/src/lib/axios';

export type CatalogosActualizacionesResponse = Record<string, string>;

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
      const rawData = (response?.data?.data || response?.data || {}) as Record<string, string>;
      const normalized: CatalogosActualizacionesResponse = {};

      Object.entries(rawData).forEach(([apiKey, value]) => {
        const configKey = API_TO_CONFIG_KEY[apiKey] || apiKey;
        normalized[configKey] = value;
      });

      return normalized;
    });
  }
};
