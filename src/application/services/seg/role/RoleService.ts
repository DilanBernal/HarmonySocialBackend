import RolePort from "../../../../domain/ports/data/seg/RolePort";
import UserRolePort from "../../../../domain/ports/data/seg/UserRolePort";
import LoggerPort from "../../../../domain/ports/utils/LoggerPort";
import RoleCreateRequest from "../../../dto/requests/Role/RoleCreateRequest";
import RoleUpdateRequest from "../../../dto/requests/Role/RoleUpdateRequest";
import RoleResponse from "../../../dto/responses/RoleResponse";
import { ApplicationResponse } from "../../../shared/ApplicationReponse";
import { ApplicationError, ErrorCodes } from "../../../shared/errors/ApplicationError";

export default class RoleService {
  constructor(
    private rolePort: RolePort,
    private userRolePort: UserRolePort,
    private logger: LoggerPort,
  ) {}

  async create(request: RoleCreateRequest): Promise<ApplicationResponse<number>> {
    try {
      const existing = await this.rolePort.findByName(request.name);
      if (existing)
        return ApplicationResponse.failure(
          new ApplicationError("Role name already exists", ErrorCodes.BUSINESS_RULE_VIOLATION),
        );
      const id = await this.rolePort.create({
        name: request.name,
        description: request.description,
      });
      return ApplicationResponse.success(id);
    } catch (e) {
      return this.unexpected<number>(e, "crear rol");
    }
  }

  async update(id: number, request: RoleUpdateRequest): Promise<ApplicationResponse<void>> {
    try {
      if (request.name) {
        const existing = await this.rolePort.findByName(request.name);
        if (existing && existing.id !== id)
          return ApplicationResponse.failure(
            new ApplicationError("Role name already exists", ErrorCodes.BUSINESS_RULE_VIOLATION),
          );
      }
      await this.rolePort.update(id, request);
      return ApplicationResponse.emptySuccess();
    } catch (e) {
      return this.unexpected<void>(e, "actualizar rol");
    }
  }

  async delete(id: number): Promise<ApplicationResponse<void>> {
    try {
      await this.rolePort.delete(id);
      return ApplicationResponse.emptySuccess();
    } catch (e) {
      return this.unexpected<void>(e, "eliminar rol");
    }
  }

  async getById(id: number): Promise<ApplicationResponse<RoleResponse>> {
    try {
      const role = await this.rolePort.findById(id);
      if (!role)
        return ApplicationResponse.failure(
          new ApplicationError("Role not found", ErrorCodes.VALUE_NOT_FOUND),
        );
      return ApplicationResponse.success(this.map(role));
    } catch (e) {
      return this.unexpected<RoleResponse>(e, "obtener rol");
    }
  }

  async list(): Promise<ApplicationResponse<RoleResponse[]>> {
    try {
      const roles = await this.rolePort.list();
      return ApplicationResponse.success(roles.map((r) => this.map(r)));
    } catch (e) {
      return this.unexpected<RoleResponse[]>(e, "listar roles");
    }
  }

  private map(r: any): RoleResponse {
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  private unexpected<T>(e: unknown, ctx: string): ApplicationResponse<T> {
    if (e instanceof ApplicationError) return ApplicationResponse.failure(e);
    if (e instanceof Error) this.logger.error(`Error inesperado al ${ctx}`, [e.message]);
    return ApplicationResponse.failure(
      new ApplicationError("Server error", ErrorCodes.SERVER_ERROR),
    );
  }
}
