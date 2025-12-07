import { ApplicationResponse } from "../shared/ApplicationReponse";
import { ApplicationError, ErrorCodes } from "../shared/errors/ApplicationError";
import Artist, { ArtistStatus } from "../../domain/models/music/Artist";
import ArtistQueryPort from "../../domain/ports/data/music/query/ArtistQueryPort";
import ArtistCommandPort from "../../domain/ports/data/music/command/ArtistCommandPort";
import { ArtistSearchFilters } from "../dto/requests/Artist/ArtistSearchFilters";
import ArtistCreateRequest from "../dto/requests/Artist/ArtistCreateRequest";
import ArtistUpdateRequest from "../dto/requests/Artist/ArtistUpdateRequest";
import ArtistResponse from "../dto/responses/ArtistResponse";
import LoggerPort from "../../domain/ports/utils/LoggerPort";
import RolePort from "../../domain/ports/data/seg/RolePort";
import UserRolePort from "../../domain/ports/data/seg/UserRolePort";
import PaginationRequest from "../dto/utils/PaginationRequest";
import PaginationResponse from "../dto/utils/PaginationResponse";
import ArtistFilters from "../../domain/valueObjects/ArtistFilters";

export default class ArtistService {
  constructor(
    private queryPort: ArtistQueryPort,
    private commandPort: ArtistCommandPort,
    private logger: LoggerPort,
    private rolePort: RolePort,
    private userRolePort: UserRolePort,
  ) {}

  async create(
    request: ArtistCreateRequest,
    userId?: number,
  ): Promise<ApplicationResponse<number>> {
    if (!request || !request.artist_name || !request.formation_year) {
      return ApplicationResponse.failure(
        new ApplicationError("Datos de artista inválidos", ErrorCodes.VALIDATION_ERROR),
      );
    }
    try {
      const artist = new Artist(
        0, // id temporal, será asignado por la BD
        userId,
        request.artist_name.trim(),
        request.biography?.trim(),
        false,
        request.formation_year,
        request.country_code?.trim(),
        ArtistStatus.PENDING,
      );
      const result = await this.commandPort.create(artist);
      if (!result.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "Error al crear artista",
            ErrorCodes.DATABASE_ERROR,
            undefined,
            result.error,
          ),
        );
      }
      return ApplicationResponse.success(result.getValue());
    } catch (error) {
      return this.handleUnexpected(error, "crear artista");
    }
  }

  async createAsAdmin(request: ArtistCreateRequest): Promise<ApplicationResponse<number>> {
    if (!request || !request.artist_name || !request.formation_year) {
      return ApplicationResponse.failure(
        new ApplicationError("Datos de artista inválidos", ErrorCodes.VALIDATION_ERROR),
      );
    }
    try {
      const artist = new Artist(
        0, // id temporal, será asignado por la BD
        undefined,
        request.artist_name.trim(),
        request.biography?.trim(),
        true,
        request.formation_year,
        request.country_code?.trim(),
        ArtistStatus.ACTIVE,
      );
      const result = await this.commandPort.create(artist);
      if (!result.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "Error al crear artista",
            ErrorCodes.DATABASE_ERROR,
            undefined,
            result.error,
          ),
        );
      }
      return ApplicationResponse.success(result.getValue());
    } catch (error) {
      return this.handleUnexpected(error, "crear artista por admin");
    }
  }

  async update(id: number, request: ArtistUpdateRequest): Promise<ApplicationResponse> {
    if (!id || id <= 0) {
      return ApplicationResponse.failure(
        new ApplicationError("ID inválido", ErrorCodes.VALIDATION_ERROR),
      );
    }
    if (!request) {
      return ApplicationResponse.failure(
        new ApplicationError("Datos de actualización requeridos", ErrorCodes.VALIDATION_ERROR),
      );
    }
    try {
      const existsResult = await this.queryPort.existsById(id);
      if (!existsResult.isSuccess || !existsResult.getValue()) {
        return ApplicationResponse.failure(
          new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
        );
      }
      const updateData: Partial<Artist> = { updatedAt: new Date(Date.now()) };
      if (request.artist_name) updateData.artistName = request.artist_name.trim();
      if (request.biography !== undefined) updateData.biography = request.biography?.trim();
      if (request.formation_year !== undefined) updateData.formationYear = request.formation_year;
      if (request.country_code !== undefined) updateData.countryCode = request.country_code?.trim();
      // status changes not allowed here
      const result = await this.commandPort.update(id, updateData);
      if (!result.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "Error al actualizar artista",
            ErrorCodes.DATABASE_ERROR,
            undefined,
            result.error,
          ),
        );
      }
      return ApplicationResponse.emptySuccess();
    } catch (error) {
      return this.handleUnexpected(error, "actualizar artista");
    }
  }

  async getById(id: number): Promise<ApplicationResponse<ArtistResponse>> {
    if (!id || id <= 0) {
      return ApplicationResponse.failure(
        new ApplicationError("ID inválido", ErrorCodes.VALIDATION_ERROR),
      );
    }
    try {
      const result = await this.queryPort.findById(id);
      if (!result.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
        );
      }
      return ApplicationResponse.success(this.mapToResponse(result.getValue()));
    } catch (error) {
      return this.handleUnexpected(error, "obtener artista");
    }
  }

  async search(
    filters: PaginationRequest<ArtistSearchFilters>,
  ): Promise<ApplicationResponse<PaginationResponse<ArtistResponse>>> {
    try {
      const artistFilters: ArtistFilters = {
        includeFilters: false,
        artistName: filters.filters?.name,
        countryCode: filters.filters?.country,
        formationYear: filters.filters?.formationYear
          ? parseInt(filters.filters.formationYear, 10)
          : undefined,
      };

      const result = await this.queryPort.searchByFilters(artistFilters);
      if (!result.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "Error al buscar artistas",
            ErrorCodes.DATABASE_ERROR,
            undefined,
            result.error,
          ),
        );
      }

      const artists = result.getValue();
      const pageSize = filters.page_size ?? 5;
      const pageNumber = filters.page_number ?? 0;
      const start = pageNumber * pageSize;
      const paginatedArtists = artists.slice(start, start + pageSize);

      const response = PaginationResponse.create(
        paginatedArtists.map((a) => this.mapToResponse(a)),
        paginatedArtists.length,
        artists.length,
      );

      return ApplicationResponse.success(response);
    } catch (error) {
      return this.handleUnexpected(error, "buscar artistas");
    }
  }

  async logicalDelete(id: number): Promise<ApplicationResponse> {
    try {
      const existsResult = await this.queryPort.existsById(id);
      if (!existsResult.isSuccess || !existsResult.getValue()) {
        return ApplicationResponse.failure(
          new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
        );
      }
      const result = await this.commandPort.logicalDelete(id);
      if (!result.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "Error al eliminar artista",
            ErrorCodes.DATABASE_ERROR,
            undefined,
            result.error,
          ),
        );
      }
      return ApplicationResponse.emptySuccess();
    } catch (error) {
      return this.handleUnexpected(error, "eliminar artista");
    }
  }

  async accept(id: number): Promise<ApplicationResponse> {
    try {
      const artistResult = await this.queryPort.findById(id);
      if (!artistResult.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
        );
      }
      const artist = artistResult.getValue();
      if (artist.status !== ArtistStatus.PENDING) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "Solo se puede aceptar un artista en estado PENDING",
            ErrorCodes.BUSINESS_RULE_VIOLATION,
          ),
        );
      }
      const statusResult = await this.commandPort.updateStatus(id, ArtistStatus.ACTIVE);
      if (!statusResult.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "Error al aceptar artista",
            ErrorCodes.DATABASE_ERROR,
            undefined,
            statusResult.error,
          ),
        );
      }
      // asignar rol artist si existe user vinculado
      const userId = artist.artistUserId;
      if (userId) {
        try {
          const artistRole = await this.rolePort.findByName("artist");
          if (artistRole) {
            await this.userRolePort.assignRoleToUser(userId, artistRole.id);
          } else {
            this.logger.warn("Rol 'artist' no existe. No se asignó al usuario.");
          }
        } catch (e) {
          this.logger.error("Error asignando rol artist tras aceptación", [(e as any)?.message]);
        }
      }
      return ApplicationResponse.emptySuccess();
    } catch (error) {
      return this.handleUnexpected(error, "aceptar artista");
    }
  }

  async reject(id: number): Promise<ApplicationResponse> {
    try {
      const artistResult = await this.queryPort.findById(id);
      if (!artistResult.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
        );
      }
      const artist = artistResult.getValue();
      if (artist.status !== ArtistStatus.PENDING) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "Solo se puede rechazar un artista en estado PENDING",
            ErrorCodes.BUSINESS_RULE_VIOLATION,
          ),
        );
      }
      const result = await this.commandPort.updateStatus(id, ArtistStatus.REJECTED);
      if (!result.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "Error al rechazar artista",
            ErrorCodes.DATABASE_ERROR,
            undefined,
            result.error,
          ),
        );
      }
      return ApplicationResponse.emptySuccess();
    } catch (error) {
      return this.handleUnexpected(error, "rechazar artista");
    }
  }

  private mapToResponse = (artist: Artist): ArtistResponse => ({
    id: artist.id,
    artist_name: artist.artistName,
    biography: artist.biography,
    formation_year: artist.formationYear,
    country_code: artist.countryCode,
    status: artist.status,
    created_at: artist.createdAt,
    updated_at: artist.updatedAt,
  });

  private handleUnexpected(error: unknown, context: string): ApplicationResponse<any> {
    if (error instanceof ApplicationResponse) return error;
    if (error instanceof ApplicationError) return ApplicationResponse.failure(error);
    if (error instanceof Error) {
      this.logger.error(`Error al ${context}`, [error.name, error.message]);
      return ApplicationResponse.failure(
        new ApplicationError(
          `Error al ${context}`,
          ErrorCodes.SERVER_ERROR,
          [error.name, error.message],
          error,
        ),
      );
    }
    this.logger.error(`Error desconocido al ${context}`);
    return ApplicationResponse.failure(
      new ApplicationError(`Error desconocido al ${context}`, ErrorCodes.SERVER_ERROR),
    );
  }
}
