import { JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import SongEntity from "./SongEntity";

export default class MusicTheoryEntity {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @OneToOne(() => SongEntity)
  @JoinColumn({ name: "song_id" })
  song!: SongEntity;
}
