'use client';

import type { EtapaProyectoEnum, DiagnosticoData } from '@/types/proyectos.d';

// Re-exportar para conveniencia
export type { EtapaProyectoEnum, DiagnosticoData };

// Tipos para los datos de otras etapas
export interface ProgramaOperativoData {
  actividades?: string;
  recursos?: string;
  cronograma?: string;
  // Agregar otros campos según necesidades
}

export interface BeneficiariosData {
  numeroBeneficiarios?: number;
  perfilBeneficiarios?: string;
  criteriosSeleccion?: string;
  // Agregar otros campos según necesidades
}

export interface FormulacionData {
  presupuesto?: number;
  indicadores?: string;
  riesgos?: string;
  // Agregar otros campos según necesidades
}

// Tipo union para los datos de cualquier etapa
export type EtapaData =
  | DiagnosticoData
  | ProgramaOperativoData
  | BeneficiariosData
  | FormulacionData;

// Estructura de los datos guardados en sessionStorage
export interface ProyectoEtapasSession {
  [etapa: string]: EtapaData;
}

// Utilidad para manejar el almacenamiento de etapas en sessionStorage
export class ProyectoEtapasStorage {
  private static readonly STORAGE_KEY_PREFIX = 'proyecto_etapas_';

  /**
   * Genera la llave completa para sessionStorage usando el UUID del proyecto
   */
  private static getStorageKey(projectUuid: string): string {
    return `${this.STORAGE_KEY_PREFIX}${projectUuid}`;
  }

  /**
   * Guarda los datos de una etapa específica para un proyecto
   * @param projectUuid UUID del proyecto
   * @param etapa numero de la etapa
   * @param data Datos de la etapa a guardar
   */
  static saveEtapaData(
    projectUuid: string,
    etapa: number,
    data: EtapaData
  ): void {
    try {
      const storageKey = this.getStorageKey(projectUuid);
      const existingData = this.getAllEtapasData(projectUuid);

      // Actualizar o agregar la etapa específica
      existingData[etapa] = data;

      // Guardar en sessionStorage
      sessionStorage.setItem(storageKey, JSON.stringify(existingData));
    } catch (error) {
      console.error('Error guardando datos de etapa en sessionStorage:', error);
      throw new Error('No se pudieron guardar los datos de la etapa');
    }
  }

  /**
   * Obtiene los datos de una etapa específica para un proyecto
   * @param projectUuid UUID del proyecto
   * @param etapa numero de la etapa
   * @returns Datos de la etapa o null si no existen
   */
  static getEtapaData(
    projectUuid: string,
    etapa: number
  ): EtapaData | null {
    try {
      const allData = this.getAllEtapasData(projectUuid);
      return allData[etapa] || null;
    } catch (error) {
      console.error('Error obteniendo datos de etapa desde sessionStorage:', error);
      return null;
    }
  }

  /**
   * Obtiene todos los datos de etapas guardados para un proyecto
   * @param projectUuid UUID del proyecto
   * @returns Objeto con todas las etapas guardadas
   */
  static getAllEtapasData(projectUuid: string): ProyectoEtapasSession {
    try {
      const storageKey = this.getStorageKey(projectUuid);
      const storedData = sessionStorage.getItem(storageKey);

      if (!storedData) {
        return {};
      }

      return JSON.parse(storedData);
    } catch (error) {
      console.error('Error obteniendo datos de etapas desde sessionStorage:', error);
      return {};
    }
  }

  /**
   * Elimina los datos de una etapa específica para un proyecto
   * @param projectUuid UUID del proyecto
   * @param etapa numero de la etapa a eliminar
   */
  static removeEtapaData(projectUuid: string, etapa: number): void {
    try {
      const storageKey = this.getStorageKey(projectUuid);
      const existingData = this.getAllEtapasData(projectUuid);

      // Eliminar la etapa específica
      delete existingData[etapa];

      // Guardar los datos actualizados o eliminar completamente si está vacío
      if (Object.keys(existingData).length === 0) {
        sessionStorage.removeItem(storageKey);
      } else {
        sessionStorage.setItem(storageKey, JSON.stringify(existingData));
      }
    } catch (error) {
      console.error('Error eliminando datos de etapa desde sessionStorage:', error);
      throw new Error('No se pudieron eliminar los datos de la etapa');
    }
  }

  /**
   * Elimina todos los datos de etapas para un proyecto
   * @param projectUuid UUID del proyecto
   */
  static clearProyectoEtapas(projectUuid: string): void {
    try {
      const storageKey = this.getStorageKey(projectUuid);
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error limpiando datos de proyecto desde sessionStorage:', error);
      throw new Error('No se pudieron limpiar los datos del proyecto');
    }
  }

  /**
   * Verifica si existe algún dato guardado para una etapa específica
   * @param projectUuid UUID del proyecto
   * @param etapa numero de la etapa
   * @returns true si existen datos, false en caso contrario
   */
  static hasEtapaData(projectUuid: string, etapa: number): boolean {
    const data = this.getEtapaData(projectUuid, etapa);
    return data !== null && Object.keys(data).length > 0;
  }

  /**
   * Lista todas las llaves de proyectos que tienen datos guardados
   * Útil para debugging o limpieza
   * @returns Array de UUIDs de proyectos con datos guardados
   */
  static getAllStoredProjectUuids(): string[] {
    try {
      const keys = Object.keys(sessionStorage);
      return keys
        .filter(key => key.startsWith(this.STORAGE_KEY_PREFIX))
        .map(key => key.replace(this.STORAGE_KEY_PREFIX, ''));
    } catch (error) {
      console.error('Error obteniendo UUIDs de proyectos almacenados:', error);
      return [];
    }
  }
}