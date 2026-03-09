import axios from '@/src/lib/axios';

export interface Municipio {
    id: number;
    numero: number | null;
    nombre: string;
    clasificacion_zona: 'ZONA_1' | 'ZONA_2' | 'ZONA_3' | 'FUERA_ESTADO';
    subclasificacion_z1: string | null;
}

const municipiosService = {
    async getAll() {
        const response = await axios.get('/api/catalogos/municipios');
        return response.data;
    },

    async create(data: Partial<Municipio>) {
        const response = await axios.post('/api/catalogos/municipios', data);
        return response.data;
    },

    async update(id: number, data: Partial<Municipio>) {
        const response = await axios.put(`/api/catalogos/municipios/${id}`, data);
        return response.data;
    },

    async delete(id: number) {
        const response = await axios.delete(`/api/catalogos/municipios/${id}`);
        return response.data;
    },

    async reassignZones(municipioIds: number[], newZone: string) {
        const response = await axios.post('/api/catalogos/municipios/reassign', {
            municipio_ids: municipioIds,
            nueva_zona: newZone
        });
        return response.data;
    }
};

export default municipiosService;
