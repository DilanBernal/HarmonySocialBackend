import UserQueryPort from "../../../../domain/ports/data/seg/query/UserQueryPort";
import UserRolePort from "../../../../domain/ports/data/seg/UserRolePort";
import LoggerPort from "../../../../domain/ports/utils/LoggerPort";
import { ApplicationResponse } from "../../../shared/ApplicationReponse";
import { ApplicationError, ErrorCodes } from "../../../shared/errors/ApplicationError";
import UserResponse from "../../../dto/responses/seg/user/UserResponse";
import PaginationRequest from "../../../dto/utils/PaginationRequest";
import PaginationResponse from "../../../dto/utils/PaginationResponse";
import UserSearchParamsRequest from "../../../dto/requests/User/UserSearchParamsRequest";
import UserBasicDataResponse from "../../../dto/responses/seg/user/UserBasicDataResponse";
import NotFoundResponse from "../../../shared/responses/NotFoundResponse";

export default class UserQueryService {
  private readonly _paginationMaxLimit = 150;
  constructor(
    private readonly userQueryPort: UserQueryPort,
    private readonly userRolePort: UserRolePort,
    private readonly logger: LoggerPort,
  ) {}

  async getAllUsers(): Promise<ApplicationResponse<UserResponse[]>> {
    try {
      const userIds = await this.userRolePort.listUsersForRole("common_user");
      if (!userIds.length) return ApplicationResponse.success([]);
      const usersResponse = await this.userQueryPort.searchActiveUsersByIds(userIds);
      if (!usersResponse.isSuccess) return usersResponse as any as ApplicationResponse<any>;
      const users = usersResponse.getValue() || [];
      const responses: UserResponse[] = users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        username: u.username,
        profileImage: u.profileImage,
        learningPoints: u.learningPoints,
        status: u.status,
        favoriteInstrument: u.favoriteInstrument,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
      return ApplicationResponse.success(responses);
    } catch (error: unknown) {
      if (error instanceof ApplicationResponse) return error;
      if (error instanceof Error) {
        this.logger.error("Error al obtener usuarios", [error.name, error.message, error]);
        return ApplicationResponse.failure(
          new ApplicationError(
            "Ocurrió un error al obtener los usuarios",
            ErrorCodes.SERVER_ERROR,
            [error.name, error.message],
            error,
          ),
        );
      }
      return ApplicationResponse.failure(
        new ApplicationError("Error desconocido", ErrorCodes.SERVER_ERROR),
      );
    }
  }

  async getUserById(id: number): Promise<ApplicationResponse<UserResponse>> {
    try {
      if (!id || id <= 0) {
        return ApplicationResponse.failure(
          new ApplicationError("ID de usuario inválido", ErrorCodes.VALIDATION_ERROR),
        );
      }
      const userResp = await this.userQueryPort.getUserById(id);
      if (!userResp.isSuccess || !userResp.value) {
        return ApplicationResponse.failure(
          new ApplicationError("Usuario no encontrado", ErrorCodes.VALUE_NOT_FOUND),
        );
      }
      const u = userResp.getValue();
      return ApplicationResponse.success({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        username: u.username,
        profileImage: u.profileImage,
        learningPoints: u.learningPoints,
        status: u.status,
        favoriteInstrument: u.favoriteInstrument,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      });
    } catch (error: unknown) {
      if (error instanceof ApplicationResponse) return error;
      if (error instanceof Error) {
        this.logger.error("Error al obtener usuario por ID", [error.name, error.message, error]);
        return ApplicationResponse.failure(
          new ApplicationError(
            "Ocurrió un error al obtener el usuario",
            ErrorCodes.SERVER_ERROR,
            [error.name, error.message],
            error,
          ),
        );
      }
      return ApplicationResponse.failure(
        new ApplicationError("Error desconocido", ErrorCodes.SERVER_ERROR),
      );
    }
  }

  async getUserByEmail(email: string): Promise<ApplicationResponse<UserResponse>> {
    try {
      if (!email) {
        return ApplicationResponse.failure(
          new ApplicationError("Email inválido", ErrorCodes.VALIDATION_ERROR),
        );
      }
      const userResp = await this.userQueryPort.getUserByFilters({
        email,
        includeFilters: true,
      } as any);
      if (!userResp.isSuccess || !userResp.value) {
        return ApplicationResponse.failure(
          new ApplicationError("Usuario no encontrado", ErrorCodes.VALUE_NOT_FOUND),
        );
      }
      const u = userResp.getValue();
      return ApplicationResponse.success({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        username: u.username,
        profileImage: u.profileImage,
        learningPoints: u.learningPoints,
        status: u.status,
        favoriteInstrument: u.favoriteInstrument,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      });
    } catch (error: unknown) {
      if (error instanceof ApplicationResponse) return error;
      if (error instanceof Error) {
        this.logger.error("Error al obtener usuario por email", [error.name, error.message]);
        return ApplicationResponse.failure(
          new ApplicationError(
            "Ocurrió un error al obtener el usuario",
            ErrorCodes.SERVER_ERROR,
            [error.name, error.message],
            error,
          ),
        );
      }
      return ApplicationResponse.failure(
        new ApplicationError("Error desconocido", ErrorCodes.SERVER_ERROR),
      );
    }
  }

  async getUserData(id: number): Promise<ApplicationResponse<UserBasicDataResponse>> {
    try {
      const existsResp = await this.userQueryPort.existsActiveUserById(id);
      if (!existsResp.isSuccess || !existsResp.getValue()) {
        return new NotFoundResponse({ entity: "usuario" });
      }
      const uResp = await this.userQueryPort.getUserById(id);
      if (!uResp.isSuccess || !uResp.value) {
        return ApplicationResponse.failure(
          new ApplicationError("No se pudo obtener el usuario", ErrorCodes.SERVER_ERROR),
        );
      }
      const u = uResp.getValue();
      return ApplicationResponse.success({
        id: u.id,
        fullName: u.fullName!,
        email: u.email,
        activeFrom: u.createdAt.getFullYear(),
        profileImage: u.profileImage,
        username: u.username,
        learningPoints: u.learningPoints,
        favoriteInstrument: u.favoriteInstrument,
      });
    } catch (e: any) {
      this.logger.error("Error en getUserData", [e?.message]);
      return ApplicationResponse.failure(
        new ApplicationError("Ocurrió un error", ErrorCodes.SERVER_ERROR, e?.message, e),
      );
    }
  }

  async searchUsers(
    req: PaginationRequest<UserSearchParamsRequest>,
  ): Promise<ApplicationResponse<PaginationResponse<any>>> {
    try {
      const limit = Math.min(req.page_size ?? 10, this._paginationMaxLimit);
      const filters = {
        email: req.filters?.email || undefined,
        username: req.filters?.username || undefined,
        full_name: req.filters?.full_name || undefined,
        includeFilters: false,
      } as any;

      // Using domain port to fetch active users matching filters
      const resp = await this.userQueryPort.searchActiveUserByFilters(filters);
      if (!resp.isSuccess) return resp as any as ApplicationResponse<any>;
      const rows = resp.value || [];

      // Apply simple pagination in-memory (can be optimized later)
      const page = req.page_number ?? 0;
      const start = page;
      const data = rows.slice(start, start + limit);

      const mapped = data.map((u) => ({
        id: u.id,
        username: u.username,
        full_name: u.fullName,
        email: u.email,
        profile_image: u.profileImage ?? null,
      }));
      return ApplicationResponse.success(
        PaginationResponse.create(mapped, mapped.length, rows.length),
      );
    } catch (e: any) {
      this.logger.error("searchUsers error", [e?.message]);
      return ApplicationResponse.failure(
        new ApplicationError("Error interno en búsqueda", ErrorCodes.SERVER_ERROR, e?.message, e),
      );
    }
  }
}
