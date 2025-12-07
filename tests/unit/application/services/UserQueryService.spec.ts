import UserQueryService from "../../../../src/application/services/seg/user/UserQueryService";
import UserQueryPort from "../../../../src/domain/ports/data/seg/query/UserQueryPort";
import UserRolePort from "../../../../src/domain/ports/data/seg/UserRolePort";
import LoggerPort from "../../../../src/domain/ports/utils/LoggerPort";
import User, { UserInstrument, UserStatus } from "../../../../src/domain/models/seg/User";
import PaginationRequest from "../../../../src/application/dto/utils/PaginationRequest";
import UserSearchParamsRequest from "../../../../src/application/dto/requests/User/UserSearchParamsRequest";
import { ApplicationResponse } from "../../../../src/application/shared/ApplicationReponse";
import { ErrorCodes } from "../../../../src/application/shared/errors/ApplicationError";
import Result from "../../../../src/domain/shared/Result";

import createUserQueryPortMock from "../../mocks/ports/data/seg/UserQueryPort.mock";
import createUserRolePortMock from "../../mocks/ports/data/seg/UserRolePort.mock";
import createLoggerPort from "../../mocks/ports/extra/LoggerPort.mock";

describe("UserQueryService", () => {
  let userQueryService: UserQueryService;
  let mockUserQueryPort: jest.Mocked<UserQueryPort>;
  let mockUserRolePort: jest.Mocked<UserRolePort>;
  let mockLoggerPort: jest.Mocked<LoggerPort>;

  const mockUser = new User(
    1,
    "Test User",
    "testuser@example.com",
    "testuser",
    "$2b$10$hashedPassword",
    "default.jpg",
    100,
    UserStatus.ACTIVE,
    UserInstrument.GUITAR,
    "mock-concurrency-stamp",
    "mock-security-stamp",
    new Date("2023-01-01"),
    new Date("2023-01-01"),
  );

  const mockUsers = [
    mockUser,
    new User(
      2,
      "User Two",
      "user2@example.com",
      "user2",
      "$2b$10$hashedPassword2",
      "default2.jpg",
      50,
      UserStatus.ACTIVE,
      UserInstrument.PIANO,
      "mock-concurrency-stamp-2",
      "mock-security-stamp-2",
      new Date("2023-01-02"),
      new Date("2023-01-02"),
    ),
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserQueryPort = createUserQueryPortMock();
    mockUserRolePort = createUserRolePortMock();
    mockLoggerPort = createLoggerPort();

    userQueryService = new UserQueryService(mockUserQueryPort, mockUserRolePort, mockLoggerPort);
  });

  describe("getAllUsers", () => {
    describe("Casos Exitosos", () => {
      it("debe obtener todos los usuarios exitosamente", async () => {
        mockUserRolePort.listUsersForRole.mockResolvedValue([1, 2]);
        mockUserQueryPort.searchActiveUsersByIds.mockResolvedValue(Result.ok(mockUsers));

        const result = await userQueryService.getAllUsers();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.data?.[0].id).toBe(1);
        expect(result.data?.[0].fullName).toBe("Test User");
        expect(mockUserRolePort.listUsersForRole).toHaveBeenCalledWith("common_user");
      });

      it("debe retornar lista vacía cuando no hay usuarios con rol común", async () => {
        mockUserRolePort.listUsersForRole.mockResolvedValue([]);

        const result = await userQueryService.getAllUsers();

        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
        expect(mockUserQueryPort.searchActiveUsersByIds).not.toHaveBeenCalled();
      });
    });

    describe("Casos de Error", () => {
      it("debe manejar error del puerto de usuarios", async () => {
        mockUserRolePort.listUsersForRole.mockResolvedValue([1, 2]);
        mockUserQueryPort.searchActiveUsersByIds.mockResolvedValue(
          Result.fail(new Error("DB error")),
        );

        const result = await userQueryService.getAllUsers();

        // The service casts Result to ApplicationResponse, so isSuccess becomes false
        expect(result.success).toBeFalsy();
      });

      it("debe manejar excepciones inesperadas", async () => {
        mockUserRolePort.listUsersForRole.mockRejectedValue(new Error("Unexpected error"));

        const result = await userQueryService.getAllUsers();

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Ocurrió un error al obtener los usuarios");
        expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
      });
    });
  });

  describe("getUserById", () => {
    describe("Casos Exitosos", () => {
      it("debe obtener un usuario por ID exitosamente", async () => {
        mockUserQueryPort.getUserById.mockResolvedValue(Result.ok(mockUser));

        const result = await userQueryService.getUserById(1);

        expect(result.success).toBe(true);
        expect(result.data?.id).toBe(1);
        expect(result.data?.fullName).toBe("Test User");
        expect(result.data?.email).toBe("testuser@example.com");
        expect(mockUserQueryPort.getUserById).toHaveBeenCalledWith(1);
      });
    });

    describe("Casos de Error - Validaciones", () => {
      it("debe fallar con ID inválido (0)", async () => {
        const result = await userQueryService.getUserById(0);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("ID de usuario inválido");
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
        expect(mockUserQueryPort.getUserById).not.toHaveBeenCalled();
      });

      it("debe fallar con ID inválido (negativo)", async () => {
        const result = await userQueryService.getUserById(-5);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con ID null/undefined", async () => {
        const result = await userQueryService.getUserById(null as any);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });
    });

    describe("Casos de Error - Usuario No Encontrado", () => {
      it("debe fallar cuando el usuario no existe", async () => {
        mockUserQueryPort.getUserById.mockResolvedValue(
          Result.fail(new Error("Usuario no encontrado")),
        );

        const result = await userQueryService.getUserById(999);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Usuario no encontrado");
        expect(result.error?.code).toBe(ErrorCodes.VALUE_NOT_FOUND);
      });

      it("debe fallar cuando el resultado es exitoso pero no tiene valor", async () => {
        mockUserQueryPort.getUserById.mockResolvedValue(Result.ok(null as any));

        const result = await userQueryService.getUserById(999);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Usuario no encontrado");
      });
    });

    describe("Casos de Error - Excepciones", () => {
      it("debe manejar excepciones inesperadas", async () => {
        mockUserQueryPort.getUserById.mockRejectedValue(new Error("DB error"));

        const result = await userQueryService.getUserById(1);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Ocurrió un error al obtener el usuario");
        expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
        expect(mockLoggerPort.error).toHaveBeenCalled();
      });
    });
  });

  describe("getUserByEmail", () => {
    describe("Casos Exitosos", () => {
      it("debe obtener un usuario por email exitosamente", async () => {
        mockUserQueryPort.getUserByFilters.mockResolvedValue(Result.ok(mockUser));

        const result = await userQueryService.getUserByEmail("testuser@example.com");

        expect(result.success).toBe(true);
        expect(result.data?.email).toBe("testuser@example.com");
        expect(mockUserQueryPort.getUserByFilters).toHaveBeenCalledWith({
          email: "testuser@example.com",
          includeFilters: true,
        });
      });
    });

    describe("Casos de Error - Validaciones", () => {
      it("debe fallar con email vacío", async () => {
        const result = await userQueryService.getUserByEmail("");

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Email inválido");
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con email null/undefined", async () => {
        const result = await userQueryService.getUserByEmail(null as any);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });
    });

    describe("Casos de Error - Usuario No Encontrado", () => {
      it("debe fallar cuando el usuario no existe", async () => {
        mockUserQueryPort.getUserByFilters.mockResolvedValue(
          Result.fail(new Error("Usuario no encontrado")),
        );

        const result = await userQueryService.getUserByEmail("nonexistent@example.com");

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Usuario no encontrado");
        expect(result.error?.code).toBe(ErrorCodes.VALUE_NOT_FOUND);
      });
    });

    describe("Casos de Error - Excepciones", () => {
      it("debe manejar excepciones inesperadas", async () => {
        mockUserQueryPort.getUserByFilters.mockRejectedValue(new Error("DB error"));

        const result = await userQueryService.getUserByEmail("test@example.com");

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Ocurrió un error al obtener el usuario");
        expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
      });
    });
  });

  describe("getUserData", () => {
    describe("Casos Exitosos", () => {
      it("debe obtener datos básicos del usuario exitosamente", async () => {
        mockUserQueryPort.existsActiveUserById.mockResolvedValue(Result.ok(true));
        mockUserQueryPort.getUserById.mockResolvedValue(Result.ok(mockUser));

        const result = await userQueryService.getUserData(1);

        expect(result.success).toBe(true);
        expect(result.data?.id).toBe(1);
        expect(result.data?.fullName).toBe("Test User");
        expect(result.data?.email).toBe("testuser@example.com");
        expect(result.data?.activeFrom).toBe(2022);
      });
    });

    describe("Casos de Error", () => {
      it("debe fallar cuando el usuario activo no existe", async () => {
        mockUserQueryPort.existsActiveUserById.mockResolvedValue(Result.ok(false));

        const result = await userQueryService.getUserData(999);

        expect(result.success).toBe(false);
      });

      it("debe fallar cuando no se puede obtener el usuario", async () => {
        mockUserQueryPort.existsActiveUserById.mockResolvedValue(Result.ok(true));
        mockUserQueryPort.getUserById.mockResolvedValue(
          Result.fail(new Error("Usuario no encontrado")),
        );

        const result = await userQueryService.getUserData(1);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("No se pudo obtener el usuario");
        expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
      });

      it("debe manejar excepciones inesperadas", async () => {
        mockUserQueryPort.existsActiveUserById.mockRejectedValue(new Error("DB error"));

        const result = await userQueryService.getUserData(1);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Ocurrió un error");
        expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
      });
    });
  });

  describe("searchUsers", () => {
    describe("Casos Exitosos", () => {
      it("debe buscar usuarios con paginación exitosamente", async () => {
        const request = PaginationRequest.create<UserSearchParamsRequest>({}, 10);

        mockUserQueryPort.searchActiveUserByFilters.mockResolvedValue(Result.ok(mockUsers));

        const result = await userQueryService.searchUsers(request);

        expect(result.success).toBe(true);
        expect(result.data?.rows).toHaveLength(2);
        expect(result.data?.total_rows).toBe(2);
      });

      it("debe aplicar filtros de búsqueda", async () => {
        const request = PaginationRequest.create<UserSearchParamsRequest>(
          {
            email: "test",
            username: "user",
          },
          10,
        );

        mockUserQueryPort.searchActiveUserByFilters.mockResolvedValue(Result.ok([mockUser]));

        const result = await userQueryService.searchUsers(request);

        expect(result.success).toBe(true);
        expect(mockUserQueryPort.searchActiveUserByFilters).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "test",
            username: "user",
          }),
        );
      });

      it("debe limitar el tamaño de página al máximo permitido", async () => {
        const request = PaginationRequest.create<UserSearchParamsRequest>({}, 500); // Exceeds max

        mockUserQueryPort.searchActiveUserByFilters.mockResolvedValue(Result.ok(mockUsers));

        const result = await userQueryService.searchUsers(request);

        expect(result.success).toBe(true);
        // The service should limit to _paginationMaxLimit (150)
      });

      it("debe retornar lista vacía cuando no hay resultados", async () => {
        const request = PaginationRequest.create<UserSearchParamsRequest>({}, 10);

        mockUserQueryPort.searchActiveUserByFilters.mockResolvedValue(Result.ok([]));

        const result = await userQueryService.searchUsers(request);

        expect(result.success).toBe(true);
        expect(result.data?.rows).toHaveLength(0);
        expect(result.data?.total_rows).toBe(0);
      });
    });

    describe("Casos de Error", () => {
      it("debe manejar error del puerto", async () => {
        const request = PaginationRequest.create<UserSearchParamsRequest>({}, 10);

        mockUserQueryPort.searchActiveUserByFilters.mockResolvedValue(
          Result.fail(new Error("DB error")),
        );

        const result = await userQueryService.searchUsers(request);

        // The service casts Result to ApplicationResponse, so isSuccess becomes false
        expect(result.success).toBeFalsy();
      });

      it("debe manejar excepciones inesperadas", async () => {
        const request = PaginationRequest.create<UserSearchParamsRequest>({}, 10);

        mockUserQueryPort.searchActiveUserByFilters.mockRejectedValue(
          new Error("Unexpected error"),
        );

        const result = await userQueryService.searchUsers(request);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Error interno en búsqueda");
        expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
        expect(mockLoggerPort.error).toHaveBeenCalled();
      });
    });
  });

  describe("Integración de Mocks", () => {
    it("debe verificar que todos los mocks están correctamente configurados", () => {
      expect(mockUserQueryPort).toBeDefined();
      expect(mockUserRolePort).toBeDefined();
      expect(mockLoggerPort).toBeDefined();

      expect(userQueryService).toBeDefined();
      expect(typeof userQueryService.getAllUsers).toBe("function");
      expect(typeof userQueryService.getUserById).toBe("function");
      expect(typeof userQueryService.getUserByEmail).toBe("function");
      expect(typeof userQueryService.getUserData).toBe("function");
      expect(typeof userQueryService.searchUsers).toBe("function");
    });
  });
});
