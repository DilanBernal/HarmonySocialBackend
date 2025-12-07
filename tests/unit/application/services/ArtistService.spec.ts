import ArtistService from "../../../../src/application/services/ArtistService";
import ArtistQueryPort from "../../../../src/domain/ports/data/music/query/ArtistQueryPort";
import ArtistCommandPort from "../../../../src/domain/ports/data/music/command/ArtistCommandPort";
import LoggerPort from "../../../../src/domain/ports/utils/LoggerPort";
import RolePort from "../../../../src/domain/ports/data/seg/RolePort";
import UserRolePort from "../../../../src/domain/ports/data/seg/UserRolePort";
import Artist, { ArtistStatus } from "../../../../src/domain/models/music/Artist";
import Role from "../../../../src/domain/models/seg/Role";
import ArtistCreateRequest from "../../../../src/application/dto/requests/Artist/ArtistCreateRequest";
import ArtistUpdateRequest from "../../../../src/application/dto/requests/Artist/ArtistUpdateRequest";
import { ErrorCodes } from "../../../../src/application/shared/errors/ApplicationError";
import PaginationRequest from "../../../../src/application/dto/utils/PaginationRequest";
import Result from "../../../../src/domain/shared/Result";

import createArtistQueryPortMock from "../../mocks/ports/data/music/ArtistQueryPort.mock";
import createArtistCommandPortMock from "../../mocks/ports/data/music/ArtistCommandPort.mock";
import createLoggerPort from "../../mocks/ports/extra/LoggerPort.mock";
import createRolePortMock from "../../mocks/ports/data/seg/RolePort.mock";
import createUserRolePortMock from "../../mocks/ports/data/seg/UserRolePort.mock";

// Helper function to create Artist instances for tests
const createTestArtist = (
  id: number,
  artistName: string,
  verified: boolean,
  formationYear: number,
  status: ArtistStatus,
  artistUserId?: number,
  biography?: string,
  countryCode?: string,
  createdAt?: Date,
  updatedAt?: Date,
): Artist => {
  return new Artist(
    id,
    artistUserId,
    artistName,
    biography,
    verified,
    formationYear,
    countryCode,
    status,
    createdAt ?? new Date(),
    updatedAt,
  );
};

// Helper function to create Role instances for tests
const createTestRole = (
  id: number,
  name: string,
  description?: string,
  createdAt?: Date,
  updatedAt?: Date,
): Role => {
  return new Role(id, name, description, createdAt ?? new Date(), updatedAt ?? new Date());
};

describe("ArtistService", () => {
  let artistService: ArtistService;
  let mockArtistQueryPort: jest.Mocked<ArtistQueryPort>;
  let mockArtistCommandPort: jest.Mocked<ArtistCommandPort>;
  let mockLoggerPort: jest.Mocked<LoggerPort>;
  let mockRolePort: jest.Mocked<RolePort>;
  let mockUserRolePort: jest.Mocked<UserRolePort>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockArtistQueryPort = createArtistQueryPortMock();
    mockArtistCommandPort = createArtistCommandPortMock();
    mockLoggerPort = createLoggerPort();
    mockRolePort = createRolePortMock();
    mockUserRolePort = createUserRolePortMock();

    artistService = new ArtistService(
      mockArtistQueryPort,
      mockArtistCommandPort,
      mockLoggerPort,
      mockRolePort,
      mockUserRolePort,
    );
  });

  describe("create", () => {
    describe("Casos Exitosos", () => {
      it("debe crear un artista exitosamente", async () => {
        const request: ArtistCreateRequest = {
          artist_name: "New Artist",
          biography: "A new artist biography",
          formation_year: 2022,
          country_code: "USA",
        };

        mockArtistCommandPort.create.mockResolvedValue(Result.ok(4));

        const result = await artistService.create(request, 1);

        expect(result.success).toBe(true);
        expect(result.data).toBe(4);
        expect(mockArtistCommandPort.create).toHaveBeenCalledWith(
          expect.objectContaining({
            artistName: "New Artist",
            biography: "A new artist biography",
            formationYear: 2022,
            countryCode: "USA",
            verified: false,
            status: ArtistStatus.PENDING,
            artistUserId: 1,
          }),
        );
      });

      it("debe crear un artista sin userId", async () => {
        const request: ArtistCreateRequest = {
          artist_name: "Artist Without User",
          biography: "No user linked",
          formation_year: 2021,
          country_code: "MXX",
        };

        mockArtistCommandPort.create.mockResolvedValue(Result.ok(5));

        const result = await artistService.create(request);

        expect(result.success).toBe(true);
        expect(mockArtistCommandPort.create).toHaveBeenCalledWith(
          expect.objectContaining({
            artistUserId: undefined,
          }),
        );
      });

      it("debe recortar espacios en los campos de texto", async () => {
        const request: ArtistCreateRequest = {
          artist_name: "  Spaced Artist  ",
          biography: "  Biography with spaces  ",
          formation_year: 2020,
          country_code: "  COL  ",
        };

        mockArtistCommandPort.create.mockResolvedValue(Result.ok(6));

        await artistService.create(request, 1);

        expect(mockArtistCommandPort.create).toHaveBeenCalledWith(
          expect.objectContaining({
            artistName: "Spaced Artist",
            biography: "Biography with spaces",
            countryCode: "COL",
          }),
        );
      });
    });

    describe("Casos de Error", () => {
      it("debe fallar con datos inválidos (null)", async () => {
        const result = await artistService.create(null as any);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Datos de artista inválidos");
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar sin artist_name", async () => {
        const request: ArtistCreateRequest = {
          artist_name: "",
          formation_year: 2022,
        };

        const result = await artistService.create(request);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar sin formation_year", async () => {
        const request: ArtistCreateRequest = {
          artist_name: "Artist",
          formation_year: 0,
        };

        const result = await artistService.create(request);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe manejar excepciones inesperadas", async () => {
        const request: ArtistCreateRequest = {
          artist_name: "Test Artist",
          formation_year: 2022,
        };

        mockArtistCommandPort.create.mockRejectedValue(new Error("Database error"));

        const result = await artistService.create(request);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
      });
    });
  });

  describe("createAsAdmin", () => {
    describe("Casos Exitosos", () => {
      it("debe crear un artista como admin (verificado y activo)", async () => {
        const request: ArtistCreateRequest = {
          artist_name: "Admin Created Artist",
          biography: "Created by admin",
          formation_year: 2020,
          country_code: "USA",
        };

        mockArtistCommandPort.create.mockResolvedValue(Result.ok(7));

        const result = await artistService.createAsAdmin(request);

        expect(result.success).toBe(true);
        expect(mockArtistCommandPort.create).toHaveBeenCalledWith(
          expect.objectContaining({
            verified: true,
            status: ArtistStatus.ACTIVE,
            artistUserId: undefined,
          }),
        );
      });
    });

    describe("Casos de Error", () => {
      it("debe fallar con datos inválidos", async () => {
        const result = await artistService.createAsAdmin(null as any);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });
    });
  });

  describe("update", () => {
    describe("Casos Exitosos", () => {
      it("debe actualizar un artista exitosamente", async () => {
        const request: ArtistUpdateRequest = {
          artist_name: "Updated Artist Name",
          biography: "Updated biography",
        };

        mockArtistQueryPort.existsById.mockResolvedValue(Result.ok(true));
        mockArtistCommandPort.update.mockResolvedValue(Result.ok(undefined));

        const result = await artistService.update(1, request);

        expect(result.success).toBe(true);
        expect(mockArtistCommandPort.update).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            artistName: "Updated Artist Name",
            biography: "Updated biography",
          }),
        );
      });

      it("debe actualizar solo campos proporcionados", async () => {
        const request: ArtistUpdateRequest = {
          biography: "Only biography updated",
        };

        mockArtistQueryPort.existsById.mockResolvedValue(Result.ok(true));
        mockArtistCommandPort.update.mockResolvedValue(Result.ok(undefined));

        await artistService.update(1, request);

        expect(mockArtistCommandPort.update).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            biography: "Only biography updated",
            updatedAt: expect.any(Date),
          }),
        );
      });
    });

    describe("Casos de Error", () => {
      it("debe fallar con ID inválido (0)", async () => {
        const result = await artistService.update(0, { artist_name: "Test" });

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("ID inválido");
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar con ID inválido (negativo)", async () => {
        const result = await artistService.update(-1, { artist_name: "Test" });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar sin datos de actualización", async () => {
        const result = await artistService.update(1, null as any);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Datos de actualización requeridos");
      });

      it("debe fallar si el artista no existe", async () => {
        mockArtistQueryPort.existsById.mockResolvedValue(Result.ok(false));

        const result = await artistService.update(999, { artist_name: "Test" });

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Artista no encontrado");
        expect(result.error?.code).toBe(ErrorCodes.VALUE_NOT_FOUND);
      });
    });
  });

  describe("getById", () => {
    describe("Casos Exitosos", () => {
      it("debe obtener un artista por ID exitosamente", async () => {
        mockArtistQueryPort.findById.mockResolvedValue(
          Result.ok(
            createTestArtist(
              1,
              "Test Artist",
              true,
              2020,
              ArtistStatus.ACTIVE,
              undefined,
              "Test bio",
              "USA",
              new Date("2023-01-01"),
              new Date("2023-06-01"),
            ),
          ),
        );

        const result = await artistService.getById(1);

        expect(result.success).toBe(true);
        expect(result.data?.id).toBe(1);
        expect(result.data?.artist_name).toBe("Test Artist");
      });
    });

    describe("Casos de Error", () => {
      it("debe fallar con ID inválido", async () => {
        const result = await artistService.getById(0);

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it("debe fallar si el artista no existe", async () => {
        mockArtistQueryPort.findById.mockResolvedValue(
          Result.fail(new Error("Artista no encontrado")),
        );

        const result = await artistService.getById(999);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Artista no encontrado");
      });
    });
  });

  describe("search", () => {
    it("debe buscar artistas con paginación", async () => {
      const filters = PaginationRequest.create({}, 10);

      mockArtistQueryPort.searchByFilters.mockResolvedValue(
        Result.ok([
          createTestArtist(1, "Artist 1", true, 2020, ArtistStatus.ACTIVE, undefined, "Bio", "USA"),
        ]),
      );

      const result = await artistService.search(filters);

      expect(result.success).toBe(true);
      expect(result.data?.rows).toHaveLength(1);
    });

    it("debe manejar excepciones inesperadas", async () => {
      const filters = PaginationRequest.create({}, 10);

      mockArtistQueryPort.searchByFilters.mockRejectedValue(new Error("DB error"));

      const result = await artistService.search(filters);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
    });
  });

  describe("logicalDelete", () => {
    describe("Casos Exitosos", () => {
      it("debe eliminar lógicamente un artista", async () => {
        mockArtistQueryPort.existsById.mockResolvedValue(Result.ok(true));
        mockArtistCommandPort.logicalDelete.mockResolvedValue(Result.ok(undefined));

        const result = await artistService.logicalDelete(1);

        expect(result.success).toBe(true);
        expect(mockArtistCommandPort.logicalDelete).toHaveBeenCalledWith(1);
      });
    });

    describe("Casos de Error", () => {
      it("debe fallar si el artista no existe", async () => {
        mockArtistQueryPort.existsById.mockResolvedValue(Result.ok(false));

        const result = await artistService.logicalDelete(999);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Artista no encontrado");
      });
    });
  });

  describe("accept", () => {
    describe("Casos Exitosos", () => {
      it("debe aceptar un artista pendiente y asignar rol", async () => {
        mockArtistQueryPort.findById.mockResolvedValue(
          Result.ok(
            createTestArtist(
              2,
              "Pending Artist",
              false,
              2021,
              ArtistStatus.PENDING,
              2,
              "Bio",
              "MEX",
            ),
          ),
        );
        mockArtistCommandPort.updateStatus.mockResolvedValue(Result.ok(undefined));
        mockRolePort.findByName.mockResolvedValue(createTestRole(2, "artist", "Artist role"));
        mockUserRolePort.assignRoleToUser.mockResolvedValue(true);

        const result = await artistService.accept(2);

        expect(result.success).toBe(true);
        expect(mockArtistCommandPort.updateStatus).toHaveBeenCalledWith(2, ArtistStatus.ACTIVE);
        expect(mockUserRolePort.assignRoleToUser).toHaveBeenCalledWith(2, 2);
      });

      it("debe aceptar artista sin usuario vinculado", async () => {
        mockArtistQueryPort.findById.mockResolvedValue(
          Result.ok(
            createTestArtist(
              3,
              "Admin Artist",
              false,
              2019,
              ArtistStatus.PENDING,
              undefined,
              "Bio",
              "COL",
            ),
          ),
        );
        mockArtistCommandPort.updateStatus.mockResolvedValue(Result.ok(undefined));

        const result = await artistService.accept(3);

        expect(result.success).toBe(true);
        expect(mockUserRolePort.assignRoleToUser).not.toHaveBeenCalled();
      });
    });

    describe("Casos de Error", () => {
      it("debe fallar si el artista no existe", async () => {
        mockArtistQueryPort.findById.mockResolvedValue(
          Result.fail(new Error("Artista no encontrado")),
        );

        const result = await artistService.accept(999);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Artista no encontrado");
      });

      it("debe fallar si el artista no está pendiente", async () => {
        mockArtistQueryPort.findById.mockResolvedValue(
          Result.ok(
            createTestArtist(
              1,
              "Active Artist",
              true,
              2020,
              ArtistStatus.ACTIVE,
              undefined,
              "Bio",
              "USA",
              new Date(),
              new Date(),
            ),
          ),
        );

        const result = await artistService.accept(1);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Solo se puede aceptar un artista en estado PENDING");
        expect(result.error?.code).toBe(ErrorCodes.BUSINESS_RULE_VIOLATION);
      });

      it("debe manejar caso cuando rol artist no existe", async () => {
        mockArtistQueryPort.findById.mockResolvedValue(
          Result.ok(
            createTestArtist(
              2,
              "Pending Artist",
              false,
              2021,
              ArtistStatus.PENDING,
              2,
              "Bio",
              "MEX",
            ),
          ),
        );
        mockArtistCommandPort.updateStatus.mockResolvedValue(Result.ok(undefined));
        mockRolePort.findByName.mockResolvedValue(null);

        const result = await artistService.accept(2);

        expect(result.success).toBe(true);
        expect(mockLoggerPort.warn).toHaveBeenCalledWith(
          "Rol 'artist' no existe. No se asignó al usuario.",
        );
      });
    });
  });

  describe("reject", () => {
    describe("Casos Exitosos", () => {
      it("debe rechazar un artista pendiente", async () => {
        mockArtistQueryPort.findById.mockResolvedValue(
          Result.ok(
            createTestArtist(
              2,
              "Pending Artist",
              false,
              2021,
              ArtistStatus.PENDING,
              undefined,
              "Bio",
              "MXZ",
            ),
          ),
        );
        mockArtistCommandPort.updateStatus.mockResolvedValue(Result.ok(undefined));

        const result = await artistService.reject(2);

        expect(result.success).toBe(true);
        expect(mockArtistCommandPort.updateStatus).toHaveBeenCalledWith(2, ArtistStatus.REJECTED);
      });
    });

    describe("Casos de Error", () => {
      it("debe fallar si el artista no existe", async () => {
        mockArtistQueryPort.findById.mockResolvedValue(
          Result.fail(new Error("Artista no encontrado")),
        );

        const result = await artistService.reject(999);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Artista no encontrado");
      });

      it("debe fallar si el artista no está pendiente", async () => {
        mockArtistQueryPort.findById.mockResolvedValue(
          Result.ok(
            createTestArtist(
              1,
              "Active Artist",
              true,
              2020,
              ArtistStatus.ACTIVE,
              undefined,
              "Bio",
              "USA",
              new Date(),
              new Date(),
            ),
          ),
        );

        const result = await artistService.reject(1);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Solo se puede rechazar un artista en estado PENDING");
      });
    });
  });
});
