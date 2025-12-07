import { Brackets, Repository, SelectQueryBuilder } from "typeorm";
import Song from "../../../../domain/models/music/Song";
import SongQueryPort from "../../../../domain/ports/data/music/query/SongQueryPort";
import Result from "../../../../domain/shared/Result";
import SongFilters from "../../../../domain/valueObjects/SongFilters";
import { SongEntity } from "../../../entities/Sql/music";
import { SqlAppDataSource } from "../../../config/con_database";

export default class SongQueryAdapter implements SongQueryPort {
  private readonly songRepository: Repository<SongEntity>;
  constructor() {
    this.songRepository = SqlAppDataSource.getRepository<SongEntity>(SongEntity);
  }

  /**
   * Busca una canción por su ID
   * @param id ID de la canción
   */
  async findById(id: number): Promise<Result<Song>> {
    try {
      const entity = await this.songRepository.findOne({ where: { id } });
      if (!entity) {
        return Result.fail(new Error("Canción no encontrada"));
      }
      return Result.ok(entity.toDomain());
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      throw error;
    }
  }

  /**
   * Busca una canción individual siguiendo los parámetros de los filtros
   * @param filters Filtros para la búsqueda
   */
  async findByFilters(filters: SongFilters): Promise<Result<Song>> {
    try {
      const queryBuilder = this.applyFilters(filters);
      const entity = await queryBuilder.getOne();
      if (!entity) {
        return Result.fail(new Error("Canción no encontrada"));
      }
      return Result.ok(entity.toDomain());
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      throw error;
    }
  }

  /**
   * Busca canciones aplicando los filtros especificados
   * @param filters Filtros para la búsqueda
   */
  async searchByFilters(filters: SongFilters): Promise<Result<Song[]>> {
    try {
      const queryBuilder = this.applyFilters(filters);
      const result = await queryBuilder.getMany();
      return Result.ok(result.map((x) => x.toDomain()));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      throw error;
    }
  }

  /**
   * Busca canciones por el ID del usuario
   * @param userId ID del usuario
   */
  async searchByUser(userId: number): Promise<Result<Song[]>> {
    try {
      const result = await this.songRepository.find({
        where: { userId },
        order: { createdAt: "DESC" },
      });
      return Result.ok(result.map((x) => x.toDomain()));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      throw error;
    }
  }

  /**
   * Valida si una canción existe por un ID específico
   * @param id ID de la canción
   */
  async existsById(id: number): Promise<Result<boolean>> {
    try {
      const count = await this.songRepository.count({ where: { id } });
      return Result.ok(count > 0);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      throw error;
    }
  }

  /**
   * Aplica los filtros a la consulta de canciones.
   * Si includeFilters es true, aplica los filtros con AND (todas las condiciones deben cumplirse).
   * Si includeFilters es false, aplica los filtros con OR (cualquiera de las condiciones debe cumplirse).
   * @param filters Filtros a aplicar
   */
  private applyFilters(filters: SongFilters): SelectQueryBuilder<SongEntity> {
    const queryBuilder = this.songRepository.createQueryBuilder("song");

    if (filters.includeFilters) {
      if (filters.id) {
        queryBuilder.andWhere("song.id = :id", { id: filters.id });
      }

      if (filters.title) {
        queryBuilder.andWhere("song.title LIKE :title", { title: `%${filters.title}%` });
      }

      if (filters.genre) {
        queryBuilder.andWhere("song.genre = :genre", { genre: filters.genre });
      }

      if (filters.artistId) {
        queryBuilder.andWhere("song.artistId = :artistId", { artistId: filters.artistId });
      }

      if (filters.userId) {
        queryBuilder.andWhere("song.userId = :userId", { userId: filters.userId });
      }

      if (filters.decade) {
        queryBuilder.andWhere("song.decade = :decade", { decade: filters.decade });
      }

      if (filters.country) {
        queryBuilder.andWhere("song.country = :country", { country: filters.country });
      }

      if (filters.difficultyLevel) {
        queryBuilder.andWhere("song.difficultyLevel = :difficultyLevel", {
          difficultyLevel: filters.difficultyLevel,
        });
      }

      if (filters.verifiedByArtist !== undefined) {
        queryBuilder.andWhere("song.verifiedByArtist = :verifiedByArtist", {
          verifiedByArtist: filters.verifiedByArtist,
        });
      }

      if (filters.verifiedByUsers !== undefined) {
        queryBuilder.andWhere("song.verifiedByUsers = :verifiedByUsers", {
          verifiedByUsers: filters.verifiedByUsers,
        });
      }
    } else {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          if (filters.id) {
            qb.orWhere("song.id = :id", { id: filters.id });
          }

          if (filters.title) {
            qb.orWhere("song.title LIKE :title", { title: `%${filters.title}%` });
          }

          if (filters.genre) {
            qb.orWhere("song.genre = :genre", { genre: filters.genre });
          }

          if (filters.artistId) {
            qb.orWhere("song.artistId = :artistId", { artistId: filters.artistId });
          }

          if (filters.userId) {
            qb.orWhere("song.userId = :userId", { userId: filters.userId });
          }

          if (filters.decade) {
            qb.orWhere("song.decade = :decade", { decade: filters.decade });
          }

          if (filters.country) {
            qb.orWhere("song.country = :country", { country: filters.country });
          }

          if (filters.difficultyLevel) {
            qb.orWhere("song.difficultyLevel = :difficultyLevel", {
              difficultyLevel: filters.difficultyLevel,
            });
          }

          if (filters.verifiedByArtist !== undefined) {
            qb.orWhere("song.verifiedByArtist = :verifiedByArtist", {
              verifiedByArtist: filters.verifiedByArtist,
            });
          }

          if (filters.verifiedByUsers !== undefined) {
            qb.orWhere("song.verifiedByUsers = :verifiedByUsers", {
              verifiedByUsers: filters.verifiedByUsers,
            });
          }
        }),
      );
    }

    return queryBuilder;
  }
}
