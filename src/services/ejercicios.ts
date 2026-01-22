import http from "@/src/lib/axios";
import { EjercicioFiscalApi, EjercicioFiscalStats, EjercicioFiscalFormDataToApi } from "@/types/ejercicios";

export const EjercicioFiscalService = {
  // Obtener todos los ejercicios fiscales
  getAll(): Promise<EjercicioFiscalApi[]> {
    return http.get('/api/ejercicios').then(response => response.data);
  },

  // Obtener ejercicio fiscal por ID
  getById(id: number): Promise<EjercicioFiscalApi> {
    return http.get(`/api/ejercicios/${id}`).then(response => response.data);
  },

  // Crear nuevo ejercicio fiscal
  create(data: EjercicioFiscalFormDataToApi): Promise<EjercicioFiscalApi> {
    return http.post('/api/ejercicios', data).then(response => response.data);
  },

  // Actualizar ejercicio fiscal
  update(id: number, data: EjercicioFiscalFormDataToApi): Promise<EjercicioFiscalApi> {
    return http.patch(`/api/ejercicios/${id}`, data).then(response => response.data);
  },

  // Eliminar ejercicio fiscal
  delete(id: number): Promise<void> {
    return http.delete(`/api/ejercicios/${id}`);
  },

  // Obtener ejercicio fiscal activo
  getActive(): Promise<EjercicioFiscalApi> {
    return http.get('/api/ejercicios/active').then(response => response.data);
  },

  // Establecer ejercicio fiscal como activo
  setActive(id: number): Promise<EjercicioFiscalApi> {
    return http.patch(`/api/ejercicios/${id}/set-active`).then(response => response.data);
  },

  // Obtener estadísticas consolidadas
  getConsolidatedStats(): Promise<EjercicioFiscalStats> {
    return http.get('/api/ejercicios/stats').then(response => response.data);
  }
};
