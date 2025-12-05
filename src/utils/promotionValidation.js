/**
 * Esquemas de validación Yup para promociones
 * @author Sistema
 */

import * as yup from 'yup';

/**
 * Esquema de validación para crear/editar promoción
 */
export const promotionSchema = yup.object().shape({
  titulo: yup
    .string()
    .required('El título es obligatorio')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres')
    .trim(),
  
  descripcion: yup
    .string()
    .required('La descripción es obligatoria')
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim(),
  
  fechaInicio: yup
    .date()
    .required('La fecha de inicio es obligatoria')
    .typeError('Fecha de inicio inválida'),
  
  fechaFin: yup
    .date()
    .required('La fecha de fin es obligatoria')
    .typeError('Fecha de fin inválida')
    .min(
      yup.ref('fechaInicio'),
      'La fecha de fin debe ser posterior a la fecha de inicio'
    ),
  
  tipoDescuento: yup
    .string()
    .required('El tipo de descuento es obligatorio')
    .oneOf(['PORCENTAJE', 'MONTO'], 'Tipo de descuento inválido'),
  
  descuentoPorcentaje: yup
    .number()
    .when('tipoDescuento', {
      is: 'PORCENTAJE',
      then: (schema) => schema
        .required('El porcentaje de descuento es obligatorio')
        .positive('El porcentaje debe ser mayor a 0')
        .max(100, 'El porcentaje no puede ser mayor a 100')
        .typeError('Debe ser un número válido'),
      otherwise: (schema) => schema.nullable()
    }),
  
  descuentoMonto: yup
    .number()
    .when('tipoDescuento', {
      is: 'MONTO',
      then: (schema) => schema
        .required('El monto de descuento es obligatorio')
        .positive('El monto debe ser mayor a 0')
        .typeError('Debe ser un número válido'),
      otherwise: (schema) => schema.nullable()
    }),
  
  actived: yup
    .boolean()
    .default(true)
});

/**
 * Validar fechas de la promoción
 */
export const validatePromotionDates = (fechaInicio, fechaFin) => {
  const errors = {};
  
  if (!fechaInicio) {
    errors.fechaInicio = 'La fecha de inicio es obligatoria';
  }
  
  if (!fechaFin) {
    errors.fechaFin = 'La fecha de fin es obligatoria';
  }
  
  if (fechaInicio && fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    if (fin <= inicio) {
      errors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
  }
  
  return errors;
};

/**
 * Validar descuentos según tipo
 */
export const validateDiscount = (tipoDescuento, descuentoPorcentaje, descuentoMonto) => {
  const errors = {};
  
  if (!tipoDescuento) {
    errors.tipoDescuento = 'El tipo de descuento es obligatorio';
    return errors;
  }
  
  if (tipoDescuento === 'PORCENTAJE') {
    if (!descuentoPorcentaje || descuentoPorcentaje <= 0) {
      errors.descuentoPorcentaje = 'El porcentaje debe ser mayor a 0';
    } else if (descuentoPorcentaje > 100) {
      errors.descuentoPorcentaje = 'El porcentaje no puede ser mayor a 100';
    }
  }
  
  if (tipoDescuento === 'MONTO') {
    if (!descuentoMonto || descuentoMonto <= 0) {
      errors.descuentoMonto = 'El monto debe ser mayor a 0';
    }
  }
  
  return errors;
};

/**
 * Validar presentaciones seleccionadas
 */
export const validatePresentaciones = (presentaciones) => {
  if (!presentaciones || presentaciones.length === 0) {
    return { presentaciones: 'Debe seleccionar al menos un producto/presentación' };
  }
  return {};
};

/**
 * Validación completa de promoción
 */
export const validatePromotion = async (data) => {
  try {
    await promotionSchema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    const errors = {};
    if (err.inner) {
      err.inner.forEach((error) => {
        if (error.path) {
          errors[error.path] = error.message;
        }
      });
    }
    return { isValid: false, errors };
  }
};
