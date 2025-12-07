import { ValidationType } from "../regexIndex";

// Función para generar regex dinámico del año de formación
const createFormationYearRegex = (extraYears: number): RegExp => {
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + extraYears;
  return new RegExp(`^(1[8-9][0-9]{2}|20[0-9]{2}|${maxYear})$`);
};

export const artistValidations: Array<ValidationType> = [
  {
    name: "artist_name",
    regex: /^[\p{L}\p{N}\s\-'.\(\)\[\]&,!?°º]+$/u,
  },
  {
    name: "country_code",
    regex: /^[A-Z]{3}$/,
  },
  {
    name: "artist_biography",
    regex: /^[\p{L}\p{N}\p{P}\p{S}\s]*$/u,
  },

  {
    name: "formation_year",
    regex: createFormationYearRegex(10),
  },
  {
    name: "user_id",
    regex: /^[1-9]\d*$/,
  },
];
