import { ApplicationError } from "./errors/ApplicationError";

export class ApplicationResponse<T = void> {
  constructor(
    public readonly success: boolean,
    public readonly data?: T,
    public readonly error?: ApplicationError,
  ) {}

  static success<T>(data: T): ApplicationResponse<T> {
    return new ApplicationResponse(true, data, undefined);
  }

  static emptySuccess(): ApplicationResponse<void> {
    return new ApplicationResponse(true, undefined, undefined);
  }

  // ✅ Factory methods para errores
  static failure<T>(error: ApplicationError): ApplicationResponse<T> {
    return new ApplicationResponse<T>(false, undefined, error);
  }

  static failureWithData<T>(error: ApplicationError, data?: T): ApplicationResponse<T> {
    return new ApplicationResponse(false, data, error);
  }
}
