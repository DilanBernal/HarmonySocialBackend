import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import UserEntity from "../seg/UserEntity";
import SongEntity from "../music/SongEntity";
import Post from "../../../../domain/models/social/Post";

@Entity({ name: "post", schema: "social" })
export default class PostEntity {
  @PrimaryGeneratedColumn({ type: "bigint", primaryKeyConstraintName: "PK_post_id" })
  id!: number;

  @Index("IDX_post_user_id")
  @ManyToOne(() => UserEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id", foreignKeyConstraintName: "FK_user_id" })
  user!: UserEntity;

  @Index("IDX_post_song_id")
  @ManyToOne(() => SongEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "song_id", foreignKeyConstraintName: "FK_song_id" })
  song!: SongEntity;

  @Index("IDX_post_publication_date")
  @Column({ type: "timestamp", nullable: true })
  publication_date!: Date;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 255 })
  short_description!: string;

  @Column({ type: "bigint" })
  comments_number!: number;

  @Column({ type: "bigint" })
  likes_number!: number;

  @CreateDateColumn({ nullable: false, type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ nullable: true, type: "timestamp", default: null })
  updated_at?: Date;

  /**
   * Converts this entity to a domain object
   */
  toDomain(): Post {
    return new Post(
      this.id,
      this.user?.id,
      this.song?.id,
      this.title,
      this.description,
      this.short_description,
      this.publication_date,
      this.likes_number,
      this.comments_number,
      this.created_at,
      this.updated_at,
    );
  }

  /**
   * Creates an entity from a domain object
   */
  static fromDomain(domain: Post): PostEntity {
    const entity = new PostEntity();
    entity.id = domain.id;
    entity.user = { id: domain.userId } as UserEntity;
    entity.song = { id: domain.songId } as SongEntity;
    entity.title = domain.title;
    entity.description = domain.description;
    entity.short_description = domain.shortDescription;
    entity.publication_date = domain.publicationDate;
    entity.likes_number = domain.likesNumber;
    entity.comments_number = domain.commentsNumber;
    entity.created_at = domain.createdAt;
    entity.updated_at = domain.updatedAt;
    return entity;
  }
}
