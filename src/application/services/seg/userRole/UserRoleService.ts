import RolePort from "../../../../domain/ports/data/seg/RolePort";
import UserRolePort from "../../../../domain/ports/data/seg/UserRolePort";
import LoggerPort from "../../../../domain/ports/utils/LoggerPort";
import { ApplicationResponse } from "../../../shared/ApplicationReponse";
import { ApplicationError, ErrorCodes } from "../../../shared/errors/ApplicationError";

export default class UserRoleService {
  constructor(
    private userRolePort: UserRolePort,
    private rolePort: RolePort,
    private logger: LoggerPort,
  ) {}

  async assign(userId: number, roleId: number): Promise<ApplicationResponse<void>> {
    try {
      const role = await this.rolePort.findById(roleId);
      if (!role)
        return ApplicationResponse.failure(
          new ApplicationError("Role not found", ErrorCodes.VALUE_NOT_FOUND),
        );
      await this.userRolePort.assignRoleToUser(userId, roleId);
      return ApplicationResponse.emptySuccess();
    } catch (e) {
      return this.unexpected<void>(e, "asignar rol a usuario");
    }
  }

  async remove(userId: number, roleId: number): Promise<ApplicationResponse<void>> {
    try {
      await this.userRolePort.removeRoleFromUser(userId, roleId);
      return ApplicationResponse.emptySuccess();
    } catch (e) {
      return this.unexpected<void>(e, "remover rol de usuario");
    }
  }

  async listRoles(userId: number) {
    try {
      const roles = await this.userRolePort.listRolesForUser(userId);
      return ApplicationResponse.success(
        roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          created_at: r.createdAt,
          updated_at: r.updatedAt,
        })),
      );
    } catch (e) {
      return this.unexpected<any[]>(e, "listar roles de usuario");
    }
  }

  async listUsers(roleName: string) {
    try {
      const userIds = await this.userRolePort.listUsersForRole(roleName);
      return ApplicationResponse.success(userIds);
    } catch (e) {
      return this.unexpected<number[]>(e, "listar usuarios por rol");
    }
  }

  private unexpected<T>(e: unknown, ctx: string): ApplicationResponse<T> {
    if (e instanceof ApplicationError) return ApplicationResponse.failure(e);
    if (e instanceof Error) this.logger.error(`Error inesperado al ${ctx}`, [e.message]);
    return ApplicationResponse.failure(
      new ApplicationError("Server error", ErrorCodes.SERVER_ERROR),
    );
  }
}
