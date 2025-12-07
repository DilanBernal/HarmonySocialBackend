import joi from "joi";
export default joi
  .object({
    name: joi.string().required().min(3).max(50).messages({
      "any.required": "El nombre del rol es obligatorio",
      "string.base": "El nombre del rol debe ser una cadena de texto",
      "string.min": "El nombre del rol debe tener al menos {#limit} caracteres",
      "string.max": "El nombre del rol no puede exceder los {#limit} caracteres",
    }),

    description: joi.string().optional().default("N/A").max(255).messages({
      "string.base": "La descripción debe ser una cadena de texto",
      "string.max": "La descripción no puede exceder los {#limit} caracteres",
    }),
  })
  .required()
  .messages({
    "object.base": "Los datos del rol deben ser un objeto válido",
  });
