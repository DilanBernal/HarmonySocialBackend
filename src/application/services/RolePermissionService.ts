import RolePermissionPort from "../../domain/ports/data/seg/RolePermissionPort";
import { ApplicationResponse } from "../shared/ApplicationReponse";
import { ApplicationError, ErrorCodes } from "../shared/errors/ApplicationError";

export default class RolePermissionService {
  constructor(private rolePermissionPort: RolePermissionPort) {}

  async assign(roleId: number, permissionId: number) {
    if (!roleId || roleId <= 0 || !permissionId || permissionId <= 0) {
      return ApplicationResponse.failure(
        new ApplicationError("IDs inválidos", ErrorCodes.VALIDATION_ERROR),
      );
    }
    return this.rolePermissionPort.assign(roleId, permissionId);
  }

  async unassign(roleId: number, permissionId: number) {
    if (!roleId || roleId <= 0 || !permissionId || permissionId <= 0) {
      return ApplicationResponse.failure(
        new ApplicationError("IDs inválidos", ErrorCodes.VALIDATION_ERROR),
      );
    }
    return this.rolePermissionPort.unassign(roleId, permissionId);
  }

  async listByRole(roleId: number) {
    if (!roleId || roleId <= 0) {
      return ApplicationResponse.failure(
        new ApplicationError("ID inválido", ErrorCodes.VALIDATION_ERROR),
      );
    }
    return this.rolePermissionPort.getPermissionsByRole(roleId);
  }
}
