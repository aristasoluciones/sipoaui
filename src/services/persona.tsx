import http from "@/src/lib/axios";

export const PersonaService = {

    getListPersona() {
        return http.get(`/api/personas`);
    },

    createPersona(data: any): Promise<any> {
        return http.post(`/api/personas`, data);
    },

    updatePersona(id: number, data: any): Promise<any> {
        return http.patch(`/api/personas/${id}`, data);
    },

    deletePersona(id: number): Promise<any> {
        return http.delete(`/api/personas/${id}`);
    }   
};
 