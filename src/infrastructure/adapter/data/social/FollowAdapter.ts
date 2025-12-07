// src/infrastructure/adapters/PostgresUserFollowRepository.ts
import { Pool } from "pg";
import UserFollowsUser from "../../../../domain/models/social/UserFollowsUser";
import { UserFollowRepository } from "../../../../domain/ports/data/social/UserFollowsUserPort";

export class PostgresUserFollowRepository implements UserFollowRepository {
  constructor(private pool: Pool) {}

  async follow(followerId: number, followedId: number): Promise<UserFollowsUser> {
    const result = await this.pool.query(
      `INSERT INTO user_follows_user (follower_id, followed_id)
       VALUES ($1, $2) ON CONFLICT (follower_id, followed_id) DO NOTHING
       RETURNING id, follower_id, followed_id, created_at`,
      [followerId, followedId],
    );

    if (!result.rows[0]) throw new Error("Already following");

    const row = result.rows[0];
    return new UserFollowsUser(row.id, row.follower_id, row.followed_id, new Date(row.created_at));
  }

  async unfollow(followerId: number, followedId: number): Promise<void> {
    await this.pool.query(
      `DELETE FROM user_follows_user WHERE follower_id = $1 AND followed_id = $2`,
      [followerId, followedId],
    );
  }

  async getFollowers(userId: number): Promise<UserFollowsUser[]> {
    const result = await this.pool.query(`SELECT * FROM user_follows_user WHERE followed_id = $1`, [
      userId,
    ]);
    return result.rows.map(
      (row) =>
        new UserFollowsUser(row.id, row.follower_id, row.followed_id, new Date(row.created_at)),
    );
  }

  async getFollowing(userId: number): Promise<UserFollowsUser[]> {
    const result = await this.pool.query(`SELECT * FROM user_follows_user WHERE follower_id = $1`, [
      userId,
    ]);
    return result.rows.map(
      (row) =>
        new UserFollowsUser(row.id, row.follower_id, row.followed_id, new Date(row.created_at)),
    );
  }

  async exists(followerId: number, followedId: number): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM user_follows_user WHERE follower_id = $1 AND followed_id = $2`,
      [followerId, followedId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
