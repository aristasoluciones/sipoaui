import http from "@/src/lib/axios";
import { ProyectoApi, ProyectoFormData, DiagnosticoApi, ProgramaOperativoAnualApi, ActividadPoaApi, SubactividadPoaApi } from "@/types/proyectos";

export const ProyectoService = {

    async getListProyecto() {
        const response = await http.get(`/api/proyectos`);
        return response.data;
    },

    paginate(page: number, perPage: number): Promise<any> {
        return http.get(`/api/proyectos`, {
            params: {
                page,
                per_page: perPage
            }
        });
    },

    // Obtener proyectos filtrados por ejercicio fiscal
    getByEjercicioFiscal(ejercicioFiscalAnio: number, page: number = 1, perPage: number = 15): Promise<any> {
        return http.get(`/api/proyectos`, {
            params: {
                ejercicio_fiscal: ejercicioFiscalAnio,
                page,
                per_page: perPage
            }
        });
    },

    async getProyecto(uuid: string): Promise<ProyectoApi> {
        const response = await http.get(`/api/proyectos/${uuid}`);
        return response.data;
    },
    
    async createProyecto(data: ProyectoFormData): Promise<ProyectoApi> {
        const response = await http.post(`/api/proyectos`, data);
        return response.data;
    },

    async updateProyecto(uuid: string, data: ProyectoFormData): Promise<ProyectoApi> {
        const response = await http.patch(`/api/proyectos/${uuid}`, data);
        return response.data;
    },

    deleteProyecto(uuid: string): Promise<any> {
        return http.delete(`/api/proyectos/${uuid}`);
    },

    // Funciones para diagnóstico por proyecto
    async createDiagnosticoPorProyecto(uuid:string, contexto: any): Promise<DiagnosticoApi> {
        const response = await http.post(`/api/proyectos/${uuid}/diagnostico`, contexto);
        return response.data;
    },

    async updateDiagnosticoPorProyectoUuid(uuid:string, contexto: any): Promise<DiagnosticoApi> {
        const response = await http.put(`/api/proyectos/${uuid}/diagnostico`, contexto);
        return response.data;
    },

    async getDiagnosticoPorProyectoUuid(uuid: string): Promise<DiagnosticoApi> {
        const response = await http.get(`/api/proyectos/${uuid}/diagnostico`);
        return response.data;
    },

    // Funciones para gestios de POA por proyecto
    async getPoaPorProyectoUuid(uuid:string): Promise<ProgramaOperativoAnualApi> {
        const response = await http.get(`/api/proyectos/${uuid}/poa`);
        return response.data;
    },

    async getPoaConActividades(uuid: string): Promise<ProgramaOperativoAnualApi> {
        const response = await http.get(`/api/proyectos/${uuid}/poa?include=actividades`);
        return response.data;
    },

    async createPoaPorProyectoUuid(uuid:string): Promise<ProgramaOperativoAnualApi> {
        const response = await http.post(`/api/proyectos/${uuid}/poa`);
        return response.data;
    },

    async createActividadPorPoaId(uuid:string, poaId:number, contexto: any): Promise<ActividadPoaApi> {
        const response = await http.post(`/api/proyectos/${uuid}/poa/${poaId}/actividades`, contexto);
        return response.data;
    },

    async updateActividadPorPoaId(uuid:string, poaId:number, actividadId:number, contexto: any): Promise<ActividadPoaApi> {
        const response = await http.put(`/api/proyectos/${uuid}/poa/${poaId}/actividades/${actividadId}`, contexto);
        return response.data;
    },

    async deleteActividadPorPoaId(uuid:string, poaId:number, actividadId:number): Promise<void> {
        const response = await http.delete(`/api/proyectos/${uuid}/poa/${poaId}/actividades/${actividadId}`);
        return response.data;
    },

    async getSubactividadPorActividadId(uuid:string, poaId:number, actividadId:number): Promise<SubactividadPoaApi> {
        const response = await http.get(`/api/proyectos/${uuid}/poa/${poaId}/actividades/${actividadId}/subactividades`);
        return response.data;
    },

    async createSubactividadPorActividadId(uuid:string, poaId:number, actividadId:number, contexto: any): Promise<SubactividadPoaApi> {
        const response = await http.post(`/api/proyectos/${uuid}/poa/${poaId}/actividades/${actividadId}/subactividades`, contexto);
        return response.data;
    },
    
    async updateSubactividadPorActividadId(uuid:string, poaId:number, actividadId:number, subactividadId:number, contexto: any): Promise<SubactividadPoaApi> {
        const response = await http.put(`/api/proyectos/${uuid}/poa/${poaId}/actividades/${actividadId}/subactividades/${subactividadId}`, contexto);
        return response.data;
    },

    async deleteSubactividadPorActividadId(uuid:string, poaId:number, actividadId:number, subactividadId:number): Promise<void> {
        const response = await http.delete(`/api/proyectos/${uuid}/poa/${poaId}/actividades/${actividadId}/subactividades/${subactividadId}`);
        return response.data;
    },

    async solicitarRevisionPoa(uuid:string): Promise<ProgramaOperativoAnualApi> {
        const response = await http.post(`/api/proyectos/${uuid}/workflow/solicitar-revision`);
        return response.data;
    },

    async aprobarEtapa(uuid: string): Promise<any> {
        const response = await http.post(`/api/proyectos/${uuid}/workflow/aprobar`);
        return response.data;
    },

    async observarEtapa(uuid: string, observacion: string): Promise<any> {
        const response = await http.post(`/api/proyectos/${uuid}/workflow/observar`, {
            observacion
        });
        return response.data;
    }
};
