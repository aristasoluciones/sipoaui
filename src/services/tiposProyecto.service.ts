import http from '@/src/lib/axios';

export const TiposProyectoService = {
  async getAll() {
    try {
      const response = await http.get('/api/catalogos/tipos-proyecto');
      return response.data;
    } catch (error) {
      console.error('Error trayendo tipos proyecto:', error);
      throw error;
    }
  }
};
