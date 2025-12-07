import UserCommandService from "../../../../src/application/services/seg/user/UserCommandService";
import UserCommandPort from "../../../../src/domain/ports/data/seg/command/UserCommandPort";
import UserQueryPort from "../../../../src/domain/ports/data/seg/query/UserQueryPort";
import RolePort from "../../../../src/domain/ports/data/seg/RolePort";
import UserRolePort from "../../../../src/domain/ports/data/seg/UserRolePort";
import AuthPort from "../../../../src/domain/ports/data/seg/AuthPort";
import EmailPort from "../../../../src/domain/ports/utils/EmailPort";
import TokenPort from "../../../../src/domain/ports/utils/TokenPort";
import LoggerPort from "../../../../src/domain/ports/utils/LoggerPort";
import RegisterRequest from "../../../../src/application/dto/requests/User/RegisterRequest";
import UpdateUserRequest from "../../../../src/application/dto/requests/User/UpdateUserRequest";
import { UserInstrument, UserStatus } from "../../../../src/domain/models/seg/User";
import Role from "../../../../src/domain/models/seg/Role";
import { ApplicationResponse } from "../../../../src/application/shared/ApplicationReponse";
import {
  ApplicationError,
  ErrorCodes,
} from "../../../../src/application/shared/errors/ApplicationError";
import Result from "../../../../src/domain/shared/Result";

import createUserCommandPortMock from "../../mocks/ports/data/seg/UserCommandPort.mock";
import createUserQueryPortMock from "../../mocks/ports/data/seg/UserQueryPort.mock";
import createRolePortMock from "../../mocks/ports/data/seg/RolePort.mock";
import createUserRolePortMock from "../../mocks/ports/data/seg/UserRolePort.mock";
import createAuthPortMock from "../../mocks/ports/data/seg/AuthPort.mock";
import createEmailPortMock from "../../mocks/ports/utils/EmailPort.mock";
import { createMockTokenPort } from "../../mocks/ports/utils/TokenPort.mock";
import createLoggerPort from "../../mocks/ports/extra/LoggerPort.mock";

// Helper function to create test Role instances
const createTestRole = (id: number, name: string, description?: string): Role => {
  return new Role(id, name, description, new Date(), new Date());
};

describe("UserCommandService", () => {
  let userCommandService: UserCommandService;
  let mockUserCommandPort: jest.Mocked<UserCommandPort>;
  let mockUserQueryPort: jest.Mocked<UserQueryPort>;
  let mockRolePort: jest.Mocked<RolePort>;
  let mockUserRolePort: jest.Mocked<UserRolePort>;
  let mockAuthPort: jest.Mocked<AuthPort>;
  let mockEmailPort: jest.Mocked<EmailPort>;
  let mockTokenPort: jest.Mocked<TokenPort>;
  let mockLoggerPort: jest.Mocked<LoggerPort>;

  const validRegisterRequest: RegisterRequest = {
    fullName: "Test User",
    email: "newuser@example.com",
    username: "newuser",
    password: "password123",
    profileImage: "default.jpg",
    favoriteInstrument: UserInstrument.GUITAR,
  };

  const validUpdateRequest: UpdateUserRequest = {
    fullName: "Updated Name",
    email: "updated@example.com",
    username: "updateduser",
    profileImage: "newimage.jpg",
    favoriteInstrument: UserInstrument.PIANO,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserCommandPort = createUserCommandPortMock();
    mockUserQueryPort = createUserQueryPortMock();
    mockRolePort = createRolePortMock();
    mockUserRolePort = createUserRolePortMock();
    mockAuthPort = createAuthPortMock();
    mockEmailPort = createEmailPortMock();
    mockTokenPort = createMockTokenPort();
    mockLoggerPort = createLoggerPort();

    userCommandService = new UserCommandService(
      mockUserCommandPort,
      mockUserQueryPort,
      mockRolePort,
      mockUserRolePort,
      mockAuthPort,
      mockEmailPort,
      mockTokenPort,
      mockLoggerPort,
    );
  });

  describe("registerUser", () => {
    describe("Casos Exitosos", () => {
      it("debe registrar un usuario exitosamente", async () => {
        mockUserQueryPort.existsActiveUserByFilters.mockResolvedValue(Result.ok(false));
        mockRolePort.findByName.mockResolvedValue(createTestRole(1, "common_user", "Regular user"));
        mockAuthPort.encryptPassword.mockResolvedValue("$2b$10$hashedPassword");
        mockTokenPort.generateStamp.mockReturnValue("mock-stamp");
        mockUserCommandPort.createUser.mockResolvedValue(Result.ok(4));
        mockUserRolePort.assignRoleToUser.mockResolvedValue(true);
        mockTokenPort.generateConfirmAccountToken.mockReturnValue("confirm-token");
        mockEmailPort.sendEmail.mockResolvedValue(true);

        const result = await userCommandService.registerUser(validRegisterRequest);

        expect(result.success).toBe(true);
        expect(result.data).toBe(4);
        expect(mockAuthPort.encryptPassword).toHaveBeenCalledWith(validRegisterRequest.password);
        expect(mockUserCommandPort.createUser).toHaveBeenCalled();
        expect(mockUserRolePort.assignRoleToUser).toHaveBeenCalledWith(4, 1);
      });

      it("debe crear usuario con status SUSPENDED", async () => {
        mockUserQueryPort.existsActiveUserByFilters.mockResolvedValue(Result.ok(false));
        mockRolePort.findByName.mockResolvedValue(createTestRole(1, "common_user", "Regular user"));
        mockAuthPort.encryptPassword.mockResolvedValue("$2b$10$hashedPassword");
        mockTokenPort.generateStamp.mockReturnValue("mock-stamp");
        mockUserCommandPort.createUser.mockResolvedValue(Result.ok(5));
        mockUserRolePort.assignRoleToUser.mockResolvedValue(true);
        mockTokenPort.generateConfirmAccountToken.mockReturnValue("confirm-token");
        mockEmailPort.sendEmail.mockResolvedValue(true);

        await userCommandService.registerUser(validRegisterRequest);

        expect(mockUserCommandPort.createUser).toHaveBeenCalledWith(
          expect.objectContaining({
            status: UserStatus.SUSPENDED,
          }),
        );
      });
    });

    describe("Casos de Error - Validaciones", () => {
      it("debe fallar con datos de usuario null", async () => {
        const result = await userCommandService.registerUser(null as any);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Datos de usuario inválidos");
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con datos de usuario undefined", async () => {
        const result = await userCommandService.registerUser(undefined as any);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });
    });

    describe("Casos de Error - Usuario Existente", () => {
      it("debe fallar cuando el usuario ya existe", async () => {
        mockUserQueryPort.existsActiveUserByFilters.mockResolvedValue(Result.ok(true));

        const result = await userCommandService.registerUser(validRegisterRequest);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Ya existe el usuario");
        expect(result.error?.code).toBe(ErrorCodes.USER_ALREADY_EXISTS);
      });
    });

    describe("Casos de Error - Rol No Configurado", () => {
      it("debe fallar cuando el rol por defecto no existe", async () => {
        mockUserQueryPort.existsActiveUserByFilters.mockResolvedValue(Result.ok(false));
        mockRolePort.findByName.mockResolvedValue(null);

        const result = await userCommandService.registerUser(validRegisterRequest);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Rol por defecto 'common_user' no configurado");
        expect(result.error?.code).toBe(ErrorCodes.VALUE_NOT_FOUND);
      });
    });

    describe("Casos de Error - Error al Crear Usuario", () => {
      it("debe fallar cuando createUser retorna error", async () => {
        mockUserQueryPort.existsActiveUserByFilters.mockResolvedValue(Result.ok(false));
        mockRolePort.findByName.mockResolvedValue(createTestRole(1, "common_user", "Regular user"));
        mockAuthPort.encryptPassword.mockResolvedValue("$2b$10$hashedPassword");
        mockTokenPort.generateStamp.mockReturnValue("mock-stamp");
        mockUserCommandPort.createUser.mockResolvedValue(Result.fail(new Error("Database error")));

        const result = await userCommandService.registerUser(validRegisterRequest);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("No se pudo crear el usuario");
        expect(result.error?.code).toBe(ErrorCodes.DATABASE_ERROR);
      });

      it("debe fallar cuando falla la asignación de rol", async () => {
        mockUserQueryPort.existsActiveUserByFilters.mockResolvedValue(Result.ok(false));
        mockRolePort.findByName.mockResolvedValue(createTestRole(1, "common_user", "Regular user"));
        mockAuthPort.encryptPassword.mockResolvedValue("$2b$10$hashedPassword");
        mockTokenPort.generateStamp.mockReturnValue("mock-stamp");
        mockUserCommandPort.createUser.mockResolvedValue(Result.ok(4));
        mockUserRolePort.assignRoleToUser.mockRejectedValue(new Error("Role assignment failed"));

        const result = await userCommandService.registerUser(validRegisterRequest);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Error al asignar rol por defecto");
        expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
      });
    });

    describe("Casos de Error - Excepciones", () => {
      it("debe manejar excepciones inesperadas", async () => {
        mockUserQueryPort.existsActiveUserByFilters.mockRejectedValue(
          new Error("Unexpected error"),
        );

        const result = await userCommandService.registerUser(validRegisterRequest);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Ocurrió un error inesperado en el registro");
        expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
      });
    });
  });

  describe("updateUser", () => {
    describe("Casos Exitosos", () => {
      it("debe actualizar un usuario exitosamente", async () => {
        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockUserQueryPort.getUserByFilters.mockResolvedValue(Result.ok(null as any));
        mockUserCommandPort.updateUser.mockResolvedValue(Result.ok(undefined));

        const result = await userCommandService.updateUser(1, validUpdateRequest);

        expect(result.success).toBe(true);
        expect(mockUserCommandPort.updateUser).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            fullName: "Updated Name",
            email: "updated@example.com",
            username: "updateduser",
          }),
        );
      });

      it("debe actualizar contraseña cuando se proporcionan credenciales", async () => {
        const requestWithPassword: UpdateUserRequest = {
          ...validUpdateRequest,
          current_password: "currentPassword",
          new_password: "newPassword123",
        };

        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockUserQueryPort.getUserByFilters.mockResolvedValue(Result.ok(null as any));
        mockAuthPort.encryptPassword.mockResolvedValue("$2b$10$newHashedPassword");
        mockTokenPort.generateStamp.mockReturnValue("new-security-stamp");
        mockUserCommandPort.updateUser.mockResolvedValue(Result.ok(undefined));

        const result = await userCommandService.updateUser(1, requestWithPassword);

        expect(result.success).toBe(true);
        expect(mockAuthPort.encryptPassword).toHaveBeenCalledWith("newPassword123");
        expect(mockUserCommandPort.updateUser).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            password: "$2b$10$newHashedPassword",
            securityStamp: "new-security-stamp",
          }),
        );
      });
    });

    describe("Casos de Error - Validaciones", () => {
      it("debe fallar con ID inválido (0)", async () => {
        const result = await userCommandService.updateUser(0, validUpdateRequest);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("ID de usuario inválido");
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con ID inválido (negativo)", async () => {
        const result = await userCommandService.updateUser(-1, validUpdateRequest);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar sin datos de actualización", async () => {
        const result = await userCommandService.updateUser(1, null as any);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Datos de actualización requeridos");
      });
    });

    describe("Casos de Error - Usuario No Encontrado", () => {
      it("debe fallar cuando el usuario no existe", async () => {
        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(false));

        const result = await userCommandService.updateUser(999, validUpdateRequest);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Usuario no encontrado");
        expect(result.error?.code).toBe(ErrorCodes.VALUE_NOT_FOUND);
      });
    });

    describe("Casos de Error - Conflictos", () => {
      it("debe fallar cuando el email o username ya están en uso por otro usuario", async () => {
        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockUserQueryPort.getUserByFilters.mockResolvedValue(
          Result.ok({
            id: 2, // Different user
            email: "other@example.com",
            username: "otheruser",
          } as any),
        );

        const result = await userCommandService.updateUser(1, validUpdateRequest);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("El email o username ya están en uso");
        expect(result.error?.code).toBe(ErrorCodes.USER_ALREADY_EXISTS);
      });

      it("debe permitir actualizar si el email/username pertenece al mismo usuario", async () => {
        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockUserQueryPort.getUserByFilters.mockResolvedValue(
          Result.ok({
            id: 1, // Same user
            email: "updated@example.com",
            username: "updateduser",
          } as any),
        );
        mockUserCommandPort.updateUser.mockResolvedValue(Result.ok(undefined));

        const result = await userCommandService.updateUser(1, validUpdateRequest);

        expect(result.success).toBe(true);
      });
    });

    describe("Casos de Error - Database", () => {
      it("debe fallar cuando updateUser retorna error", async () => {
        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockUserQueryPort.getUserByFilters.mockResolvedValue(Result.ok(null as any));
        mockUserCommandPort.updateUser.mockResolvedValue(Result.fail(new Error("DB error")));

        const result = await userCommandService.updateUser(1, validUpdateRequest);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("No se pudo actualizar el usuario");
        expect(result.error?.code).toBe(ErrorCodes.DATABASE_ERROR);
      });
    });

    describe("Casos de Error - Excepciones", () => {
      it("debe manejar excepciones inesperadas", async () => {
        mockUserQueryPort.existsUserById.mockRejectedValue(new Error("Unexpected error"));

        const result = await userCommandService.updateUser(1, validUpdateRequest);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Ocurrió un error al actualizar el usuario");
        expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
      });
    });
  });

  describe("deleteUser", () => {
    describe("Casos Exitosos", () => {
      it("debe eliminar un usuario exitosamente", async () => {
        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockUserCommandPort.deleteUser.mockResolvedValue(Result.ok(undefined));

        const result = await userCommandService.deleteUser(1);

        expect(result.success).toBe(true);
        expect(mockUserCommandPort.deleteUser).toHaveBeenCalledWith(1);
      });
    });

    describe("Casos de Error", () => {
      it("debe fallar cuando el usuario no existe", async () => {
        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(false));

        const result = await userCommandService.deleteUser(999);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("No se encontró al usuario");
        expect(result.error?.code).toBe(ErrorCodes.VALUE_NOT_FOUND);
      });

      it("debe fallar cuando deleteUser retorna error", async () => {
        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockUserCommandPort.deleteUser.mockResolvedValue(Result.fail(new Error("DB error")));

        const result = await userCommandService.deleteUser(1);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("No se pudo eliminar el usuario");
        expect(result.error?.code).toBe(ErrorCodes.DATABASE_ERROR);
      });

      it("debe manejar excepciones inesperadas", async () => {
        mockUserQueryPort.existsUserById.mockRejectedValue(new Error("Unexpected error"));

        const result = await userCommandService.deleteUser(1);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Ocurrió un error al eliminar el usuario");
        expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
      });
    });
  });
});
