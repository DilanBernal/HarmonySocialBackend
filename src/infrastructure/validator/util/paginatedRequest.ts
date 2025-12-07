import * as joi from "joi";

const paginatedRequestValidator = joi
  .object({
    filters: joi.object().optional().messages({
      "object.base": "Los filtros deben ser un objeto válido",
    }),

    general_filter: joi.string().optional().trim().lowercase().max(200).allow(null).messages({
      "string.base": "El filtro general debe ser una cadena de texto",
      "string.max": "El filtro general no puede exceder los 200 caracteres",
    }),

    page_size: joi.number().positive().max(150).default(5).required().messages({
      "any.required": "El tamaño de página es obligatorio",
      "number.base": "El tamaño de página debe ser un número",
      "number.positive": "El tamaño de página debe ser un número positivo",
      "number.max": "El tamaño de página no puede ser mayor a 150 elementos",
    }),

    page_number: joi.number().positive().min(0).optional().allow(null).messages({
      "number.base": "El número de página debe ser un número",
      "number.positive": "El número de página debe ser un número positivo",
      "number.min": "El número de página no puede ser menor a 0",
    }),

    last_id: joi.number().positive().min(3).optional().allow(null).messages({
      "number.base": "El último ID debe ser un número",
      "number.positive": "El último ID debe ser un número positivo",
      "number.min": "El último ID debe ser mayor o igual a 3",
    }),

    first_id: joi.number().positive().optional().allow(null).messages({
      "number.base": "El primer ID debe ser un número",
      "number.positive": "El primer ID debe ser un número positivo",
    }),
  })
  .messages({
    "object.base": "Los datos de paginación deben ser un objeto válido",
  });

export default paginatedRequestValidator;
