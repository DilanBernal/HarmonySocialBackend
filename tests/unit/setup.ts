import "jest";

jest.setTimeout(10000);

// Mock environment variables for tests
process.env.PORT = "4666";
process.env.ENVIRONMENT = "test";
process.env.DB_PG_HOST = "localhost";
process.env.DB_PG_PORT = "5432";
process.env.DB_PG_USER = "test";
process.env.DB_PG_PASSWORD = "test";
process.env.DB_PG_NAME = "test_db";
process.env.DB_PG_SCHEMA = "public";
process.env.DB_PG_SYNC = "false";
process.env.DB_MONGO_CON_STRING = "mongodb://localhost:27017";
process.env.DB_MONGO_NAME = "test_db";
process.env.PASSWORD_SALT = "10";
process.env.JWT_SECRET = "test_secret_key_that_is_at_least_32_characters";
process.env.SMTP_HOST = "localhost";
process.env.SMTP_PORT = "1025";
process.env.SMTP_USER = "test";
process.env.SMTP_PASSWORD = "test";
process.env.EMAIL_FROM = "test@test.com";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.ALLOWED_URLS = "http://localhost:3000";
process.env.AZURE_STORAGE_CONNECTION_STRING =
  "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test;EndpointSuffix=core.windows.net";
process.env.LOG_LEVEL = "info";
