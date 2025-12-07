import { Brackets, Repository, SelectQueryBuilder } from "typeorm";
import Artist from "../../../../domain/models/music/Artist";
import ArtistQueryPort from "../../../../domain/ports/data/music/query/ArtistQueryPort";
import Result from "../../../../domain/shared/Result";
import ArtistFilters from "../../../../domain/valueObjects/ArtistFilters";
import { SqlAppDataSource } from "../../../config/con_database";
import { ArtistEntity } from "../../../entities/Sql/music";

export default class ArtistQueryAdapter implements ArtistQueryPort {
  private artistRepository: Repository<ArtistEntity>;
  constructor() {
    this.artistRepository = SqlAppDataSource.getRepository(ArtistEntity);
  }

  /**
   * Busca un artista por su ID
   * @param id ID del artista
   */
  async findById(id: number): Promise<Result<Artist>> {
    try {
      const entity = await this.artistRepository.findOne({ where: { id } });
      if (!entity) {
        return Result.fail(new Error("Artista no encontrado"));
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
   * Busca un artista individual siguiendo los parámetros de los filtros
   * @param filters Filtros para la búsqueda
   */
  async findByFilters(filters: ArtistFilters): Promise<Result<Artist>> {
    try {
      const queryBuilder = this.applyFilters(filters);
      const entity = await queryBuilder.getOne();
      if (!entity) {
        return Result.fail(new Error("Artista no encontrado"));
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
   * Busca artistas aplicando los filtros especificados
   * @param filters Filtros para la búsqueda
   */
  async searchByFilters(filters: ArtistFilters): Promise<Result<Artist[]>> {
    try {
      const qb = this.applyFilters(filters);
      const result = await qb.getMany();

      return Result.ok(result.map((x) => x.toDomain()));
    } catch (error) {
      if (error instanceof Error) return Result.fail(error);
      throw error;
    }
  }

  /**
   * Valida si un artista existe por un ID específico
   * @param id ID del artista
   */
  async existsById(id: number): Promise<Result<boolean>> {
    try {
      const count = await this.artistRepository.count({ where: { id } });
      return Result.ok(count > 0);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      throw error;
    }
  }

  /**
   * Valida si un artista existe según los filtros especificados
   * @param filters Filtros para la búsqueda
   */
  async existsByFilters(filters: ArtistFilters): Promise<Result<boolean>> {
    try {
      const queryBuilder = this.applyFilters(filters);
      const count = await queryBuilder.getCount();
      return Result.ok(count > 0);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
      throw error;
    }
  }

  private applyFilters(filters: ArtistFilters): SelectQueryBuilder<ArtistEntity> {
    const queryBuilder: SelectQueryBuilder<ArtistEntity> = this.artistRepository
      .createQueryBuilder("artist")
      .limit(50);

    if (filters.includeFilters) {
      if (filters.id) {
        queryBuilder.andWhere("artist.id = :id", { id: filters.id });
      }

      if (filters.artistName) {
        queryBuilder.andWhere("artist.artist_name LIKE :artistName", {
          artistName: `%${filters.artistName}%`,
        });
      }

      if (filters.countryCode) {
        queryBuilder.andWhere("artist.countryCode = :countryCode", {
          countryCode: filters.countryCode,
        });
      }

      if (filters.formationYear) {
        queryBuilder.andWhere("artist.formationYear = :formationYear", {
          formationYear: filters.formationYear,
        });
      }

      if (filters.verified !== undefined) {
        queryBuilder.andWhere("artist.verified = :verified", { verified: filters.verified });
      }
    } else {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          if (filters.id) {
            qb.orWhere("artist.id = :id", { id: filters.id });
          }

          if (filters.artistName) {
            qb.orWhere("artist.artist_name LIKE :artistName", {
              artistName: `%${filters.artistName}%`,
            });
          }

          if (filters.countryCode) {
            qb.orWhere("artist.countryCode = :countryCode", { countryCode: filters.countryCode });
          }

          if (filters.formationYear) {
            qb.orWhere("artist.formationYear = :formationYear", {
              formationYear: filters.formationYear,
            });
          }

          if (filters.verified !== undefined) {
            qb.orWhere("artist.verified = :verified", { verified: filters.verified });
          }
        }),
      );
    }

    return queryBuilder;
  }
}
