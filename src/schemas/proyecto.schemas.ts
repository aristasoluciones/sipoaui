import * as yup from 'yup';
import { Prioridad } from '@/types/proyectos.d';

// Esquema de validación para el formulario de Información General (Stage 0)
export const proyectoInformacionGeneralSchema = yup.object().shape({
  codigo: yup
    .string()
    .required('El código del proyecto es obligatorio')
    .max(20, 'El código no puede tener más de 20 caracteres')
    .trim('El código no puede tener espacios al inicio o final')
    .matches(/^[a-zA-Z0-9-_]+$/, 'El código solo puede contener letras, números, guiones y guiones bajos'),

  nombre: yup
    .string()
    .required('El nombre del proyecto es obligatorio')
    .max(200, 'El nombre no puede tener más de 200 caracteres')
    .trim('El nombre no puede tener espacios al inicio o final')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),

  //Se deja la descripción como campo opcional
    descripcion: yup
    .string()
    .max(500, 'La descripción no puede tener más de 500 caracteres')
    .notRequired(),

  prioridad: yup
    .mixed<Prioridad>()
    .oneOf(Object.values(Prioridad), 'Seleccione una prioridad válida')
    .required('La prioridad es obligatoria'),

  ejercicio_id: yup
    .number()
    .required('El ejercicio fiscal es obligatorio')
    .integer('El ejercicio fiscal debe ser un número entero'),

  unidad_id: yup
    .number()
    .nullable()
    .required('La unidad responsable es obligatoria')
    .positive('Seleccione una unidad válida'),

  responsable_id: yup
    .number()
    .nullable()
    .required('El responsable es obligatorio')
    .positive('Seleccione un responsable válido'),

  tipo_proyecto_id: yup
    .number()
    .nullable()
    .required('El tipo de proyecto es obligatorio')
    .positive('Seleccione un tipo de proyecto válido'),
});

// Esquema de validación para actividad POA
export const actividadSchema = yup.object().shape({
  descripcion: yup
    .string()
    .required('La descripción de la actividad es obligatoria')
    .min(3, 'La descripción debe tener al menos 3 caracteres')
    .max(255, 'La descripción no puede exceder 255 caracteres'),
  tipo_actividad_id: yup
    .number()
    .integer('El tipo de actividad debe ser un número entero')
    .required('El tipo de actividad es obligatorio')
    .positive('El tipo de actividad debe ser un número positivo')
});

// Esquema de validación para subactividad POA
export const subactividadSchema = yup.object().shape({
  descripcion: yup
    .string()
    .required('La descripción de la subactividad es obligatoria')
    .min(3, 'La descripción debe tener al menos 3 caracteres')
    .max(255, 'La descripción no puede exceder 255 caracteres'),
  tipo_actividad_id: yup
    .number()
    .integer('El tipo de actividad debe ser un número entero')
    .required('El tipo de actividad es obligatorio')
    .positive('El tipo de actividad debe ser un número positivo'),
  fecha_inicio: yup
    .date()
    .required('La fecha de inicio es obligatoria')
    .typeError('La fecha de inicio debe ser una fecha válida'),
  fecha_termino: yup
    .date()
    .required('La fecha de término es obligatoria')
    .typeError('La fecha de término debe ser una fecha válida')
    .min(yup.ref('fecha_inicio'), 'La fecha de término debe ser posterior a la fecha de inicio'),
  entregable_id: yup
    .number()
    .integer('El entregable debe ser un número entero')
    .required('El entregable es obligatorio')
    .positive('El entregable debe ser un número positivo')
});

// Tipos inferidos del esquema
export type ProyectoInformacionGeneralForm = yup.InferType<typeof proyectoInformacionGeneralSchema>;