import joi from "joi";
export default joi
  .object({
    name: joi.string().optional().trim().min(3).max(50).messages({
      "string.base": "El nombre del rol debe ser una cadena de texto",
      "string.min": "El nombre del rol debe tener al menos 3 caracteres",
      "string.max": "El nombre del rol no puede exceder los 50 caracteres",
    }),

    description: joi.string().optional().trim().max(255).messages({
      "string.base": "La descripción debe ser una cadena de texto",
      "string.max": "La descripción no puede exceder los 255 caracteres",
    }),
  })
  .required()
  .min(1)
  .messages({
    "object.base": "Los datos de actualización del rol deben ser un objeto válido",
    "object.min": "Debe proporcionar al menos {#limit} campo para actualizar",
  });
