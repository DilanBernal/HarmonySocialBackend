import * as joi from "joi";
import "dotenv/config";
require("dotenv").config();

export type ReturnEnvironmentVars = {
  LOG_LEVEL: string;
  PORT: number;
  ENVIRONMENT: string;
  DB_HOST: string;
  DB_PG_PORT: number;
  DB_PG_USER: string;
  DB_PG_PASSWORD: string;
  DB_PG_NAME: string;
  DB_PG_SCHEMA: string;
  DB_PG_SYNC: boolean;
  DB_MONGO_CON_STRING: string;
  DB_MONGO_NAME: string;
  PASSWORD_SALT: number;
  JWT_SECRET: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  EMAIL_FROM: string;
  FRONTEND_URL: string;
  ALLOWED_URLS: string;
  AZURE_STORAGE_CONNECTION_STRING: string;
};

type ValidationEnvironmentVars = {
  error: joi.ValidationError | undefined;
  value: ReturnEnvironmentVars;
};

function validateEnvVars(vars: NodeJS.ProcessEnv): ValidationEnvironmentVars {
  const envSchem = joi
    .object({
      PORT: joi.number().default(4666).required(),
      ENVIRONMENT: joi.string().default("dev").required(),
      DB_PG_HOST: joi.string().required(),
      DB_PG_PORT: joi.number().required(),
      DB_PG_USER: joi.string().required(),
      DB_PG_PASSWORD: joi.string().allow("").optional(),
      DB_PG_NAME: joi.string().required(),
      DB_PG_SCHEMA: joi.string().required(),
      DB_PG_SYNC: joi.boolean().default(false).required(),
      DB_MONGO_CON_STRING: joi.string().required(),
      DB_MONGO_NAME: joi.string().required(),
      PASSWORD_SALT: joi.number().default(4).required(),
      JWT_SECRET: joi.string().min(32).required(),
      SMTP_HOST: joi.string().required(),
      SMTP_PORT: joi.number().default(1025).required(),
      SMTP_USER: joi.string().allow("").optional(),
      SMTP_PASSWORD: joi.string().allow("").optional(),
      EMAIL_FROM: joi.string().email().required(),
      FRONTEND_URL: joi.string().uri().required(),
      ALLOWED_URLS: joi.string().required(),
      AZURE_STORAGE_CONNECTION_STRING: joi.string().required(),
      LOG_LEVEL: joi.string().required(),
    })
    .unknown(true);
  const { error, value } = envSchem.validate(vars);
  return { error, value };
}

function loadEnvVars(): ReturnEnvironmentVars {
  const result = validateEnvVars(process.env);
  if (result.error) {
    throw new Error(`Error validating environment variables: ${result.error.message}`);
  }
  const value = result.value;
  return {
    PORT: value.PORT,
    ENVIRONMENT: value.ENVIRONMENT,
    DB_HOST: value.DB_HOST,
    DB_PG_PORT: value.DB_PG_PORT,
    DB_PG_USER: value.DB_PG_USER,
    DB_PG_NAME: value.DB_PG_NAME,
    DB_PG_SCHEMA: value.DB_PG_SCHEMA,
    DB_PG_PASSWORD: value.DB_PG_PASSWORD,
    DB_PG_SYNC: value.DB_PG_SYNC,
    DB_MONGO_CON_STRING: value.DB_MONGO_CON_STRING,
    DB_MONGO_NAME: value.DB_MONGO_NAME,
    PASSWORD_SALT: value.PASSWORD_SALT,
    JWT_SECRET: value.JWT_SECRET,
    SMTP_HOST: value.SMTP_HOST,
    SMTP_PORT: value.SMTP_PORT,
    SMTP_USER: value.SMTP_USER,
    ALLOWED_URLS: value.ALLOWED_URLS,
    SMTP_PASSWORD: value.SMTP_PASSWORD,
    EMAIL_FROM: value.EMAIL_FROM,
    FRONTEND_URL: value.FRONTEND_URL,
    AZURE_STORAGE_CONNECTION_STRING: value.AZURE_STORAGE_CONNECTION_STRING,
    LOG_LEVEL: value.LOG_LEVEL,
  };
}
const envs = loadEnvVars();

Object.freeze(envs);
export default envs;
