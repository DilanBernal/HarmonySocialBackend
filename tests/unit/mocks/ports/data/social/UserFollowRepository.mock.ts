import { UserFollowRepository } from "../../../../../../src/domain/ports/data/social/UserFollowsUserPort";
import UserFollowsUser from "../../../../../../src/domain/models/social/UserFollowsUser";

// Helper function to create UserFollowsUser instances
const createMockFollow = (
  id: number,
  followerId: number,
  followedId: number,
  createdAt?: Date,
): UserFollowsUser => {
  return new UserFollowsUser(id, followerId, followedId, createdAt ?? new Date());
};

// Mock data for follows
const createMockFollows = (): UserFollowsUser[] => [
  createMockFollow(1, 1, 2, new Date(Date.now() - 86400000)), // 1 day ago
  createMockFollow(2, 1, 3, new Date(Date.now() - 43200000)), // 12 hours ago
  createMockFollow(3, 2, 1, new Date(Date.now() - 3600000)), // 1 hour ago
];

let nextId = 4;

const createUserFollowRepositoryMock = (): jest.Mocked<UserFollowRepository> => {
  // Clone the array to avoid mutation between tests
  let follows = createMockFollows();

  return {
    follow: jest
      .fn()
      .mockImplementation(
        async (followerId: number, followedId: number): Promise<UserFollowsUser> => {
          // Check if already following
          const existing = follows.find(
            (f) => f.userIdFollower === followerId && f.userIdFollowed === followedId,
          );

          if (existing) {
            throw new Error("Already following");
          }

          // Check if trying to follow yourself
          if (followerId === followedId) {
            throw new Error("Cannot follow yourself");
          }

          // Create new follow
          const newFollow = createMockFollow(nextId++, followerId, followedId);

          follows.push(newFollow);
          return newFollow;
        },
      ),

    unfollow: jest
      .fn()
      .mockImplementation(async (followerId: number, followedId: number): Promise<void> => {
        const index = follows.findIndex(
          (f) => f.userIdFollower === followerId && f.userIdFollowed === followedId,
        );

        if (index === -1) {
          // Silently ignore if not following
          return;
        }

        follows.splice(index, 1);
      }),

    getFollowers: jest
      .fn()
      .mockImplementation(async (userId: number): Promise<UserFollowsUser[]> => {
        return follows.filter((f) => f.userIdFollowed === userId);
      }),

    getFollowing: jest
      .fn()
      .mockImplementation(async (userId: number): Promise<UserFollowsUser[]> => {
        return follows.filter((f) => f.userIdFollower === userId);
      }),

    exists: jest
      .fn()
      .mockImplementation(async (followerId: number, followedId: number): Promise<boolean> => {
        return follows.some(
          (f) => f.userIdFollower === followerId && f.userIdFollowed === followedId,
        );
      }),
  };
};

export default createUserFollowRepositoryMock;
