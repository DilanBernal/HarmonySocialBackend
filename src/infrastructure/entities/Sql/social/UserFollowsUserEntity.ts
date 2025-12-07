import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import UserEntity from "../seg/UserEntity";
import UserFollowsUser from "../../../../domain/models/social/UserFollowsUser";

@Entity({ name: "user_follows_user", schema: "social" })
export default class UserFollowEntity {
  @PrimaryGeneratedColumn({ type: "bigint", primaryKeyConstraintName: "PK_User_follows_user_id" })
  id!: number;

  @ManyToOne(() => UserEntity, { nullable: false, onUpdate: "CASCADE" })
  @JoinColumn({ name: "follower_id", foreignKeyConstraintName: "FK_user_follower_id" })
  follower!: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: "followed_id", foreignKeyConstraintName: "FK_user_followed_id" })
  followed!: UserEntity;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  /**
   * Converts this entity to a domain object
   */
  toDomain(): UserFollowsUser {
    const followerId = this.follower?.id;
    const followedId = this.followed?.id;

    if (!followerId || !followedId) {
      throw new Error("Cannot convert to domain: follower or followed user is missing");
    }

    return new UserFollowsUser(this.id, followerId, followedId, this.createdAt);
  }

  /**
   * Creates an entity from a domain object
   */
  static fromDomain(domain: UserFollowsUser): UserFollowEntity {
    const entity = new UserFollowEntity();
    entity.id = domain.id;
    entity.follower = { id: domain.userIdFollower } as UserEntity;
    entity.followed = { id: domain.userIdFollowed } as UserEntity;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
