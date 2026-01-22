import { camelCase, snakeCase } from 'lodash';

/**
 * Utilidades para transformar objetos entre diferentes convenciones de nomenclatura
 * Usado principalmente para mapear entre APIs externas (snake_case) y código interno (camelCase)
 */

/**
 * Transforma un objeto de snake_case a camelCase recursivamente
 * @param obj - Objeto a transformar
 * @returns Objeto transformado a camelCase
 */
export const toCamelCase = <T>(obj: any): T => {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase) as T;
  }

  const transformed: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = camelCase(key);
      transformed[camelKey] = toCamelCase(obj[key]);
    }
  }
  return transformed;
};

/**
 * Transforma un objeto de camelCase a snake_case recursivamente
 * @param obj - Objeto a transformar
 * @returns Objeto transformado a snake_case
 */
export const toSnakeCase = <T>(obj: any): T => {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase) as T;
  }

  const transformed: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = snakeCase(key);
      transformed[snakeKey] = toSnakeCase(obj[key]);
    }
  }
  return transformed;
};

/**
 * Transforma arrays de objetos de snake_case a camelCase
 * @param arr - Array de objetos a transformar
 * @returns Array transformado
 */
export const arrayToCamelCase = <T>(arr: any[]): T[] => {
  return arr.map(item => toCamelCase<T>(item));
};

/**
 * Transforma arrays de objetos de camelCase a snake_case
 * @param arr - Array de objetos a transformar
 * @returns Array transformado
 */
export const arrayToSnakeCase = <T>(arr: any[]): T[] => {
  return arr.map(item => toSnakeCase<T>(item));
};
