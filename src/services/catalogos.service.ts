import { MOCK_CONFIG, MOCK_CATALOGOS, mockUtils } from '@/src/mocks';
import http from '@/src/lib/axios';
import { CATALOGOS_CONFIG } from '@/src/config/catalogos';

export class CatalogoService {
  private catalogoKey: string;
  private apiEndpoint: string;

  constructor(catalogoKey: string) {
    this.catalogoKey = catalogoKey;

    const config = CATALOGOS_CONFIG.find(c => c.key === catalogoKey);
    this.apiEndpoint = config?.apiEndpoint || `/api/catalogos/${this.catalogoKey}`;
  }

  private shouldUseMocks(): boolean {
    // Catalogos siempre usan API real
    return false;
  }

  private getApiEndpoint() {
    return this.apiEndpoint;
  }

  private getMockData() {
    const mockKey = this.catalogoKey === 'marcoNormativo' ? 'marcoNormativo' : this.catalogoKey;
    return (MOCK_CATALOGOS as any)[mockKey] || [];
  }

  async getAll() {
    return await http.get(this.getApiEndpoint()).then(response => response.data);
  }

  async getById(id: number) {
    if (this.shouldUseMocks()) {
      await mockUtils.delay();
      const data = this.getMockData();
      const item = data.find((item: any) => item.id === id);
      if (item) {
        return mockUtils.mockResponse(item);
      } else {
        throw new Error('Elemento no encontrado');
      }
    }

    return await http.get(`${this.getApiEndpoint()}/${id}`);
  }

  async create(data: any) {
    if (this.shouldUseMocks()) {
      await mockUtils.delay();
      const mockData = this.getMockData();
      const newItem = {
        ...data,
        id: Math.max(...mockData.map((item: any) => item.id), 0) + 1,
        fechaCreacion: new Date().toISOString().split('T')[0]
      };
      mockData.push(newItem);
      return mockUtils.mockResponse(newItem, true, 'Elemento creado exitosamente');
    }

    return await http.post(this.getApiEndpoint(), data);
  }

  async update(id: number, data: any) {
    if (this.shouldUseMocks()) {
      await mockUtils.delay();
      const mockData = this.getMockData();
      const index = mockData.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        mockData[index] = {
          ...data,
          id,
          fechaModificacion: new Date().toISOString().split('T')[0]
        };
        return mockUtils.mockResponse(mockData[index], true, 'Elemento actualizado exitosamente');
      } else {
        throw new Error('Elemento no encontrado');
      }
    }

    return await http.put(`${this.getApiEndpoint()}/${id}`, data);
  }

  async delete(id: number) {
    if (this.shouldUseMocks()) {
      await mockUtils.delay();
      const mockData = this.getMockData();
      const index = mockData.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        mockData.splice(index, 1);
        return mockUtils.mockResponse(null, true, 'Elemento eliminado exitosamente');
      } else {
        throw new Error('Elemento no encontrado');
      }
    }

    return await http.delete(`${this.getApiEndpoint()}/${id}`);
  }

  async search(query: string) {
    if (this.shouldUseMocks()) {
      await mockUtils.delay();
      const data = this.getMockData();
      const filtered = data.filter(
        (item: any) =>
          item.nombre?.toLowerCase().includes(query.toLowerCase()) ||
          item.codigo?.toLowerCase().includes(query.toLowerCase()) ||
          item.descripcion?.toLowerCase().includes(query.toLowerCase())
      );
      return mockUtils.mockResponse(filtered);
    }

    return await http.get(`${this.getApiEndpoint()}/search?q=${encodeURIComponent(query)}`);
  }

  async getByStatus(status: 'activo' | 'inactivo') {
    if (this.shouldUseMocks()) {
      await mockUtils.delay();
      const data = this.getMockData();
      const filtered = data.filter((item: any) => item.estado === status);
      return mockUtils.mockResponse(filtered);
    }

    return await http.get(`${this.getApiEndpoint()}?estado=${status}`);
  }
}

export const createCatalogoService = (catalogoKey: string) => {
  return new CatalogoService(catalogoKey);
};

export const unidadesService = new CatalogoService('unidades');
export const objetivosService = new CatalogoService('objetivos-estrategicos');
export const politicasService = new CatalogoService('politicas');
export const programasService = new CatalogoService('programas');
export const marcoNormativoService = new CatalogoService('marcoNormativo');
export const tiposActividadService = new CatalogoService('tiposActividad');
export const entregablesService = new CatalogoService('entregables');
export const beneficiariosService = new CatalogoService('beneficiarios');
export const partidasService = new CatalogoService('partidas');
export const preciosService = new CatalogoService('precios');
export const cargosService = new CatalogoService('cargos');
export const viaticosService = new CatalogoService('viaticos');
export const combustiblesService = new CatalogoService('combustibles');

export const TipoProyectoService = new CatalogoService('tipo-proyecto');

export const useCatalogoPermissions = (catalogoKey: string, user: any) => {
  const basePermission = `catalogos.${catalogoKey}`;

  return {
    canRead: user?.permissions?.includes(`${basePermission}.read`) || false,
    canCreate: user?.permissions?.includes(`${basePermission}.create`) || false,
    canUpdate: user?.permissions?.includes(`${basePermission}.update`) || false,
    canDelete: user?.permissions?.includes(`${basePermission}.delete`) || false
  };
};
