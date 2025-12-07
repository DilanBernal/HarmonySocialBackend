import joi from "joi";
export default joi
  .object({
    userId: joi.number().required().integer().positive().messages({
      "any.required": "El ID del usuario es obligatorio",
      "number.base": "El ID del usuario debe ser un número",
      "number.integer": "El ID del usuario debe ser un número entero",
      "number.positive": "El ID del usuario debe ser un número positivo",
    }),

    roleId: joi.number().required().integer().positive().messages({
      "any.required": "El ID del rol es obligatorio",
      "number.base": "El ID del rol debe ser un número",
      "number.integer": "El ID del rol debe ser un número entero",
      "number.positive": "El ID del rol debe ser un número positivo",
    }),
  })
  .required()
  .options({ stripUnknown: true })
  .messages({
    "object.base": "Los datos de asignación de rol deben ser un objeto válido",
    "any.required": "Todos los campos son obligatorios",
  });
