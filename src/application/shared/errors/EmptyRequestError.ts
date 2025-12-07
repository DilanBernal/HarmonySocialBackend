import { ApplicationError, ErrorCodes } from "./ApplicationError";

/**
 * @param message Es el mensaje completo que se va a mostrar
 * @param entity Se reemplazara un mensaje predetermiado por este parametro de entidad
 * @example message: `No se puede mandar la solicitud de 'x' vacia`
 * @example entity: No se puede procesar la solicitude de ${errorDetails.entity} vacia
 */
export type emptyRequestErrorDetails = {
  message?: string;
  entity?: string;
};

/**
 * Clase extendida de ApplicationError para facilitar la creacion de el error cuando llega una solicitud vacia
 */
export default class EmptyRequestError extends ApplicationError {
  /**
   *
   * @param errorDetails Detalles del error
   * @param details Detalles opcionales para agregar al error
   * @param originalError Error original opcional, puede no estar ya que es una validacion anterior.
   * @summary Crear un Application error con los detalles del error y detalles externos opcionales
   */
  constructor(errorDetails: emptyRequestErrorDetails, details?: any, originalError?: Error) {
    super(
      errorDetails.message ?? `No se puede procesar la solicitude de ${errorDetails.entity} vacia`,
      ErrorCodes.EMPTY_REQUEST,
      details,
      originalError,
    );
  }
}
