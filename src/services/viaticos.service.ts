import http from '@/src/lib/axios';

export type ZonaType = 'ZONA_1' | 'ZONA_2' | 'ZONA_3' | 'FUERA_ESTADO';
export type SubZona1 = 'Medio' | 'Bajo' | 'Muy Bajo' | null;

export interface Viatico {
    id: number;
    nivel: string;
    categoria: string;
    cuota_zona1: string | null;
    cuota_zona2: string | null;
    cuota_zona3: string | null;
    cuota_fuera_estado: string | null;
    cuota_internacional: string | null;
    updated_at: string;
}

export interface Municipio {
    id: number;
    numero: number | null;
    nombre: string;
    clasificacion_zona: ZonaType;
    subclasificacion_z1?: SubZona1;
}

class ViaticosService {
    // ─── Viáticos ─────────────────────────────────────────────────────────────
    async getViaticos(): Promise<Viatico[]> {
        const response = await http.get('/api/catalogos/viaticos');
        return response.data;
    }

    async createViatico(data: any): Promise<any> {
        return await http.post('/api/catalogos/viaticos', data);
    }

    async updateViatico(id: number, data: any): Promise<any> {
        return await http.put(`/api/catalogos/viaticos/${id}`, data);
    }

    async deleteViatico(id: number): Promise<any> {
        return await http.delete(`/api/catalogos/viaticos/${id}`);
    }

    async deleteMassViaticos(ids: number[]): Promise<any> {
        return await http.delete('/api/catalogos/viaticos/mass', { data: { ids } });
    }

    // ─── Municipios ───────────────────────────────────────────────────────────
    async getMunicipios(): Promise<Municipio[]> {
        const response = await http.get('/api/catalogos/municipios');
        return response.data;
    }

    async createMunicipio(data: any): Promise<any> {
        return await http.post('/api/catalogos/municipios', data);
    }

    async updateMunicipio(id: number, data: any): Promise<any> {
        return await http.put(`/api/catalogos/municipios/${id}`, data);
    }

    async deleteMunicipio(id: number): Promise<any> {
        return await http.delete(`/api/catalogos/municipios/${id}`);
    }

    async reassignMunicipios(data: { 
        municipio_ids: number[], 
        nueva_zona: ZonaType, 
        nueva_subclasificacion?: SubZona1 
    }): Promise<any> {
        return await http.post('/api/catalogos/municipios/reassign', data);
    }

    async importar(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('archivo', file);
        formData.append('catalogo', 'viaticos');
        
        return await http.post('/api/catalogos/importar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
}

export const viaticosService = new ViaticosService();
