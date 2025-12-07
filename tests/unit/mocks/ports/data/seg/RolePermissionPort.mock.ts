import RolePermissionPort from "../../../../../../src/domain/ports/data/seg/RolePermissionPort";
import { ApplicationResponse } from "../../../../../../src/application/shared/ApplicationReponse";
import {
  ApplicationError,
  ErrorCodes,
} from "../../../../../../src/application/shared/errors/ApplicationError";
import Permission, {
  CorePermission,
  DefaultRolePermissionMapping,
} from "../../../../../../src/domain/models/seg/Permission";

// Helper function to create Permission instances
const createMockPermission = (
  id: number,
  name: string,
  description?: string,
  createdAt?: Date,
  updatedAt?: Date,
): Permission => {
  return new Permission(
    id,
    name,
    description,
    createdAt ?? new Date("2023-01-01"),
    updatedAt ?? new Date("2023-01-01"),
  );
};

// Mock data for permissions based on seed structure
const createMockPermissions = (): Permission[] => [
  createMockPermission(1, CorePermission.USER_READ, "Can read user information"),
  createMockPermission(2, CorePermission.FILE_OWN_DELETE, "Can delete own files"),
  createMockPermission(3, CorePermission.FILE_OWN_UPDATE, "Can update own files"),
  createMockPermission(4, CorePermission.ARTIST_UPDATE, "Can update artist"),
];

// Role to permissions mapping
const rolePermissionsMap = new Map<number, number[]>([
  [1, [1, 2, 3]], // common_user has basic permissions
  [2, [1, 2, 3, 4]], // artist has basic permissions + artist
  [3, [1, 2, 3, 4]], // admin has all permissions
]);

const createRolePermissionPortMock = (): jest.Mocked<RolePermissionPort> => {
  const mockPermissions = createMockPermissions();

  return {
    assign: jest.fn().mockImplementation(async (roleId: number, permissionId: number) => {
      // Verify permission exists
      const permissionExists = mockPermissions.some((p) => p.id === permissionId);
      if (!permissionExists) {
        return ApplicationResponse.failure(
          new ApplicationError("Permission not found", ErrorCodes.VALUE_NOT_FOUND),
        );
      }

      // Get current permissions for role
      const currentPermissions = rolePermissionsMap.get(roleId) || [];

      // Check if already assigned
      if (currentPermissions.includes(permissionId)) {
        return ApplicationResponse.emptySuccess();
      }

      // Add permission
      rolePermissionsMap.set(roleId, [...currentPermissions, permissionId]);
      return ApplicationResponse.emptySuccess();
    }),

    unassign: jest.fn().mockImplementation(async (roleId: number, permissionId: number) => {
      const currentPermissions = rolePermissionsMap.get(roleId) || [];

      if (!currentPermissions.includes(permissionId)) {
        return ApplicationResponse.failure(
          new ApplicationError("Permission not assigned to role", ErrorCodes.VALUE_NOT_FOUND),
        );
      }

      // Remove permission
      const updatedPermissions = currentPermissions.filter((p) => p !== permissionId);
      rolePermissionsMap.set(roleId, updatedPermissions);
      return ApplicationResponse.emptySuccess();
    }),

    getPermissionsByRole: jest.fn().mockImplementation(async (roleId: number) => {
      const permissionIds = rolePermissionsMap.get(roleId) || [];
      const permissions = mockPermissions.filter((p) => permissionIds.includes(p.id));
      return ApplicationResponse.success(permissions);
    }),

    getPermissionsByRoleNames: jest.fn().mockImplementation(async (roleNames: string[]) => {
      const allPermissions: Permission[] = [];

      for (const roleName of roleNames) {
        const rolePermissionNames = DefaultRolePermissionMapping[roleName] || [];
        const permissions = mockPermissions.filter((p) =>
          rolePermissionNames.includes(p.name as CorePermission),
        );

        // Add unique permissions
        for (const perm of permissions) {
          if (!allPermissions.some((p) => p.id === perm.id)) {
            allPermissions.push(perm);
          }
        }
      }

      return ApplicationResponse.success(allPermissions);
    }),
  };
};

export default createRolePermissionPortMock;
