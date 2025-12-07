import FriendshipService from "../../../../src/application/services/FriendshipService";
import FriendshipPort from "../../../../src/domain/ports/data/social/FriendshipPort";
import UserQueryPort from "../../../../src/domain/ports/data/seg/query/UserQueryPort";
import EmailPort from "../../../../src/domain/ports/utils/EmailPort";
import LoggerPort from "../../../../src/domain/ports/utils/LoggerPort";
import Friendship, { FrienshipStatus } from "../../../../src/domain/models/social/Friendship";
import FriendshipUsersIdsRequest from "../../../../src/application/dto/requests/Friendship/FriendshipUsersIdsRequest";
import { ApplicationResponse } from "../../../../src/application/shared/ApplicationReponse";
import {
  ApplicationError,
  ErrorCodes,
} from "../../../../src/application/shared/errors/ApplicationError";
import Result from "../../../../src/domain/shared/Result";

import createFriendshipPortMock from "../../mocks/ports/data/social/FriendshipPort.mock";
import createUserQueryPortMock from "../../mocks/ports/data/seg/UserQueryPort.mock";
import createEmailPortMock from "../../mocks/ports/utils/EmailPort.mock";
import createLoggerPort from "../../mocks/ports/extra/LoggerPort.mock";

// Helper function to create test Friendship instances
const createTestFriendship = (
  id: number,
  userId: number,
  friendId: number,
  status: FrienshipStatus,
  createdAt?: Date,
): Friendship => {
  return new Friendship(id, userId, friendId, status, createdAt ?? new Date());
};

describe("FriendshipService", () => {
  let friendshipService: FriendshipService;
  let mockFriendshipPort: jest.Mocked<FriendshipPort>;
  let mockLoggerPort: jest.Mocked<LoggerPort>;
  let mockUserQueryPort: jest.Mocked<UserQueryPort>;
  let mockEmailPort: jest.Mocked<EmailPort>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFriendshipPort = createFriendshipPortMock();
    mockLoggerPort = createLoggerPort();
    mockUserQueryPort = createUserQueryPortMock();
    mockEmailPort = createEmailPortMock();

    friendshipService = new FriendshipService(
      mockFriendshipPort,
      mockLoggerPort,
      mockUserQueryPort,
      mockEmailPort,
    );
  });

  describe("createNewFriendship", () => {
    describe("Casos Exitosos", () => {
      it("debe crear una nueva solicitud de amistad exitosamente", async () => {
        const request: FriendshipUsersIdsRequest = {
          user_id: 1,
          friend_id: 4,
        };

        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockFriendshipPort.getFriendshipByUsersIds.mockResolvedValue(
          ApplicationResponse.success(null),
        );
        mockFriendshipPort.createFriendship.mockResolvedValue(ApplicationResponse.success(true));

        const result = await friendshipService.createNewFriendship(request);

        expect(result.success).toBe(true);
        expect(result.data).toBe(true);
        expect(mockFriendshipPort.createFriendship).toHaveBeenCalledWith(request);
      });

      it("debe informar cuando los usuarios ya son amigos", async () => {
        const request: FriendshipUsersIdsRequest = {
          user_id: 1,
          friend_id: 2,
        };

        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockFriendshipPort.getFriendshipByUsersIds.mockResolvedValue(
          ApplicationResponse.success(createTestFriendship(1, 1, 2, FrienshipStatus.ACCEPTED)),
        );

        const result = await friendshipService.createNewFriendship(request);

        expect(result.success).toBe(true);
        expect(result.data).toBe("Los usuarios ya son amigos");
      });

      it("debe informar cuando ya existe una solicitud pendiente enviada", async () => {
        const request: FriendshipUsersIdsRequest = {
          user_id: 1,
          friend_id: 3,
        };

        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockFriendshipPort.getFriendshipByUsersIds.mockResolvedValue(
          ApplicationResponse.success(createTestFriendship(2, 1, 3, FrienshipStatus.PENDING)),
        );

        const result = await friendshipService.createNewFriendship(request);

        expect(result.success).toBe(true);
        expect(result.data).toBe(
          "Ya has enviado una solicitud de amistad a este usuario y está pendiente de respuesta.",
        );
      });

      it("debe informar cuando el otro usuario ya envió una solicitud pendiente", async () => {
        const request: FriendshipUsersIdsRequest = {
          user_id: 3,
          friend_id: 1,
        };

        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockFriendshipPort.getFriendshipByUsersIds.mockResolvedValue(
          ApplicationResponse.success(createTestFriendship(2, 1, 3, FrienshipStatus.PENDING)),
        );

        const result = await friendshipService.createNewFriendship(request);

        expect(result.success).toBe(true);
        expect(result.data).toBe(
          "El otro usuario ya te envió una solicitud de amistad pendiente. Puedes aceptarla o rechazarla.",
        );
      });

      it("debe crear nueva solicitud cuando la anterior fue rechazada", async () => {
        const request: FriendshipUsersIdsRequest = {
          user_id: 2,
          friend_id: 3,
        };

        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockFriendshipPort.getFriendshipByUsersIds.mockResolvedValue(
          ApplicationResponse.success(createTestFriendship(3, 2, 3, FrienshipStatus.REJECTED)),
        );
        mockFriendshipPort.removeFriendshipById.mockResolvedValue(
          ApplicationResponse.emptySuccess(),
        );
        mockFriendshipPort.createFriendship.mockResolvedValue(ApplicationResponse.success(true));

        const result = await friendshipService.createNewFriendship(request);

        expect(result.success).toBe(true);
        expect(result.data).toBe(true);
        expect(mockFriendshipPort.removeFriendshipById).toHaveBeenCalledWith(3);
        expect(mockFriendshipPort.createFriendship).toHaveBeenCalledWith(request);
      });
    });

    describe("Casos de Error", () => {
      it("debe fallar cuando el usuario remitente no existe", async () => {
        const request: FriendshipUsersIdsRequest = {
          user_id: 999,
          friend_id: 2,
        };

        mockUserQueryPort.existsUserById.mockResolvedValueOnce(Result.ok(false));

        const result = await friendshipService.createNewFriendship(request);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("El usuario remitente no existe");
        expect(result.error?.code).toBe(ErrorCodes.VALUE_NOT_FOUND);
      });

      it("debe fallar cuando el usuario destinatario no existe", async () => {
        const request: FriendshipUsersIdsRequest = {
          user_id: 1,
          friend_id: 999,
        };

        mockUserQueryPort.existsUserById
          .mockResolvedValueOnce(Result.ok(true))
          .mockResolvedValueOnce(Result.ok(false));

        const result = await friendshipService.createNewFriendship(request);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("El usuario destinatario no existe");
        expect(result.error?.code).toBe(ErrorCodes.VALUE_NOT_FOUND);
      });

      it("debe manejar error al eliminar relación rechazada anterior", async () => {
        const request: FriendshipUsersIdsRequest = {
          user_id: 2,
          friend_id: 3,
        };

        mockUserQueryPort.existsUserById.mockResolvedValue(Result.ok(true));
        mockFriendshipPort.getFriendshipByUsersIds.mockResolvedValue(
          ApplicationResponse.success(createTestFriendship(3, 2, 3, FrienshipStatus.REJECTED)),
        );
        mockFriendshipPort.removeFriendshipById.mockResolvedValue(
          ApplicationResponse.failure(
            new ApplicationError("Error en DB", ErrorCodes.DATABASE_ERROR),
          ),
        );

        const result = await friendshipService.createNewFriendship(request);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Error al eliminar la relación rechazada anterior");
      });

      it("debe manejar excepciones inesperadas", async () => {
        const request: FriendshipUsersIdsRequest = {
          user_id: 1,
          friend_id: 2,
        };

        mockUserQueryPort.existsUserById.mockRejectedValue(new Error("Database error"));

        const result = await friendshipService.createNewFriendship(request);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Error al crear la solicitud de amistad");
        expect(result.error?.code).toBe(ErrorCodes.SERVER_ERROR);
      });
    });
  });

  describe("aceptFriendship", () => {
    describe("Casos Exitosos", () => {
      it("debe aceptar una solicitud pendiente exitosamente", async () => {
        mockFriendshipPort.getFriendshipById.mockResolvedValue(
          ApplicationResponse.success(createTestFriendship(2, 1, 3, FrienshipStatus.PENDING)),
        );
        mockFriendshipPort.aproveFrienshipRequest.mockResolvedValue(
          ApplicationResponse.emptySuccess(),
        );

        const result = await friendshipService.aceptFriendship(2);

        expect(result.success).toBe(true);
        expect(result.data).toBe("Solicitud de amistad aceptada correctamente");
        expect(mockFriendshipPort.aproveFrienshipRequest).toHaveBeenCalledWith(2);
      });

      it("debe informar cuando la solicitud ya fue aceptada", async () => {
        mockFriendshipPort.getFriendshipById.mockResolvedValue(
          ApplicationResponse.success(createTestFriendship(1, 1, 2, FrienshipStatus.ACCEPTED)),
        );

        const result = await friendshipService.aceptFriendship(1);

        expect(result.success).toBe(true);
        expect(result.data).toBe("Esta solicitud de amistad ya fue aceptada previamente");
      });

      it("debe informar cuando la solicitud ya fue rechazada", async () => {
        mockFriendshipPort.getFriendshipById.mockResolvedValue(
          ApplicationResponse.success(createTestFriendship(3, 2, 3, FrienshipStatus.REJECTED)),
        );

        const result = await friendshipService.aceptFriendship(3);

        expect(result.success).toBe(true);
        expect(result.data).toBe("Esta solicitud de amistad ya fue rechazada previamente");
      });
    });

    describe("Casos de Error", () => {
      it("debe fallar cuando la solicitud no existe", async () => {
        mockFriendshipPort.getFriendshipById.mockResolvedValue(
          ApplicationResponse.failure(
            new ApplicationError("No encontrado", ErrorCodes.VALUE_NOT_FOUND),
          ),
        );

        const result = await friendshipService.aceptFriendship(999);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("No se encontró la solicitud de amistad");
      });

      it("debe fallar cuando la respuesta no tiene datos", async () => {
        mockFriendshipPort.getFriendshipById.mockResolvedValue(ApplicationResponse.success(null));

        const result = await friendshipService.aceptFriendship(999);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("No se encontró la solicitud de amistad");
      });

      it("debe manejar excepciones inesperadas", async () => {
        mockFriendshipPort.getFriendshipById.mockRejectedValue(new Error("DB error"));

        const result = await friendshipService.aceptFriendship(1);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Error al aceptar la solicitud de amistad");
      });
    });
  });

  describe("rejectFriendship", () => {
    describe("Casos Exitosos", () => {
      it("debe rechazar una solicitud pendiente exitosamente", async () => {
        mockFriendshipPort.getFriendshipById.mockResolvedValue(
          ApplicationResponse.success(createTestFriendship(2, 1, 3, FrienshipStatus.PENDING)),
        );
        mockFriendshipPort.rejectFrienshipRequest.mockResolvedValue(
          ApplicationResponse.emptySuccess(),
        );

        const result = await friendshipService.rejectFriendship(2);

        expect(result.success).toBe(true);
        expect(result.data).toBe("Solicitud de amistad rechazada correctamente");
        expect(mockFriendshipPort.rejectFrienshipRequest).toHaveBeenCalledWith(2);
      });

      it("debe informar cuando la solicitud ya fue aceptada", async () => {
        mockFriendshipPort.getFriendshipById.mockResolvedValue(
          ApplicationResponse.success(createTestFriendship(1, 1, 2, FrienshipStatus.ACCEPTED)),
        );

        const result = await friendshipService.rejectFriendship(1);

        expect(result.success).toBe(true);
        expect(result.data).toBe(
          "Esta solicitud de amistad ya fue aceptada previamente, no se puede rechazar",
        );
      });

      it("debe informar cuando la solicitud ya fue rechazada", async () => {
        mockFriendshipPort.getFriendshipById.mockResolvedValue(
          ApplicationResponse.success(createTestFriendship(3, 2, 3, FrienshipStatus.REJECTED)),
        );

        const result = await friendshipService.rejectFriendship(3);

        expect(result.success).toBe(true);
        expect(result.data).toBe("Esta solicitud de amistad ya fue rechazada previamente");
      });
    });

    describe("Casos de Error", () => {
      it("debe fallar cuando la solicitud no existe", async () => {
        mockFriendshipPort.getFriendshipById.mockResolvedValue(
          ApplicationResponse.failure(
            new ApplicationError("No encontrado", ErrorCodes.VALUE_NOT_FOUND),
          ),
        );

        const result = await friendshipService.rejectFriendship(999);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("No se encontró la solicitud de amistad");
      });

      it("debe manejar excepciones inesperadas", async () => {
        mockFriendshipPort.getFriendshipById.mockRejectedValue(new Error("DB error"));

        const result = await friendshipService.rejectFriendship(1);

        expect(result.success).toBe(false);
        expect(result.error?.message).toBe("Error al rechazar la solicitud de amistad");
      });
    });
  });

  describe("getUserFriendships", () => {
    it("debe obtener las amistades de un usuario exitosamente", async () => {
      mockFriendshipPort.getAllFriendshipsByUser.mockResolvedValue(
        ApplicationResponse.success({
          friendships: [
            {
              id: 1,
              user_id: 1,
              friend_id: 2,
              status: FrienshipStatus.ACCEPTED,
              created_at: new Date(),
            },
          ],
          total: 1,
        } as any),
      );

      const result = await friendshipService.getUserFriendships(1);

      expect(result.success).toBe(true);
      expect(result.data?.friendships).toHaveLength(1);
      expect(mockFriendshipPort.getAllFriendshipsByUser).toHaveBeenCalledWith(1);
    });

    it("debe manejar errores del puerto", async () => {
      mockFriendshipPort.getAllFriendshipsByUser.mockResolvedValue(
        ApplicationResponse.failure(new ApplicationError("Error en DB", ErrorCodes.DATABASE_ERROR)),
      );

      const result = await friendshipService.getUserFriendships(1);

      expect(result.success).toBe(false);
    });

    it("debe manejar excepciones inesperadas", async () => {
      mockFriendshipPort.getAllFriendshipsByUser.mockRejectedValue(new Error("DB error"));

      const result = await friendshipService.getUserFriendships(1);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Error al obtener las amistades del usuario");
    });
  });

  describe("deleteFriendship", () => {
    it("debe eliminar una amistad exitosamente", async () => {
      const request: FriendshipUsersIdsRequest = {
        user_id: 1,
        friend_id: 2,
      };

      mockFriendshipPort.removeFriendshipByUsersIds.mockResolvedValue(
        ApplicationResponse.emptySuccess(),
      );

      const result = await friendshipService.deleteFriendship(request);

      expect(result.success).toBe(true);
      expect(mockFriendshipPort.removeFriendshipByUsersIds).toHaveBeenCalledWith(request);
    });

    it("debe manejar error cuando no existe la amistad", async () => {
      const request: FriendshipUsersIdsRequest = {
        user_id: 1,
        friend_id: 999,
      };

      mockFriendshipPort.removeFriendshipByUsersIds.mockResolvedValue(
        ApplicationResponse.failure(
          new ApplicationError("No encontrada", ErrorCodes.VALUE_NOT_FOUND),
        ),
      );

      const result = await friendshipService.deleteFriendship(request);

      expect(result.success).toBe(false);
    });

    it("debe manejar excepciones inesperadas", async () => {
      const request: FriendshipUsersIdsRequest = {
        user_id: 1,
        friend_id: 2,
      };

      mockFriendshipPort.removeFriendshipByUsersIds.mockRejectedValue(new Error("DB error"));

      const result = await friendshipService.deleteFriendship(request);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Error al eliminar la amistad");
    });
  });

  describe("deleteFriendshipById", () => {
    it("debe eliminar una amistad por ID exitosamente", async () => {
      mockFriendshipPort.removeFriendshipById.mockResolvedValue(ApplicationResponse.emptySuccess());

      const result = await friendshipService.deleteFriendshipById(1);

      expect(result.success).toBe(true);
      expect(mockFriendshipPort.removeFriendshipById).toHaveBeenCalledWith(1);
    });

    it("debe manejar excepciones inesperadas", async () => {
      mockFriendshipPort.removeFriendshipById.mockRejectedValue(new Error("DB error"));

      const result = await friendshipService.deleteFriendshipById(1);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Error al eliminar la amistad por ID");
    });
  });

  describe("getCommonFriendships", () => {
    it("debe obtener amistades comunes exitosamente", async () => {
      mockFriendshipPort.getAllCommonFriendships.mockResolvedValue(
        ApplicationResponse.success({
          friendships: [],
          total: 0,
        } as any),
      );

      const result = await friendshipService.getCommonFriendships(1, 2);

      expect(result.success).toBe(true);
      expect(mockFriendshipPort.getAllCommonFriendships).toHaveBeenCalledWith({
        user_id: 1,
        friend_id: 2,
      });
    });

    it("debe manejar excepciones inesperadas", async () => {
      mockFriendshipPort.getAllCommonFriendships.mockRejectedValue(new Error("DB error"));

      const result = await friendshipService.getCommonFriendships(1, 2);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Ocurrio un error al buscar las amistades");
    });
  });

  describe("getFriendshipById", () => {
    it("debe obtener una amistad por ID exitosamente", async () => {
      mockFriendshipPort.getFriendshipById.mockResolvedValue(
        ApplicationResponse.success(createTestFriendship(1, 1, 2, FrienshipStatus.ACCEPTED)),
      );

      const result = await friendshipService.getFriendshipById(1);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(1);
    });

    it("debe manejar excepciones inesperadas", async () => {
      mockFriendshipPort.getFriendshipById.mockRejectedValue(new Error("DB error"));

      const result = await friendshipService.getFriendshipById(1);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Error al obtener la amistad por ID");
    });
  });
});
