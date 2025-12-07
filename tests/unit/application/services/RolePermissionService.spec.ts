import RolePermissionService from "../../../../src/application/services/RolePermissionService";
import RolePermissionPort from "../../../../src/domain/ports/data/seg/RolePermissionPort";
import { ApplicationResponse } from "../../../../src/application/shared/ApplicationReponse";
import {
  ApplicationError,
  ErrorCodes,
} from "../../../../src/application/shared/errors/ApplicationError";
import Permission, { CorePermission } from "../../../../src/domain/models/seg/Permission";

import createRolePermissionPortMock from "../../mocks/ports/data/seg/RolePermissionPort.mock";

// Helper function to create test Permission instances
const createTestPermission = (id: number, name: string, description?: string): Permission => {
  return new Permission(id, name, description, new Date("2023-01-01"), new Date("2023-01-01"));
};

describe("RolePermissionService", () => {
  let rolePermissionService: RolePermissionService;
  let mockRolePermissionPort: jest.Mocked<RolePermissionPort>;

  const mockPermissions: Permission[] = [
    createTestPermission(1, CorePermission.USER_READ, "Can read user information"),
    createTestPermission(2, CorePermission.FILE_OWN_DELETE, "Can delete own files"),
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockRolePermissionPort = createRolePermissionPortMock();

    rolePermissionService = new RolePermissionService(mockRolePermissionPort);
  });

  describe("assign", () => {
    describe("Casos Exitosos", () => {
      it("debe asignar un permiso a un rol exitosamente", async () => {
        mockRolePermissionPort.assign.mockResolvedValue(ApplicationResponse.emptySuccess());

        const result = await rolePermissionService.assign(1, 2);

        expect(result.success).toBe(true);
        expect(mockRolePermissionPort.assign).toHaveBeenCalledWith(1, 2);
      });
    });

    describe("Casos de Error - Validaciones", () => {
      it("debe fallar con roleId inválido (0)", async () => {
        const result = await rolePermissionService.assign(0, 1);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("IDs inválidos");
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
        expect(mockRolePermissionPort.assign).not.toHaveBeenCalled();
      });

      it("debe fallar con roleId inválido (negativo)", async () => {
        const result = await rolePermissionService.assign(-1, 1);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con permissionId inválido (0)", async () => {
        const result = await rolePermissionService.assign(1, 0);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con permissionId inválido (negativo)", async () => {
        const result = await rolePermissionService.assign(1, -5);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con ambos IDs inválidos", async () => {
        const result = await rolePermissionService.assign(0, 0);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con roleId undefined/null", async () => {
        const result = await rolePermissionService.assign(undefined as any, 1);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con permissionId undefined/null", async () => {
        const result = await rolePermissionService.assign(1, null as any);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });
    });

    describe("Casos de Error - Puerto", () => {
      it("debe propagar error del puerto", async () => {
        mockRolePermissionPort.assign.mockResolvedValue(
          ApplicationResponse.failure(
            new ApplicationError("Permission not found", ErrorCodes.VALUE_NOT_FOUND),
          ),
        );

        const result = await rolePermissionService.assign(1, 999);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALUE_NOT_FOUND);
      });
    });
  });

  describe("unassign", () => {
    describe("Casos Exitosos", () => {
      it("debe desasignar un permiso de un rol exitosamente", async () => {
        mockRolePermissionPort.unassign.mockResolvedValue(ApplicationResponse.emptySuccess());

        const result = await rolePermissionService.unassign(1, 2);

        expect(result.success).toBe(true);
        expect(mockRolePermissionPort.unassign).toHaveBeenCalledWith(1, 2);
      });
    });

    describe("Casos de Error - Validaciones", () => {
      it("debe fallar con roleId inválido (0)", async () => {
        const result = await rolePermissionService.unassign(0, 1);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("IDs inválidos");
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
        expect(mockRolePermissionPort.unassign).not.toHaveBeenCalled();
      });

      it("debe fallar con roleId inválido (negativo)", async () => {
        const result = await rolePermissionService.unassign(-1, 1);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con permissionId inválido (0)", async () => {
        const result = await rolePermissionService.unassign(1, 0);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con permissionId inválido (negativo)", async () => {
        const result = await rolePermissionService.unassign(1, -5);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });
    });

    describe("Casos de Error - Puerto", () => {
      it("debe propagar error del puerto cuando el permiso no está asignado", async () => {
        mockRolePermissionPort.unassign.mockResolvedValue(
          ApplicationResponse.failure(
            new ApplicationError("Permission not assigned to role", ErrorCodes.VALUE_NOT_FOUND),
          ),
        );

        const result = await rolePermissionService.unassign(1, 999);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALUE_NOT_FOUND);
      });
    });
  });

  describe("listByRole", () => {
    describe("Casos Exitosos", () => {
      it("debe listar permisos de un rol exitosamente", async () => {
        mockRolePermissionPort.getPermissionsByRole.mockResolvedValue(
          ApplicationResponse.success(mockPermissions),
        );

        const result = await rolePermissionService.listByRole(1);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        const permissions = result.data as Permission[];
        expect(permissions[0].name).toBe(CorePermission.USER_READ);
        expect(mockRolePermissionPort.getPermissionsByRole).toHaveBeenCalledWith(1);
      });

      it("debe retornar lista vacía para rol sin permisos", async () => {
        mockRolePermissionPort.getPermissionsByRole.mockResolvedValue(
          ApplicationResponse.success([]),
        );

        const result = await rolePermissionService.listByRole(99);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
      });
    });

    describe("Casos de Error - Validaciones", () => {
      it("debe fallar con roleId inválido (0)", async () => {
        const result = await rolePermissionService.listByRole(0);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("ID inválido");
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
        expect(mockRolePermissionPort.getPermissionsByRole).not.toHaveBeenCalled();
      });

      it("debe fallar con roleId inválido (negativo)", async () => {
        const result = await rolePermissionService.listByRole(-1);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con roleId undefined/null", async () => {
        const result = await rolePermissionService.listByRole(undefined as any);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });
    });

    describe("Casos de Error - Puerto", () => {
      it("debe propagar error del puerto", async () => {
        mockRolePermissionPort.getPermissionsByRole.mockResolvedValue(
          ApplicationResponse.failure(
            new ApplicationError("Database error", ErrorCodes.DATABASE_ERROR),
          ),
        );

        const result = await rolePermissionService.listByRole(1);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.DATABASE_ERROR);
      });
    });
  });

  describe("Integración de Mocks", () => {
    it("debe verificar que todos los mocks están correctamente configurados", () => {
      expect(mockRolePermissionPort).toBeDefined();
      expect(mockRolePermissionPort.assign).toBeDefined();
      expect(mockRolePermissionPort.unassign).toBeDefined();
      expect(mockRolePermissionPort.getPermissionsByRole).toBeDefined();
      expect(mockRolePermissionPort.getPermissionsByRoleNames).toBeDefined();

      expect(rolePermissionService).toBeDefined();
      expect(typeof rolePermissionService.assign).toBe("function");
      expect(typeof rolePermissionService.unassign).toBe("function");
      expect(typeof rolePermissionService.listByRole).toBe("function");
    });

    it("debe limpiar mocks entre tests", () => {
      mockRolePermissionPort.assign.mockResolvedValue(ApplicationResponse.emptySuccess());

      expect(mockRolePermissionPort.assign).toHaveBeenCalledTimes(0);

      rolePermissionService.assign(1, 1);
      expect(mockRolePermissionPort.assign).toHaveBeenCalledTimes(1);
    });
  });
});
