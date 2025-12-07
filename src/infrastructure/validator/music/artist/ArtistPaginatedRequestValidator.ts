import * as joi from "joi";
import { findRegex } from "../../../../application/shared/utils/regexIndex";
import { artistValidations } from "../../../../application/shared/utils/regex/artistValidations";

const artistPaginatedRequestValidator = joi
  .object({
    name: joi
      .string()
      .optional()
      .trim()
      .min(1)
      .max(150)
      .regex(findRegex("artist_name", artistValidations))
      .messages({
        "string.base": "El nombre debe ser una cadena de texto",
        "string.min": "El nombre debe tener al menos 1 carácter",
        "string.max": "El nombre no puede exceder los 150 caracteres",
        "string.pattern.base": "El nombre contiene caracteres no válidos",
      }),

    country: joi
      .string()
      .optional()
      .trim()
      .length(3)
      .uppercase()
      .regex(findRegex("country_code", artistValidations))
      .messages({
        "string.base": "El país debe ser una cadena de texto",
        "string.length": "El código de país debe tener exactamente 3 caracteres (formato CCA3)",
        "string.pattern.base": "El código de país contiene caracteres no válidos",
      }),

    formationYear: joi
      .number()
      .optional()
      .integer()
      .min(1500)
      .max(new Date().getFullYear())
      .messages({
        "number.base": "El año de formación debe ser un número",
        "number.integer": "El año de formación debe ser un número entero",
        "number.min": "El año de formación no puede ser anterior a 1500",
        "number.max": `El año de formación no puede ser posterior a ${new Date().getFullYear()}`,
      }),
  })
  .optional()
  .messages({
    "object.base": "Los filtros de búsqueda de artistas deben ser un objeto válido",
  });

export default artistPaginatedRequestValidator;
