import { DeepPartial, Repository } from "typeorm";
import Song from "../../../../domain/models/music/Song";
import SongCommandPort from "../../../../domain/ports/data/music/command/SongCommandPort";
import Result from "../../../../domain/shared/Result";
import { SongEntity } from "../../../entities/Sql/music";
import { SqlAppDataSource } from "../../../config/con_database";

const toInt = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

export default class SongCommandAdapter implements SongCommandPort {
  private readonly songRepository: Repository<SongEntity>;

  constructor() {
    this.songRepository = SqlAppDataSource.getRepository<SongEntity>(SongEntity);
  }

  /**
   * Crea una nueva canción
   * @param song Datos de la canción a crear (sin id, createdAt, updatedAt)
   */
  async create(song: Omit<Song, "id" | "createdAt" | "updatedAt">): Promise<Result<number>> {
    try {
      const partial: DeepPartial<SongEntity> = {
        title: song.title,
        audioUrl: song.audioUrl,
        description: song.description ?? null,
        genre: song.genre ?? null,
        artistId: song.artistId ?? null,
        userId: song.userId ?? null,
        duration: toInt(song.duration),
        bpm: toInt(song.bpm),
        keyNote: song.keyNote ?? null,
        decade: toInt(song.decade),
        country: song.country ?? null,
        instruments: song.instruments ?? null,
        difficultyLevel: song.difficultyLevel ?? null,
        verifiedByArtist: song.verifiedByArtist ?? false,
        verifiedByUsers: song.verifiedByUsers ?? false,
      };

      const entity = this.songRepository.create(partial);
      const saved = await this.songRepository.save(entity);
      return Result.ok(saved.id);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      throw error;
    }
  }

  /**
   * Actualiza una canción existente
   * @param id ID de la canción a actualizar
   * @param song Datos parciales de la canción
   */
  async update(id: number, song: Partial<Song>): Promise<Result<void>> {
    try {
      const existing = await this.songRepository.findOne({ where: { id } });
      if (!existing) {
        return Result.fail(new Error("Canción no encontrada"));
      }

      const partial: DeepPartial<SongEntity> = {
        ...(song.title !== undefined && { title: song.title }),
        ...(song.audioUrl !== undefined && { audioUrl: song.audioUrl }),
        ...(song.description !== undefined && { description: song.description ?? null }),
        ...(song.genre !== undefined && { genre: song.genre ?? null }),
        ...(song.artistId !== undefined && { artistId: song.artistId ?? null }),
        ...(song.userId !== undefined && { userId: song.userId ?? null }),
        ...(song.duration !== undefined && { duration: toInt(song.duration) }),
        ...(song.bpm !== undefined && { bpm: toInt(song.bpm) }),
        ...(song.keyNote !== undefined && { keyNote: song.keyNote ?? null }),
        ...(song.decade !== undefined && { decade: toInt(song.decade) }),
        ...(song.country !== undefined && { country: song.country ?? null }),
        ...(song.instruments !== undefined && { instruments: song.instruments ?? null }),
        ...(song.difficultyLevel !== undefined && {
          difficultyLevel: song.difficultyLevel ?? null,
        }),
        ...(song.verifiedByArtist !== undefined && { verifiedByArtist: song.verifiedByArtist }),
        ...(song.verifiedByUsers !== undefined && { verifiedByUsers: song.verifiedByUsers }),
      };

      this.songRepository.merge(existing, partial);
      await this.songRepository.save(existing);
      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      throw error;
    }
  }

  /**
   * Elimina una canción
   * @param id ID de la canción a eliminar
   */
  async delete(id: number): Promise<Result<boolean>> {
    try {
      const result = await this.songRepository.delete(id);
      return Result.ok((result.affected ?? 0) > 0);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
