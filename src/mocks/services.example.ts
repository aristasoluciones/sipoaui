// Ejemplo de cómo usar los mocks centralizados en otros servicios
import { MOCK_CONFIG, MOCK_PROYECTOS, MOCK_PERSONAS, mockUtils } from '@/src/mocks';
import http from '@/src/lib/axios';

// Servicio de proyectos con soporte para mocks
export const proyectoService = {
  async getAll() {
    if (MOCK_CONFIG.enabled) {
      await mockUtils.delay();
      return mockUtils.mockResponse(MOCK_PROYECTOS);
    }
    
    // Lógica real de API
    return await http.get('/api/proyectos');
  },

  async getById(id: number) {
    if (MOCK_CONFIG.enabled) {
      await mockUtils.delay();
      const proyecto = MOCK_PROYECTOS.find(p => p.id === id);
      if (proyecto) {
        return mockUtils.mockResponse(proyecto);
      } else {
        throw new Error('Proyecto no encontrado');
      }
    }
    
    // Lógica real de API
    return await http.get(`/api/proyectos/${id}`);
  },

  async create(data: any) {
    if (MOCK_CONFIG.enabled) {
      await mockUtils.delay();
      const newProject = {
        id: MOCK_PROYECTOS.length + 1,
        ...data,
        fechaCreacion: new Date().toISOString().split('T')[0]
      };
      MOCK_PROYECTOS.push(newProject);
      return mockUtils.mockResponse(newProject, true, 'Proyecto creado exitosamente');
    }
    
    // Lógica real de API
    return await http.post('/api/proyectos', data);
  }
};

// Servicio de personas con soporte para mocks
export const personaService = {
  async getAll() {
    if (MOCK_CONFIG.enabled) {
      await mockUtils.delay();
      return mockUtils.mockResponse(MOCK_PERSONAS);
    }
    
    // Lógica real de API
    return await http.get('/api/personas');
  },

  async search(query: string) {
    if (MOCK_CONFIG.enabled) {
      await mockUtils.delay();
      const filtered = MOCK_PERSONAS.filter(persona => 
        persona.nombre.toLowerCase().includes(query.toLowerCase()) ||
        persona.apellido.toLowerCase().includes(query.toLowerCase()) ||
        persona.email.toLowerCase().includes(query.toLowerCase())
      );
      return mockUtils.mockResponse(filtered);
    }
    
    // Lógica real de API
    return await http.get(`/api/personas/search?q=${query}`);
  }
};
