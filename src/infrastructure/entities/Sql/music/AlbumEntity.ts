import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import ArtistEntity from "./ArtistEntity";
import { UserEntity } from "../seg/index";

@Entity({ name: "album", schema: "music" })
export default class AlbumEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "varchar", length: 100 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ name: "cover_url", type: "varchar", length: 255, nullable: true })
  coverUrl?: string | null;

  @Column({ name: "release_date", type: "date", nullable: true })
  releaseDate?: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone", nullable: true })
  updatedAt!: Date | null;

  @ManyToOne(() => ArtistEntity, { nullable: true })
  @JoinColumn({ name: "artist_id" })
  artist?: ArtistEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user?: UserEntity | null;
}
