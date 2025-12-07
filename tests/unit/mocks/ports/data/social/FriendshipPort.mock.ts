import FriendshipPort from "../../../../../../src/domain/ports/data/social/FriendshipPort";
import Friendship, { FrienshipStatus } from "../../../../../../src/domain/models/social/Friendship";
import FriendshipUsersIdsRequest from "../../../../../../src/application/dto/requests/Friendship/FriendshipUsersIdsRequest";
import FriendshipsResponse from "../../../../../../src/application/dto/responses/FriendshipsResponse";
import { ApplicationResponse } from "../../../../../../src/application/shared/ApplicationReponse";
import {
  ApplicationError,
  ErrorCodes,
} from "../../../../../../src/application/shared/errors/ApplicationError";

// Helper function to create Friendship instances
const createMockFriendship = (
  id: number,
  userId: number,
  friendId: number,
  status: FrienshipStatus,
  createdAt?: Date,
  updatedAt?: Date,
): Friendship => {
  return new Friendship(id, userId, friendId, status, createdAt ?? new Date(), updatedAt);
};

// Mock data for friendships
const createMockFriendships = (): Friendship[] => [
  createMockFriendship(
    1,
    1,
    2,
    FrienshipStatus.ACCEPTED,
    new Date("2023-01-15"),
    new Date("2023-01-16"),
  ),
  createMockFriendship(2, 1, 3, FrienshipStatus.PENDING, new Date("2023-02-01"), undefined),
  createMockFriendship(
    3,
    2,
    3,
    FrienshipStatus.REJECTED,
    new Date("2023-02-10"),
    new Date("2023-02-11"),
  ),
];

let nextId = 4;

const createFriendshipPortMock = (): jest.Mocked<FriendshipPort> => {
  // Clone the array to avoid mutation between tests
  let friendships = createMockFriendships();

  return {
    createFriendship: jest
      .fn()
      .mockImplementation(
        async (req: FriendshipUsersIdsRequest): Promise<ApplicationResponse<boolean>> => {
          // Check if friendship already exists
          const existing = friendships.find(
            (f) =>
              (f.userId === req.user_id && f.friendId === req.friend_id) ||
              (f.userId === req.friend_id && f.friendId === req.user_id),
          );

          if (existing) {
            return ApplicationResponse.failure(
              new ApplicationError("La amistad ya existe", ErrorCodes.DATABASE_ERROR),
            );
          }

          // Create new friendship
          const newFriendship = createMockFriendship(
            nextId++,
            req.user_id,
            req.friend_id,
            FrienshipStatus.PENDING,
          );

          friendships.push(newFriendship);
          return ApplicationResponse.success(true);
        },
      ),

    deleteFriendship: jest
      .fn()
      .mockImplementation(async (id: number): Promise<ApplicationResponse<boolean>> => {
        const index = friendships.findIndex((f) => f.id === id);
        if (index === -1) {
          return ApplicationResponse.failure(
            new ApplicationError("Amistad no encontrada", ErrorCodes.VALUE_NOT_FOUND),
          );
        }

        friendships.splice(index, 1);
        return ApplicationResponse.success(true);
      }),

    getAllFriendshipsByUser: jest
      .fn()
      .mockImplementation(async (id: number): Promise<ApplicationResponse<FriendshipsResponse>> => {
        const userFriendships = friendships.filter(
          (f) => (f.userId === id || f.friendId === id) && f.status === FrienshipStatus.ACCEPTED,
        );

        return ApplicationResponse.success({
          friendships: userFriendships.map((f) => ({
            id: f.id,
            user_id: f.userId,
            friend_id: f.friendId,
            status: f.status,
          })),
          total: userFriendships.length,
        } as FriendshipsResponse);
      }),

    getAllCommonFriendships: jest
      .fn()
      .mockImplementation(
        async (
          req: FriendshipUsersIdsRequest,
        ): Promise<ApplicationResponse<FriendshipsResponse>> => {
          // Get friends of user 1
          const user1Friends = friendships
            .filter(
              (f) =>
                (f.userId === req.user_id || f.friendId === req.user_id) &&
                f.status === FrienshipStatus.ACCEPTED,
            )
            .map((f) => (f.userId === req.user_id ? f.friendId : f.userId));

          // Get friends of user 2
          const user2Friends = friendships
            .filter(
              (f) =>
                (f.userId === req.friend_id || f.friendId === req.friend_id) &&
                f.status === FrienshipStatus.ACCEPTED,
            )
            .map((f) => (f.userId === req.friend_id ? f.friendId : f.userId));

          // Find common friends
          const commonFriendIds = user1Friends.filter((id) => user2Friends.includes(id));
          const commonFriendships = friendships.filter(
            (f) => commonFriendIds.includes(f.userId) || commonFriendIds.includes(f.friendId),
          );

          return ApplicationResponse.success({
            friendships: commonFriendships.map((f) => ({
              id: f.id,
              user_id: f.userId,
              friend_id: f.friendId,
              status: f.status,
            })),
            total: commonFriendships.length,
          } as FriendshipsResponse);
        },
      ),

    getFrienshipsByUserAndSimilarName: jest
      .fn()
      .mockImplementation(
        async (id: number, name: string): Promise<ApplicationResponse<FriendshipsResponse>> => {
          // Return all friendships for the user (name filtering would require user data)
          const userFriendships = friendships.filter(
            (f) => (f.userId === id || f.friendId === id) && f.status === FrienshipStatus.ACCEPTED,
          );

          return ApplicationResponse.success({
            friendships: userFriendships.map((f) => ({
              id: f.id,
              user_id: f.userId,
              friend_id: f.friendId,
              status: f.status,
            })),
            total: userFriendships.length,
          } as FriendshipsResponse);
        },
      ),

    getFriendshipByUsersIds: jest
      .fn()
      .mockImplementation(
        async (req: FriendshipUsersIdsRequest): Promise<ApplicationResponse<Friendship | null>> => {
          const friendship = friendships.find(
            (f) =>
              (f.userId === req.user_id && f.friendId === req.friend_id) ||
              (f.userId === req.friend_id && f.friendId === req.user_id),
          );

          return ApplicationResponse.success(friendship || null);
        },
      ),

    getFriendshipById: jest
      .fn()
      .mockImplementation(async (id: number): Promise<ApplicationResponse<Friendship | null>> => {
        const friendship = friendships.find((f) => f.id === id);
        return ApplicationResponse.success(friendship || null);
      }),

    removeFriendshipById: jest
      .fn()
      .mockImplementation(async (id: number): Promise<ApplicationResponse> => {
        const index = friendships.findIndex((f) => f.id === id);
        if (index === -1) {
          return ApplicationResponse.failure(
            new ApplicationError("Amistad no encontrada", ErrorCodes.VALUE_NOT_FOUND),
          );
        }

        friendships.splice(index, 1);
        return ApplicationResponse.emptySuccess();
      }),

    removeFriendshipByUsersIds: jest
      .fn()
      .mockImplementation(async (req: FriendshipUsersIdsRequest): Promise<ApplicationResponse> => {
        const index = friendships.findIndex(
          (f) =>
            (f.userId === req.user_id && f.friendId === req.friend_id) ||
            (f.userId === req.friend_id && f.friendId === req.user_id),
        );

        if (index === -1) {
          return ApplicationResponse.failure(
            new ApplicationError("Amistad no encontrada", ErrorCodes.VALUE_NOT_FOUND),
          );
        }

        friendships.splice(index, 1);
        return ApplicationResponse.emptySuccess();
      }),

    aproveFrienshipRequest: jest
      .fn()
      .mockImplementation(async (id: number): Promise<ApplicationResponse> => {
        const friendship = friendships.find((f) => f.id === id);
        if (!friendship) {
          return ApplicationResponse.failure(
            new ApplicationError("Amistad no encontrada", ErrorCodes.VALUE_NOT_FOUND),
          );
        }

        if (friendship.status !== FrienshipStatus.PENDING) {
          return ApplicationResponse.failure(
            new ApplicationError(
              "La solicitud no está pendiente",
              ErrorCodes.BUSINESS_RULE_VIOLATION,
            ),
          );
        }

        friendship.accept();
        return ApplicationResponse.emptySuccess();
      }),

    rejectFrienshipRequest: jest
      .fn()
      .mockImplementation(async (id: number): Promise<ApplicationResponse> => {
        const friendship = friendships.find((f) => f.id === id);
        if (!friendship) {
          return ApplicationResponse.failure(
            new ApplicationError("Amistad no encontrada", ErrorCodes.VALUE_NOT_FOUND),
          );
        }

        if (friendship.status !== FrienshipStatus.PENDING) {
          return ApplicationResponse.failure(
            new ApplicationError(
              "La solicitud no está pendiente",
              ErrorCodes.BUSINESS_RULE_VIOLATION,
            ),
          );
        }

        friendship.reject();
        return ApplicationResponse.emptySuccess();
      }),
  };
};

export default createFriendshipPortMock;
