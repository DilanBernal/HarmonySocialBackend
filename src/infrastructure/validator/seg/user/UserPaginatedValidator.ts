import * as joi from "joi";
import { userFindRegex } from "../../../../application/shared/utils/regexIndex";

const userSearchParamsSchema = joi
  .object({
    email: joi.string().optional().trim().lowercase().email().allow(null).messages({
      "string.base": "El email debe ser una cadena de texto",
      "string.email": "El email debe tener un formato válido",
    }),

    full_name: joi
      .string()
      .optional()
      .trim()
      .allow(null)
      .min(3)
      .max(150)
      .pattern(userFindRegex("fullNameRegex"))
      .messages({
        "string.base": "El nombre completo debe ser una cadena de texto",
        "string.pattern.base": "El nombre completo contiene caracteres no permitidos",
        "string.min": "El nombre completo debe tener al menos {#limit} caracteres",
        "string.max": "El nombre completo debe tener como máximo {#limit} caracteres",
      }),

    username: joi
      .string()
      .optional()
      .trim()
      .uppercase()
      .min(3)
      .max(50)
      .allow(null)
      .pattern(userFindRegex("usernameRegex"))
      .messages({
        "string.base": "El nombre de usuario debe ser una cadena de texto",
        "string.pattern.base": "El nombre de usuario contiene caracteres no permitidos",
        "string.min": "El nombre de usuario debe tener al menos {#limit} caracteres",
        "string.max": "El nombre de usuario debe tener como máximo {#limit} caracteres",
      }),
  })
  .required()
  .options({ stripUnknown: true, abortEarly: false })
  .messages({
    "object.base": "Los parámetros de búsqueda de usuarios deben ser un objeto válido",
  });

export default userSearchParamsSchema;
