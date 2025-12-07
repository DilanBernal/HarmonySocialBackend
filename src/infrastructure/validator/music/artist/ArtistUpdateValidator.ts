import Joi from "joi";
import { artistValidations } from "../../../../application/shared/utils/regex/artistValidations";
import { findRegex } from "../../../../application/shared/utils/regexIndex";

const artistUpdateSchema = Joi.object({
  artist_name: Joi.string()
    .optional()
    .trim()
    .min(2)
    .max(150)
    .regex(findRegex("artist_name", artistValidations))
    .messages({
      "string.base": "El nombre del artista debe ser una cadena de texto",
      "string.min": "El nombre del artista debe tener al menos {#limit} caracteres",
      "string.max": "El nombre del artista no puede exceder los {#limit} caracteres",
      "string.pattern.base": "El nombre del artista contiene caracteres no válidos",
    }),

  biography: Joi.string()
    .optional()
    .trim()
    .max(2000)
    .allow(null, "")
    .regex(findRegex("artist_biography", artistValidations))
    .messages({
      "string.base": "La biografía debe ser una cadena de texto",
      "string.max": "La biografía no puede exceder los {#limit} caracteres",
      "string.pattern.base": "La biografía contiene caracteres no válidos",
    }),

  formation_year: Joi.number()
    .optional()
    .integer()
    .positive()
    .min(1600)
    .max(new Date().getFullYear())
    .messages({
      "number.base": "El año de formación debe ser un número",
      "number.integer": "El año de formación debe ser un número entero",
      "number.min": "El año de formación no puede ser anterior a {#limit}",
      "number.max": `El año de formación no puede ser posterior a ${new Date().getFullYear()}`,
    }),

  country_code: Joi.string()
    .optional()
    .alphanum()
    .min(2)
    .max(6)
    .regex(findRegex("country_code", artistValidations))
    .messages({
      "string.base": "El código de país debe ser una cadena de texto",
      "string.alphanum": "El código de país solo puede contener letras y números",
      "string.min": "El código de país debe tener al menos {#limit} caracteres",
      "string.max": "El código de país no puede exceder los {#limit} caracteres",
      "string.pattern.base": "El código de país debe seguir el formato CCA3 (3 letras mayúsculas)",
    }),
})
  .required()
  .min(1)
  .messages({
    "object.base": "Los datos de actualización del artista deben ser un objeto válido",
    "object.min": "Debe proporcionar al menos {#limit} campo para actualizar",
  });

export default artistUpdateSchema;
