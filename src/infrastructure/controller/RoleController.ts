import { Request, Response } from "express";
import LoggerPort from "../../domain/ports/utils/LoggerPort";
import { ErrorCodes } from "../../application/shared/errors/ApplicationError";
import { ApplicationResponse } from "../../application/shared/ApplicationReponse";
import RoleService from "../../application/services/seg/role/RoleService";

export default class RoleController {
  constructor(
    private service: RoleService,
    private logger: LoggerPort,
  ) {}

  async create(req: Request, res: Response) {
    try {
      const response = await this.service.create(req.body);
      if (response.success) return res.status(201).json({ id: response.data });
      return this.handleError(res, response);
    } catch (e) {
      return this.unexpected(res, e, "crear rol");
    }
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const response = await this.service.update(Number(id), req.body);
      if (response.success) return res.status(200).json({ message: "Rol actualizado" });
      return this.handleError(res, response);
    } catch (e) {
      return this.unexpected(res, e, "actualizar rol");
    }
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const response = await this.service.delete(Number(id));
      if (response.success) return res.status(204).send();
      return this.handleError(res, response);
    } catch (e) {
      return this.unexpected(res, e, "eliminar rol");
    }
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const response = await this.service.getById(Number(id));
      if (response.success) return res.status(200).json(response.data);
      return this.handleError(res, response);
    } catch (e) {
      return this.unexpected(res, e, "obtener rol");
    }
  }

  async list(_req: Request, res: Response) {
    try {
      const response = await this.service.list();
      if (response.success) return res.status(200).json(response.data);
      return this.handleError(res, response);
    } catch (e) {
      return this.unexpected(res, e, "listar roles");
    }
  }

  private handleError(res: Response, response: ApplicationResponse<any>) {
    if (!response.error) return res.status(500).json({ message: "Error desconocido" });
    switch (response.error.code) {
      case ErrorCodes.VALUE_NOT_FOUND:
        return res.status(404).json({ message: response.error.message });
      case ErrorCodes.BUSINESS_RULE_VIOLATION:
        return res.status(409).json({ message: response.error.message });
      default:
        this.logger.appError && this.logger.appError(response);
        return res.status(500).json({ message: "Error interno" });
    }
  }

  private unexpected(res: Response, e: unknown, ctx: string) {
    if (e instanceof ApplicationResponse && e.error) return this.handleError(res, e);
    if (e instanceof Error) this.logger.error(`Error inesperado al ${ctx}`, [e.message]);
    return res.status(500).json({ message: `Error al ${ctx}` });
  }
}
