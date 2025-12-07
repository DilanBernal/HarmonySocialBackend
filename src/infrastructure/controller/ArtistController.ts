import { Request, Response } from "express";
import ArtistService from "../../application/services/ArtistService";
import LoggerPort from "../../domain/ports/utils/LoggerPort";
import { ErrorCodes } from "../../application/shared/errors/ApplicationError";
import { ApplicationResponse } from "../../application/shared/ApplicationReponse";
import ArtistCreateRequest from "../../application/dto/requests/Artist/ArtistCreateRequest";
import ArtistUpdateRequest from "../../application/dto/requests/Artist/ArtistUpdateRequest";
import PaginationRequest from "../../application/dto/utils/PaginationRequest";
import { ArtistSearchFilters } from "../../application/dto/requests/Artist/ArtistSearchFilters";

export default class ArtistController {
  constructor(
    private service: ArtistService,
    private logger: LoggerPort,
  ) {}

  async create(req: Request, res: Response) {
    const createRequest: ArtistCreateRequest = req.body;
    const userId = (req as any).userId as number | undefined;
    try {
      const response = await this.service.create(createRequest, userId);
      if (response.success) {
        return res.status(201).json({ id: response.data });
      }
      return this.handleErrorResponse(res, response);
    } catch (e) {
      return this.unexpected(res, e, "crear artista");
    }
  }

  async createAsAdmin(req: Request, res: Response) {
    const createRequest: ArtistCreateRequest = req.body;
    try {
      const response = await this.service.createAsAdmin(createRequest);
      if (response.success) {
        return res.status(201).json({ id: response.data });
      }
      return this.handleErrorResponse(res, response);
    } catch (e) {
      return this.unexpected(res, e, "crear artista por admin");
    }
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const updateRequest: ArtistUpdateRequest = req.body;
    try {
      const response = await this.service.update(Number(id), updateRequest);
      if (response.success) return res.status(200).json({ message: "Artista actualizado" });
      return this.handleErrorResponse(res, response);
    } catch (e) {
      return this.unexpected(res, e, "actualizar artista");
    }
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const response = await this.service.getById(Number(id));
      if (response.success) return res.status(200).json(response.data);
      return this.handleErrorResponse(res, response);
    } catch (e) {
      return this.unexpected(res, e, "obtener artista");
    }
  }

  async search(req: Request, res: Response) {
    const { name, country, formationYear, verified } =
      (req.parsedQuery?.filters as ArtistSearchFilters) ?? {};
    const { general_filter, page_size, page_number, last_id, first_id } = req.parsedQuery!;
    try {
      const response = await this.service.search(
        PaginationRequest.create<ArtistSearchFilters>(
          { country, name, formationYear, verified },
          parseInt(page_size),
          general_filter,
          page_number,
          first_id,
          last_id,
        ),
      );
      if (response.success) return res.status(200).json(response.data);
      return this.handleErrorResponse(res, response);
    } catch (e) {
      return this.unexpected(res, e, "buscar artistas");
    }
  }

  async logicalDelete(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const response = await this.service.logicalDelete(Number(id));
      if (response.success) return res.status(204).send();
      return this.handleErrorResponse(res, response);
    } catch (e) {
      return this.unexpected(res, e, "eliminar artista");
    }
  }

  async accept(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const response = await this.service.accept(Number(id));
      if (response.success) return res.status(200).json({ message: "Artista aceptado" });
      return this.handleErrorResponse(res, response);
    } catch (e) {
      return this.unexpected(res, e, "aceptar artista");
    }
  }

  async reject(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const response = await this.service.reject(Number(id));
      if (response.success) return res.status(200).json({ message: "Artista rechazado" });
      return this.handleErrorResponse(res, response);
    } catch (e) {
      return this.unexpected(res, e, "rechazar artista");
    }
  }

  private handleErrorResponse(res: Response, response: ApplicationResponse<any>) {
    if (!response.error) return res.status(500).json({ message: "Error desconocido" });
    switch (response.error.code) {
      case ErrorCodes.VALUE_NOT_FOUND:
        return res.status(404).json({ message: response.error.message });
      case ErrorCodes.VALIDATION_ERROR:
        return res
          .status(400)
          .json({ message: response.error.message, details: response.error.details });
      case ErrorCodes.BUSINESS_RULE_VIOLATION:
        return res.status(409).json({ message: response.error.message });
      case ErrorCodes.DATABASE_ERROR:
        this.logger.appError!(response);
        return res.status(500).json({ message: "Error en la base de datos" });
      case ErrorCodes.SERVER_ERROR:
      default:
        this.logger.appError!(response);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  private unexpected(res: Response, e: unknown, ctx: string) {
    if (e instanceof ApplicationResponse && e.error) {
      return this.handleErrorResponse(res, e);
    }
    if (e instanceof Error) {
      this.logger.error(`Error inesperado al ${ctx}`, [e.name, e.message]);
    }
    return res.status(500).json({ message: `Error al ${ctx}` });
  }
}
