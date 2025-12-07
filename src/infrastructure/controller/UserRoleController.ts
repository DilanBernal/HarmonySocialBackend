import { Request, Response } from "express";
import LoggerPort from "../../domain/ports/utils/LoggerPort";
import { ErrorCodes } from "../../application/shared/errors/ApplicationError";
import { ApplicationResponse } from "../../application/shared/ApplicationReponse";
import UserRoleService from "../../application/services/seg/userRole/UserRoleService";

export default class UserRoleController {
  constructor(
    private service: UserRoleService,
    private logger: LoggerPort,
  ) {}

  async assign(req: Request, res: Response) {
    const { userId, roleId } = req.body;
    try {
      const response = await this.service.assign(Number(userId), Number(roleId));
      if (response.success) return res.status(201).json({ message: "Rol asignado" });
      return this.handleError(res, response);
    } catch (e) {
      return this.unexpected(res, e, "asignar rol");
    }
  }

  async remove(req: Request, res: Response) {
    const { userId, roleId } = req.params;
    try {
      const response = await this.service.remove(Number(userId), Number(roleId));
      if (response.success) return res.status(204).send();
      return this.handleError(res, response);
    } catch (e) {
      return this.unexpected(res, e, "remover rol");
    }
  }

  async listRoles(req: Request, res: Response) {
    const { userId } = req.params;
    try {
      const response = await this.service.listRoles(Number(userId));
      if (response.success) return res.status(200).json(response.data);
      return this.handleError(res, response);
    } catch (e) {
      return this.unexpected(res, e, "listar roles usuario");
    }
  }

  async listUsers(req: Request, res: Response) {
    const { roleName } = req.params;
    try {
      const response = await this.service.listUsers(roleName);
      if (response.success) return res.status(200).json(response.data);
      return this.handleError(res, response);
    } catch (e) {
      return this.unexpected(res, e, "listar usuarios por rol");
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
