import { userValidations } from "./regex/userValidations";

export type ValidationType = {
  name: string;
  regex: RegExp;
};

export const findRegex = (name: string, validator: Array<ValidationType>): RegExp =>
  validator.find((x) => x.name === name)!.regex;

export { userValidations } from "./regex/userValidations";
export const userFindRegex = (name: string): RegExp => findRegex(name, userValidations);
