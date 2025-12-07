import { UserFollowRepository } from "../../domain/ports/data/social/UserFollowsUserPort";
import UserFollowsUser from "../../domain/models/social/UserFollowsUser";

export class UserFollowService {
  constructor(private userFollowRepo: UserFollowRepository) {}

  async follow(followerId: number, followedId: number): Promise<UserFollowsUser> {
    if (followerId === followedId) throw new Error("Cannot follow yourself");
    const exists = await this.userFollowRepo.exists(followerId, followedId);
    if (exists) throw new Error("Already following");
    return this.userFollowRepo.follow(followerId, followedId);
  }

  async unfollow(followerId: number, followedId: number): Promise<void> {
    return this.userFollowRepo.unfollow(followerId, followedId);
  }

  async getFollowers(userId: number): Promise<UserFollowsUser[]> {
    return this.userFollowRepo.getFollowers(userId);
  }

  async getFollowing(userId: number): Promise<UserFollowsUser[]> {
    return this.userFollowRepo.getFollowing(userId);
  }
}
