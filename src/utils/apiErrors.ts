/**
 * Utilidad para formatear errores que vienen de la API
 */

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
  [key: string]: any;
}

/**
 * Formatea los errores de validación de la API
 * @param error - Error de Axios o cualquier objeto de error
 * @returns Mensaje de error formateado
 */
export const formatApiError = (error: any): string => {
  // Si no hay error, retornar mensaje genérico
  if (!error) {
    return 'Ha ocurrido un error desconocido';
  }

  // Extraer la respuesta del error (común en errores de Axios)
  const response = error?.response?.data || error?.data || error;

  // Mensaje principal (puede venir como 'message' o directamente como string)
  let mainMessage = '';
  
  if (typeof response === 'string') {
    return response;
  }

  if (response?.message) {
    mainMessage = response.message;
  }

  // Validar si hay errores de validación
  const errors = response?.errors;
  
  if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
    // Construir array con todos los mensajes de error
    const errorMessages: string[] = [];

    // Iterar sobre cada campo que tenga errores
    Object.keys(errors).forEach((field) => {
      const fieldErrors = errors[field];
      
      // Validar que sea un array
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((errorMsg) => {
          if (typeof errorMsg === 'string') {
            errorMessages.push(`• ${errorMsg}`);
          }
        });
      }
    });

    // Si hay errores de validación, concatenarlos al mensaje principal
    if (errorMessages.length > 0) {
      if (mainMessage) {
        return `${mainMessage}\n\n${errorMessages.join('\n')}`;
      } else {
        return errorMessages.join('\n');
      }
    }
  }

  // Si solo hay mensaje principal, retornarlo
  if (mainMessage) {
    return mainMessage;
  }

  // Si llegamos aquí y el error tiene un mensaje directo
  if (error?.message) {
    return error.message;
  }

  // Mensaje por defecto
  return 'Ha ocurrido un error al procesar la solicitud';
};

/**
 * Formatea los errores de validación agrupados por campo
 * @param error - Error de Axios o cualquier objeto de error
 * @returns Objeto con errores por campo
 */
export const formatApiValidationErrors = (error: any): Record<string, string[]> => {
  const response = error?.response?.data || error?.data || error;
  const errors = response?.errors;

  if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
    const formattedErrors: Record<string, string[]> = {};

    Object.keys(errors).forEach((field) => {
      const fieldErrors = errors[field];
      
      if (Array.isArray(fieldErrors)) {
        formattedErrors[field] = fieldErrors.filter((msg) => typeof msg === 'string');
      }
    });

    return formattedErrors;
  }

  return {};
};

/**
 * Obtiene el mensaje principal del error
 * @param error - Error de Axios o cualquier objeto de error
 * @returns Mensaje principal
 */
export const getApiErrorMessage = (error: any): string => {
  const response = error?.response?.data || error?.data || error;

  if (typeof response === 'string') {
    return response;
  }

  if (response?.message) {
    return response.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'Ha ocurrido un error al procesar la solicitud';
};

/**
 * Verifica si un error tiene errores de validación
 * @param error - Error de Axios o cualquier objeto de error
 * @returns true si tiene errores de validación
 */
export const hasValidationErrors = (error: any): boolean => {
  const response = error?.response?.data || error?.data || error;
  const errors = response?.errors;

  return !!(errors && typeof errors === 'object' && !Array.isArray(errors) && Object.keys(errors).length > 0);
};

/**
 * Obtiene todos los mensajes de error como array plano
 * @param error - Error de Axios o cualquier objeto de error
 * @returns Array de mensajes de error
 */
export const getApiErrorMessages = (error: any): string[] => {
  const response = error?.response?.data || error?.data || error;
  const messages: string[] = [];

  // Mensaje principal
  const mainMessage = getApiErrorMessage(error);
  if (mainMessage && mainMessage !== 'Ha ocurrido un error al procesar la solicitud') {
    messages.push(mainMessage);
  }

  // Errores de validación
  const errors = response?.errors;
  if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
    Object.keys(errors).forEach((field) => {
      const fieldErrors = errors[field];
      
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((errorMsg) => {
          if (typeof errorMsg === 'string') {
            messages.push(errorMsg);
          }
        });
      }
    });
  }

  return messages.length > 0 ? messages : ['Ha ocurrido un error al procesar la solicitud'];
};
