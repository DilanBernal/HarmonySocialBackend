import { UserFollowService } from "../../../../src/application/services/FollowService";
import { UserFollowRepository } from "../../../../src/domain/ports/data/social/UserFollowsUserPort";
import UserFollowsUser from "../../../../src/domain/models/social/UserFollowsUser";

import createUserFollowRepositoryMock from "../../mocks/ports/data/social/UserFollowRepository.mock";

// Helper function to create test UserFollowsUser instances
const createTestFollow = (
  id: number,
  followerId: number,
  followedId: number,
  createdAt?: Date,
): UserFollowsUser => {
  return new UserFollowsUser(id, followerId, followedId, createdAt ?? new Date());
};

describe("UserFollowService", () => {
  let userFollowService: UserFollowService;
  let mockUserFollowRepo: jest.Mocked<UserFollowRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserFollowRepo = createUserFollowRepositoryMock();

    userFollowService = new UserFollowService(mockUserFollowRepo);
  });

  describe("follow", () => {
    describe("Casos Exitosos", () => {
      it("debe crear un follow exitosamente", async () => {
        const newFollow = createTestFollow(4, 3, 4);

        mockUserFollowRepo.exists.mockResolvedValue(false);
        mockUserFollowRepo.follow.mockResolvedValue(newFollow);

        const result = await userFollowService.follow(3, 4);

        expect(result).toEqual(newFollow);
        expect(mockUserFollowRepo.exists).toHaveBeenCalledWith(3, 4);
        expect(mockUserFollowRepo.follow).toHaveBeenCalledWith(3, 4);
      });
    });

    describe("Casos de Error", () => {
      it("debe lanzar error cuando intenta seguirse a sí mismo", async () => {
        await expect(userFollowService.follow(1, 1)).rejects.toThrow("Cannot follow yourself");

        expect(mockUserFollowRepo.exists).not.toHaveBeenCalled();
        expect(mockUserFollowRepo.follow).not.toHaveBeenCalled();
      });

      it("debe lanzar error cuando ya sigue al usuario", async () => {
        mockUserFollowRepo.exists.mockResolvedValue(true);

        await expect(userFollowService.follow(1, 2)).rejects.toThrow("Already following");

        expect(mockUserFollowRepo.exists).toHaveBeenCalledWith(1, 2);
        expect(mockUserFollowRepo.follow).not.toHaveBeenCalled();
      });

      it("debe propagar errores del repositorio", async () => {
        mockUserFollowRepo.exists.mockResolvedValue(false);
        mockUserFollowRepo.follow.mockRejectedValue(new Error("Database error"));

        await expect(userFollowService.follow(3, 4)).rejects.toThrow("Database error");
      });
    });
  });

  describe("unfollow", () => {
    describe("Casos Exitosos", () => {
      it("debe eliminar un follow exitosamente", async () => {
        mockUserFollowRepo.unfollow.mockResolvedValue(undefined);

        await userFollowService.unfollow(1, 2);

        expect(mockUserFollowRepo.unfollow).toHaveBeenCalledWith(1, 2);
      });

      it("debe completar sin error si no existía el follow", async () => {
        mockUserFollowRepo.unfollow.mockResolvedValue(undefined);

        await expect(userFollowService.unfollow(99, 99)).resolves.toBeUndefined();
      });
    });

    describe("Casos de Error", () => {
      it("debe propagar errores del repositorio", async () => {
        mockUserFollowRepo.unfollow.mockRejectedValue(new Error("Database error"));

        await expect(userFollowService.unfollow(1, 2)).rejects.toThrow("Database error");
      });
    });
  });

  describe("getFollowers", () => {
    describe("Casos Exitosos", () => {
      it("debe obtener los seguidores de un usuario", async () => {
        const mockFollowers: UserFollowsUser[] = [createTestFollow(3, 2, 1)];

        mockUserFollowRepo.getFollowers.mockResolvedValue(mockFollowers);

        const result = await userFollowService.getFollowers(1);

        expect(result).toEqual(mockFollowers);
        expect(result).toHaveLength(1);
        expect(mockUserFollowRepo.getFollowers).toHaveBeenCalledWith(1);
      });

      it("debe retornar lista vacía cuando no tiene seguidores", async () => {
        mockUserFollowRepo.getFollowers.mockResolvedValue([]);

        const result = await userFollowService.getFollowers(999);

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe("Casos de Error", () => {
      it("debe propagar errores del repositorio", async () => {
        mockUserFollowRepo.getFollowers.mockRejectedValue(new Error("Database error"));

        await expect(userFollowService.getFollowers(1)).rejects.toThrow("Database error");
      });
    });
  });

  describe("getFollowing", () => {
    describe("Casos Exitosos", () => {
      it("debe obtener los usuarios que sigue", async () => {
        const mockFollowing: UserFollowsUser[] = [
          createTestFollow(1, 1, 2),
          createTestFollow(2, 1, 3),
        ];

        mockUserFollowRepo.getFollowing.mockResolvedValue(mockFollowing);

        const result = await userFollowService.getFollowing(1);

        expect(result).toEqual(mockFollowing);
        expect(result).toHaveLength(2);
        expect(mockUserFollowRepo.getFollowing).toHaveBeenCalledWith(1);
      });

      it("debe retornar lista vacía cuando no sigue a nadie", async () => {
        mockUserFollowRepo.getFollowing.mockResolvedValue([]);

        const result = await userFollowService.getFollowing(999);

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe("Casos de Error", () => {
      it("debe propagar errores del repositorio", async () => {
        mockUserFollowRepo.getFollowing.mockRejectedValue(new Error("Database error"));

        await expect(userFollowService.getFollowing(1)).rejects.toThrow("Database error");
      });
    });
  });

  describe("Integración de Mocks", () => {
    it("debe verificar que todos los mocks están correctamente configurados", () => {
      expect(mockUserFollowRepo).toBeDefined();
      expect(mockUserFollowRepo.follow).toBeDefined();
      expect(mockUserFollowRepo.unfollow).toBeDefined();
      expect(mockUserFollowRepo.getFollowers).toBeDefined();
      expect(mockUserFollowRepo.getFollowing).toBeDefined();
      expect(mockUserFollowRepo.exists).toBeDefined();

      expect(userFollowService).toBeDefined();
      expect(typeof userFollowService.follow).toBe("function");
      expect(typeof userFollowService.unfollow).toBe("function");
      expect(typeof userFollowService.getFollowers).toBe("function");
      expect(typeof userFollowService.getFollowing).toBe("function");
    });

    it("debe limpiar mocks entre tests", () => {
      mockUserFollowRepo.getFollowers.mockResolvedValue([]);

      expect(mockUserFollowRepo.getFollowers).toHaveBeenCalledTimes(0);

      userFollowService.getFollowers(1);
      expect(mockUserFollowRepo.getFollowers).toHaveBeenCalledTimes(1);
    });
  });
});
