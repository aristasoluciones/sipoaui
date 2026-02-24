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

const hasValue = (value: unknown): boolean =>
  value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '');

const API_TO_CONFIG_KEY: Record<string, string> = {
  unidades: 'unidades',
  objetivos: 'objetivos',
  objetivos_estrategicos: 'objetivos',
  politicas: 'politicas',
  programas: 'programas',
  marcos_normativos: 'marcoNormativo',
  marco_normativo: 'marcoNormativo',
  'marco-normativo': 'marcoNormativo',
  tipos_actividad: 'tipos-actividad',
  'tipos-actividad': 'tipos-actividad',
  tipos_proyecto: 'tipo-proyecto',
  tipo_proyecto: 'tipo-proyecto',
  'tipo-proyecto': 'tipo-proyecto',
  entregables: 'entregables',
  beneficiarios: 'beneficiarios',
  partidas: 'partidas_presupuestales',
  capitulos_presupuestales: 'partidas_presupuestales',
  partidas_presupuestales: 'partidas_presupuestales',
  rhpf_presupuestales: 'partidas_presupuestales'
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const normalized = value.trim();
  const dmySlash = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const dmyDash = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  const match = dmySlash || dmyDash;
  if (!match) return null;

  const parsed = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const pickLatestDate = (current?: string | null, incoming?: string | null): string | null => {
  if (!current) return incoming ?? null;
  if (!incoming) return current;

  const currentDate = parseDate(current);
  const incomingDate = parseDate(incoming);

  if (currentDate && incomingDate) return incomingDate > currentDate ? incoming : current;
  if (!currentDate && incomingDate) return incoming;
  return current;
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
          const previous = normalized[configKey];
          normalized[configKey] = {
            is_unread: Boolean(previous?.is_unread),
            updated_at: pickLatestDate(previous?.updated_at, value)
          };
          return;
        }

        let isUnreadRaw = false;

        if (hasValue(value?.is_unread)) {
          isUnreadRaw = toBoolean(value?.is_unread);
        } else if (hasValue(value?.unread)) {
          isUnreadRaw = toBoolean(value?.unread);
        } else if (hasValue(value?.is_read)) {
          isUnreadRaw = !toBoolean(value?.is_read);
        } else if (hasValue(value?.read)) {
          isUnreadRaw = !toBoolean(value?.read);
        }

        const updatedAt =
          value?.updated_at ??
          value?.last_updated ??
          value?.fecha_actualizacion ??
          value?.fecha ??
          null;

        const previous = normalized[configKey];
        normalized[configKey] = {
          is_unread: Boolean(previous?.is_unread) || toBoolean(isUnreadRaw),
          updated_at: pickLatestDate(previous?.updated_at, updatedAt)
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
