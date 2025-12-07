import { Repository, ILike, Like, FindOptionsWhere, Brackets } from "typeorm";
import { SqlAppDataSource } from "../../../config/con_database";
import ArtistEntity from "../../../entities/Sql/music/ArtistEntity";
import Artist, { ArtistStatus } from "../../../../domain/models/music/Artist";
import ArtistPort from "../../../../domain/ports/data/music/ArtistPort";
import { ArtistSearchFilters } from "../../../../application/dto/requests/Artist/ArtistSearchFilters";
import { ApplicationResponse } from "../../../../application/shared/ApplicationReponse";
import {
  ApplicationError,
  ErrorCodes,
} from "../../../../application/shared/errors/ApplicationError";
import PaginationRequest from "../../../../application/dto/utils/PaginationRequest";
import PaginationResponse from "../../../../application/dto/utils/PaginationResponse";
import areAllValuesEmpty from "../../../../application/shared/utils/functions/areAllValuesEmpty";

export default class ArtistAdapter implements ArtistPort {
  private repo: Repository<ArtistEntity>;
  constructor() {
    this.repo = SqlAppDataSource.getRepository(ArtistEntity);
  }

  private toDomain(e: ArtistEntity): Artist {
    return new Artist(
      e.id,
      e.user_id,
      e.artist_name,
      e.biography,
      e.verified,
      e.formation_year,
      e.country_code,
      e.status,
      e.created_at,
      e.updated_at,
    );
  }

  async create(
    artist: Omit<Artist, "id" | "createdAt" | "updatedAt">,
  ): Promise<ApplicationResponse<number>> {
    try {
      const entity = new ArtistEntity();
      entity.artist_name = artist.artistName;
      entity.biography = artist.biography;
      entity.formation_year = artist.formationYear;
      entity.country_code = artist.countryCode;
      entity.verified = artist.verified ?? false;
      entity.status = artist.status;
      entity.created_at = new Date(Date.now());
      if (artist.artistUserId) entity.user_id = artist.artistUserId;
      const saved = await this.repo.save(entity);
      return ApplicationResponse.success(saved.id);
    } catch (error: any) {
      return ApplicationResponse.failure(
        new ApplicationError(
          "Error al crear artista",
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error,
        ),
      );
    }
  }

  async update(id: number, artist: Partial<Artist>): Promise<ApplicationResponse> {
    try {
      const existing = await this.repo.findOne({ where: { id } });
      if (!existing) {
        return ApplicationResponse.failure(
          new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
        );
      }
      if (artist.artistName !== undefined) existing.artist_name = artist.artistName;
      if (artist.biography !== undefined) existing.biography = artist.biography;
      if (artist.formationYear !== undefined) existing.formation_year = artist.formationYear;
      if (artist.countryCode !== undefined) existing.country_code = artist.countryCode;
      existing.updated_at = new Date(Date.now());
      await this.repo.save(existing);
      return ApplicationResponse.emptySuccess();
    } catch (error: any) {
      return ApplicationResponse.failure(
        new ApplicationError(
          "Error al actualizar artista",
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error,
        ),
      );
    }
  }

  async logicalDelete(id: number): Promise<ApplicationResponse> {
    try {
      const existing = await this.repo.findOne({ where: { id } });
      if (!existing) {
        return ApplicationResponse.failure(
          new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
        );
      }
      existing.status = ArtistStatus.DELETED;
      existing.updated_at = new Date(Date.now());
      await this.repo.save(existing);
      return ApplicationResponse.emptySuccess();
    } catch (error: any) {
      return ApplicationResponse.failure(
        new ApplicationError(
          "Error al eliminar artista",
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error,
        ),
      );
    }
  }

  async findById(id: number): Promise<ApplicationResponse<Artist>> {
    try {
      const existing = await this.repo.findOne({ where: { id } });
      if (!existing) {
        return ApplicationResponse.failure(
          new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
        );
      }
      return ApplicationResponse.success(this.toDomain(existing));
    } catch (error: any) {
      return ApplicationResponse.failure(
        new ApplicationError(
          "Error al obtener artista",
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error,
        ),
      );
    }
  }

  async searchPaginated(
    req: PaginationRequest<ArtistSearchFilters>,
  ): Promise<ApplicationResponse<PaginationResponse<Artist>>> {
    try {
      const tableRefName: string = "artist";
      const filters = req.filters ?? undefined;
      if (!filters) {
        return ApplicationResponse.success(PaginationResponse.createEmpty());
      }
      const queryBuilder = this.repo
        .createQueryBuilder(`${tableRefName}`)
        .select(
          `
          ${tableRefName}.id,
          ${tableRefName}.artist_name,
          ${tableRefName}.verified`,
        )
        .where(`${tableRefName}.status = :status`, { status: ArtistStatus.ACTIVE });

      if (!areAllValuesEmpty(filters)) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            if (filters.name) {
              qb.where(`LOWER(${tableRefName}.artist_name) LIKE :artistName`, {
                artistName: filters.name + "%",
              });
            }
            if (filters.country) {
              qb.orWhere(`${tableRefName}.country_code LIKE :countryCode`, {
                countryCode: filters.country,
              });
            }
            if (filters.formationYear) {
              qb.orWhere(`EXTRACT(${tableRefName}.formation_year) = :formationYear`, {
                formationYear: filters.formationYear,
              });
            }
          }),
        );
      }
      if (req.general_filter) {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.orWhere(`${tableRefName}.artist_name ILIKE :name`, {
              name: "%" + req.general_filter + "%",
            });
            qb.orWhere(`${tableRefName}.country_code = :countryCode`, {
              countryCode: req.general_filter,
            });
          }),
        );
      }

      const rowCounts = await queryBuilder.getCount();

      if (rowCounts < 1) {
        return ApplicationResponse.success(PaginationResponse.createEmpty());
      }

      if (req.page_number) {
        queryBuilder.skip(req.page_number);
      }
      queryBuilder.limit(req.page_size ?? 5);

      if (req.first_id && req.last_id) {
        queryBuilder.andWhere(`${tableRefName}.id BETWEEN :firstId AND :lastId`, {
          firstId: req.first_id,
          lastId: req.last_id,
        });
      } else if (req.first_id) {
        queryBuilder.andWhere(`${tableRefName}.id < :id`, { id: req.first_id });
      } else if (req.last_id) {
        queryBuilder.andWhere(`${tableRefName}.id > :id`, { id: req.last_id });
      }

      const list = await queryBuilder.getRawMany();
      const response: PaginationResponse<Artist> = PaginationResponse.create(
        list,
        list.length,
        rowCounts,
      );
      return ApplicationResponse.success(response);
    } catch (error: any) {
      return ApplicationResponse.failure(
        new ApplicationError(
          "Error al buscar artistas",
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error,
        ),
      );
    }
  }

  async existsById(id: number): Promise<ApplicationResponse<boolean>> {
    try {
      const count = await this.repo.count({ where: { id } });
      return ApplicationResponse.success(count > 0);
    } catch (error: any) {
      return ApplicationResponse.failure(
        new ApplicationError(
          "Error al validar artista",
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error,
        ),
      );
    }
  }

  async updateStatus(id: number, status: ArtistStatus): Promise<ApplicationResponse> {
    try {
      const existing = await this.repo.findOne({ where: { id } });
      if (!existing) {
        return ApplicationResponse.failure(
          new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
        );
      }
      existing.status = status;
      existing.updated_at = new Date(Date.now());
      await this.repo.save(existing);
      return ApplicationResponse.emptySuccess();
    } catch (error: any) {
      return ApplicationResponse.failure(
        new ApplicationError(
          "Error al actualizar estado",
          ErrorCodes.DATABASE_ERROR,
          error.message,
          error,
        ),
      );
    }
  }
}
