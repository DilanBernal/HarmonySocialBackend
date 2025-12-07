import User, { UserStatus } from "../../../../domain/models/seg/User";
import UserCommandPort from "../../../../domain/ports/data/seg/command/UserCommandPort";
import UserQueryPort from "../../../../domain/ports/data/seg/query/UserQueryPort";
import RolePort from "../../../../domain/ports/data/seg/RolePort";
import UserRolePort from "../../../../domain/ports/data/seg/UserRolePort";
import AuthPort from "../../../../domain/ports/data/seg/AuthPort";
import EmailPort from "../../../../domain/ports/utils/EmailPort";
import TokenPort from "../../../../domain/ports/utils/TokenPort";
import LoggerPort from "../../../../domain/ports/utils/LoggerPort";
import RegisterRequest from "../../../dto/requests/User/RegisterRequest";
import UpdateUserRequest from "../../../dto/requests/User/UpdateUserRequest";
import { ApplicationResponse } from "../../../shared/ApplicationReponse";
import { ApplicationError, ErrorCodes } from "../../../shared/errors/ApplicationError";
import Email from "../../../dto/utils/Email";
import envs from "../../../../infrastructure/config/environment-vars";
import Result from "../../../../domain/shared/Result";

export default class UserCommandService {
  constructor(
    private readonly userCommandPort: UserCommandPort,
    private readonly userQueryPort: UserQueryPort,
    private readonly rolePort: RolePort,
    private readonly userRolePort: UserRolePort,
    private readonly authPort: AuthPort,
    private readonly emailPort: EmailPort,
    private readonly tokenPort: TokenPort,
    private readonly logger: LoggerPort,
  ) {}

  async registerUser(user: RegisterRequest): Promise<ApplicationResponse<number>> {
    if (!user) {
      return ApplicationResponse.failure(
        new ApplicationError("Datos de usuario inválidos", ErrorCodes.VALIDATION_ERROR),
      );
    }
    try {
      const existUserResponse = await this.userQueryPort.existsActiveUserByFilters({
        username: user.username,
        email: user.email,
        includeFilters: false,
      });
      if (existUserResponse.isSuccess && existUserResponse.getValue()) {
        return ApplicationResponse.failure(
          new ApplicationError("Ya existe el usuario", ErrorCodes.USER_ALREADY_EXISTS),
        );
      }

      const defaultRoleName = "common_user";
      const defaultRole = await this.rolePort.findByName(defaultRoleName);
      if (!defaultRole) {
        return ApplicationResponse.failure(
          new ApplicationError(
            `Rol por defecto '${defaultRoleName}' no configurado`,
            ErrorCodes.VALUE_NOT_FOUND,
          ),
        );
      }

      const hashPassword = await this.authPort.encryptPassword(user.password);
      const securityStamp: string = this.tokenPort.generateStamp();
      const concurrencyStamp: string = this.tokenPort.generateStamp();

      const userDomain: Omit<User, "id" | "updatedAt"> = {
        status: UserStatus.SUSPENDED,
        createdAt: new Date(),
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        password: hashPassword,
        profileImage: user.profileImage,
        learningPoints: 0,
        favoriteInstrument: user.favoriteInstrument,
        concurrencyStamp: concurrencyStamp,
        securityStamp: securityStamp,
        normalizedEmail: user.email.toUpperCase(),
        normalizedUsername: user.username.toUpperCase(),
      };

      const response: Result<number, Error> = await this.userCommandPort.createUser(userDomain);
      if (!response.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "No se pudo crear el usuario",
            ErrorCodes.DATABASE_ERROR,
            response.error?.message,
            response.error,
          ),
        );
      }

      const userId = response.getValue();
      try {
        await this.userRolePort.assignRoleToUser(userId, defaultRole.id);
      } catch (e) {
        this.logger.error("Fallo asignando rol por defecto al usuario", [(e as any)?.message]);
        return ApplicationResponse.failure(
          new ApplicationError(
            "Error al asignar rol por defecto",
            ErrorCodes.SERVER_ERROR,
            undefined,
            e instanceof Error ? e : undefined,
          ),
        );
      }

      const verificationToken = this.tokenPort.generateConfirmAccountToken(
        securityStamp,
        concurrencyStamp,
      );

      const welcomeEmail: Email = {
        to: [user.email],
        from: envs.EMAIL_FROM,
        subject: `Bienvenido ${user.fullName}`,
        text: `Bienvenido a HarmonyMusical, entra a este link para activar tu cuenta ${envs.FRONTEND_URL}/verify-email?token=${verificationToken}`,
      };

      this.emailPort
        .sendEmail(welcomeEmail)
        .then(() => this.logger.info(`Correo enviado a ${user.email}`))
        .catch((err) => this.logger.error("Fallo enviando el correo", err));

      return ApplicationResponse.success(userId);
    } catch (error: unknown) {
      if (error instanceof ApplicationResponse) return error;
      if (error instanceof Error) {
        this.logger.error("Ocurrio un error en registro", [error.name, error.message]);
        return ApplicationResponse.failure(
          new ApplicationError(
            "Ocurrió un error inesperado en el registro",
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

  async updateUser(id: number, updateRequest: UpdateUserRequest): Promise<ApplicationResponse> {
    try {
      if (!id || id <= 0) {
        return ApplicationResponse.failure(
          new ApplicationError("ID de usuario inválido", ErrorCodes.VALIDATION_ERROR),
        );
      }
      if (!updateRequest) {
        return ApplicationResponse.failure(
          new ApplicationError("Datos de actualización requeridos", ErrorCodes.VALIDATION_ERROR),
        );
      }

      const existsResponse = await this.userQueryPort.existsUserById(id);
      if (!existsResponse.isSuccess || !existsResponse.getValue()) {
        return ApplicationResponse.failure(
          new ApplicationError("Usuario no encontrado", ErrorCodes.VALUE_NOT_FOUND),
        );
      }

      // Colisión de email/username
      if (updateRequest.email || updateRequest.username) {
        const existingUserResp = await this.userQueryPort.getUserByFilters({
          email: updateRequest.email,
          username: updateRequest.username,
          includeFilters: false,
        } as any);
        if (
          existingUserResp.isSuccess &&
          existingUserResp.value &&
          existingUserResp.value.id !== id
        ) {
          return ApplicationResponse.failure(
            new ApplicationError(
              "El email o username ya están en uso",
              ErrorCodes.USER_ALREADY_EXISTS,
            ),
          );
        }
      }

      const updateData: Partial<User> = {
        updated_at: new Date(Date.now()),
      } as any;
      if (updateRequest.fullName) updateData.fullName = updateRequest.fullName.trim();
      if (updateRequest.email) updateData.email = updateRequest.email.trim();
      if (updateRequest.username) updateData.username = updateRequest.username.trim();
      if (updateRequest.profileImage) updateData.profileImage = updateRequest.profileImage.trim();
      if (updateRequest.favoriteInstrument !== undefined)
        (updateData as any).favoriteInstrument = updateRequest.favoriteInstrument;

      if (updateRequest.new_password && updateRequest.current_password) {
        const hashPassword = await this.authPort.encryptPassword(updateRequest.new_password);
        updateData.password = hashPassword;
        updateData.securityStamp = this.tokenPort.generateStamp();
      }

      const resp = await this.userCommandPort.updateUser(id, updateData);
      if (!resp.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError("No se pudo actualizar el usuario", ErrorCodes.DATABASE_ERROR),
        );
      }
      return ApplicationResponse.emptySuccess();
    } catch (error: unknown) {
      if (error instanceof ApplicationResponse) return error;
      if (error instanceof Error) {
        this.logger.error("Error al actualizar usuario", [error.name, error.message]);
        return ApplicationResponse.failure(
          new ApplicationError(
            "Ocurrió un error al actualizar el usuario",
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

  async deleteUser(id: number): Promise<ApplicationResponse> {
    try {
      const existsResp = await this.userQueryPort.existsUserById(id);
      if (!existsResp.isSuccess || !existsResp.getValue()) {
        return ApplicationResponse.failure(
          new ApplicationError("No se encontró al usuario", ErrorCodes.VALUE_NOT_FOUND),
        );
      }
      const del = await this.userCommandPort.deleteUser(id);
      if (!del.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError("No se pudo eliminar el usuario", ErrorCodes.DATABASE_ERROR),
        );
      }
      return ApplicationResponse.emptySuccess();
    } catch (error: unknown) {
      if (error instanceof ApplicationResponse) return error;
      if (error instanceof Error) {
        this.logger.error("Error al eliminar usuario", [error.name, error.message]);
        return ApplicationResponse.failure(
          new ApplicationError(
            "Ocurrió un error al eliminar el usuario",
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
}
