import UserFollowsUser from "../../../models/social/UserFollowsUser";

export interface UserFollowRepository {
  follow(followerId: number, followedId: number): Promise<UserFollowsUser>;
  unfollow(followerId: number, followedId: number): Promise<void>;
  getFollowers(userId: number): Promise<UserFollowsUser[]>;
  getFollowing(userId: number): Promise<UserFollowsUser[]>;
  exists(followerId: number, followedId: number): Promise<boolean>;
}
