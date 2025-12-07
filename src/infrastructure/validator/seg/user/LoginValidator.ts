import * as joi from "joi";
import {
  findRegex,
  userFindRegex,
  userValidations,
} from "../../../../application/shared/utils/regexIndex";

const loginSchema = joi
  .object({
    userOrEmail: joi
      .string()
      .required()
      .uppercase()
      .trim()
      .min(3)
      .max(50)
      .pattern(userFindRegex("userOrEmailRegex"))
      .messages({
        "any.required": "El nombre de usuario o email es obligatorio",
        "string.base": "El nombre de usuario o email debe ser una cadena de texto",
        "string.min": "El nombre de usuario o email debe tener al menos {#limit} caracteres",
        "string.max": "El nombre de usuario o email no puede exceder los {#limit} caracteres",
        "string.pattern.base": "El formato del nombre de usuario o email no es válido",
      }),

    password: joi
      .string()
      .required()
      .min(8)
      .max(128)
      .pattern(userFindRegex("passwordRegex"))
      .messages({
        "any.required": "La contraseña es obligatoria",
        "string.base": "La contraseña debe ser una cadena de texto",
        "string.min": "La contraseña debe tener al menos {#limit} caracteres",
        "string.max": "La contraseña no puede exceder los {#limit} caracteres",
        "string.pattern.base":
          "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*)",
      }),
  })
  .required()
  .min(2)
  .max(2)
  .options({ stripUnknown: true })
  .messages({
    "object.base": "Los datos de inicio de sesión deben ser un objeto válido",
    "object.min": "Debe proporcionar ambos campos: usuario/email y contraseña",
    "object.max": "Solo se permiten los campos usuario/email y contraseña",
  });

export default loginSchema;
