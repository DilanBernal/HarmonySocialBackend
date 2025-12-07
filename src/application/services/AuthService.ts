import AuthPort from "../../domain/ports/data/seg/AuthPort";
import UserQueryPort from "../../domain/ports/data/seg/query/UserQueryPort";
import UserCommandPort from "../../domain/ports/data/seg/command/UserCommandPort";
import EmailPort from "../../domain/ports/utils/EmailPort";
import LoggerPort from "../../domain/ports/utils/LoggerPort";
import LoginRequest from "../dto/requests/User/LoginRequest";
import VerifyEmailRequest from "../dto/requests/User/VerifyEmailRequest";
import AuthResponse from "../dto/responses/seg/user/AuthResponse";
import { ApplicationResponse } from "../shared/ApplicationReponse";
import { ApplicationError, ErrorCodes, ErrorCode } from "../shared/errors/ApplicationError";
import TokenPort from "../../domain/ports/utils/TokenPort";
import UserRolePort from "../../domain/ports/data/seg/UserRolePort";
import RolePermissionAdapter from "../../infrastructure/adapter/data/seg/RolePermissionAdapter";
import EmptyRequestResponse from "../shared/responses/EmptyRequestResponse";
import NotFoundResponse from "../shared/responses/NotFoundResponse";
import areAllValuesEmpty from "../shared/utils/functions/areAllValuesEmpty";
import { UserStatus } from "../../domain/models/seg/User";
import DomainError from "../../domain/errors/DomainError";
import RolePermissionPort from "../../domain/ports/data/seg/RolePermissionPort";

export default class AuthService {
  private userQueryPort: UserQueryPort;
  private userCommandPort: UserCommandPort;
  private authPort: AuthPort;
  private emailPort: EmailPort;
  private loggerPort: LoggerPort;
  private tokenPort: TokenPort;
  private userRolePort: UserRolePort;
  private rolePermissionPort: RolePermissionPort;

  constructor(
    userQueryPort: UserQueryPort,
    userCommandPort: UserCommandPort,
    authPort: AuthPort,
    emailPort: EmailPort,
    loggerPort: LoggerPort,
    tokenPort: TokenPort,
    userRolePort: UserRolePort,
    rolePermissionPort: RolePermissionPort,
  ) {
    this.userQueryPort = userQueryPort;
    this.userCommandPort = userCommandPort;
    this.authPort = authPort;
    this.emailPort = emailPort;
    this.loggerPort = loggerPort;
    this.tokenPort = tokenPort;
    this.userRolePort = userRolePort;
    this.rolePermissionPort = rolePermissionPort;
  }

  async login(requests: LoginRequest): Promise<ApplicationResponse<AuthResponse>> {
    try {
      if (!requests) {
        this.loggerPort.debug("Solicitud de login vacía");
        return ApplicationResponse.failure(
          new ApplicationError(
            "La solicitud de login no puede estar vacía",
            ErrorCodes.VALIDATION_ERROR,
          ),
        );
      }

      const q = (requests.userOrEmail || "").trim();
      const userExistsResponse = await this.userQueryPort.existsActiveUserByFilters({
        email: q,
        username: q,
        includeFilters: false,
      } as any);
      if (!userExistsResponse.isSuccess || !userExistsResponse.getValue()) {
        return ApplicationResponse.failure(
          new ApplicationError("Credenciales inválidas", ErrorCodes.INVALID_CREDENTIALS),
        );
      }

      const userResp = await this.userQueryPort.getActiveUserByFilters({
        email: q,
        username: q,
        includeFilters: false,
      });
      const userInfo = userResp.isSuccess ? userResp.value! : undefined;
      if (!userInfo) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "Error al obtener la información del usuario",
            ErrorCodes.SERVER_ERROR,
          ),
        );
      }

      if (!(await this.authPort.comparePasswords(requests.password, userInfo.password))) {
        return ApplicationResponse.failure(
          new ApplicationError("Credenciales inválidas", ErrorCodes.INVALID_CREDENTIALS),
        );
      }

      // Obtener roles del usuario
      const userId = userInfo.id;
      let roleNames: string[] = [];
      let permissions: string[] = [];
      try {
        const roles = await this.userRolePort.listRolesForUser(userId);
        roleNames = roles.map((r) => r.name);
        if (roleNames.length) {
          const permsResp = await this.rolePermissionPort.getPermissionsByRoleNames(roleNames);
          if (permsResp.success && permsResp.data) {
            permissions = permsResp.data.map((p) => p.name);
          }
        }
      } catch (e) {
        this.loggerPort.warn("No se pudieron obtener los roles del usuario");
      }

      const newConcurrencyStamp = this.tokenPort.generateStamp();

      this.userCommandPort
        .updateUser(userId, {
          concurrencyStamp: newConcurrencyStamp,
        })
        .catch((err) => {
          this.loggerPort.error("Ocurrio un error al actualizar el stamp del usuario");
        });
      const payload = { id: userId, roles: roleNames, permissions };
      const authResponse: AuthResponse = await this.authPort.loginUser(requests, payload, {
        profile_image: userInfo.profileImage,
        id: userId,
      });
      authResponse.id = userId;
      authResponse.roles = roleNames;
      (authResponse as any).permissions = permissions;

      if (!authResponse) {
        return ApplicationResponse.failure(
          new ApplicationError("Error al autenticar al usuario", ErrorCodes.SERVER_ERROR),
        );
      }

      return ApplicationResponse.success(authResponse);
    } catch (error: unknown) {
      if (error instanceof ApplicationResponse) {
        this.loggerPort.error("Error controlado durante el login", error);
        return error;
      }

      if (error instanceof Error) {
        this.loggerPort.error("Error inesperado durante el login", error);
        return ApplicationResponse.failure(
          new ApplicationError(
            "Ocurrió un error inesperado",
            ErrorCodes.SERVER_ERROR,
            [error.name, error.message],
            error,
          ),
        );
      }

      return ApplicationResponse.failure(
        new ApplicationError("Ocurrió un error inesperado", ErrorCodes.SERVER_ERROR),
      );
    } finally {
      console.timeEnd("Tiempo en peticion de login");
    }
  }

  async confirmEmail(req: VerifyEmailRequest): Promise<ApplicationResponse<boolean>> {
    try {
      if (!req || areAllValuesEmpty(req)) {
        return new EmptyRequestResponse({ entity: "validación de email" });
      }

      const user = await this.userQueryPort.getUserByFilters({
        email: req.email,
        includeFilters: true,
      } as any);
      if (!user.value || !user.isSuccess) {
        return new NotFoundResponse({
          message: "No se pudo encontrar un usuario con el email dado",
        });
      }
    } catch (error) {}
    return ApplicationResponse.success(true);
  }

  async forgotPassword(req: any): Promise<ApplicationResponse> {
    try {
      if (!req?.email) {
        return ApplicationResponse.failure(
          new ApplicationError("Email requerido", ErrorCodes.VALIDATION_ERROR),
        );
      }
      const userResp = await this.userQueryPort.getUserByFilters({
        email: req.email,
        includeFilters: true,
      } as any);
      if (!userResp.isSuccess || !userResp.value) {
        return ApplicationResponse.emptySuccess();
      }
      const user = userResp.value;
      const recoveryToken = this.tokenPort.generateRecoverPasswordToken(
        user.securityStamp,
        user.concurrencyStamp,
      );
      await this.emailPort.sendEmail({
        to: [user.email],
        from: process.env.EMAIL_FROM as string,
        subject: "Recuperación de contraseña - HarmonyMusical",
        text: `Hola ${user.fullName},\n\nHas solicitado recuperar tu contraseña. Haz clic en el siguiente enlace para restablecerla:\n\n${process.env.FRONTEND_URL}/reset-password?token=${recoveryToken}`,
      });
      return ApplicationResponse.emptySuccess();
    } catch (e: any) {
      return ApplicationResponse.failure(
        new ApplicationError("Error en recuperación", ErrorCodes.SERVER_ERROR, e?.message, e),
      );
    }
  }

  async resetPassword(req: any): Promise<ApplicationResponse> {
    try {
      if (!req?.token || !req?.newPassword) {
        return ApplicationResponse.failure(
          new ApplicationError("Todos los campos son requeridos", ErrorCodes.VALIDATION_ERROR),
        );
      }
      const tokenData = this.tokenPort.verifyToken(req.token);
      if (!tokenData) {
        return ApplicationResponse.failure(
          new ApplicationError("Token inválido o expirado", ErrorCodes.VALIDATION_ERROR),
        );
      }
      const hash = await this.authPort.encryptPassword(req.newPassword);
      const userId = Number(tokenData?.id ?? 0);
      const resp = await this.userCommandPort.updateUser(userId, {
        password: hash,
        security_stamp: this.tokenPort.generateStamp(),
        concurrency_stamp: this.tokenPort.generateStamp(),
      } as any);
      if (!resp.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError("No se pudo actualizar contraseña", ErrorCodes.DATABASE_ERROR),
        );
      }
      return ApplicationResponse.emptySuccess();
    } catch (e: any) {
      return ApplicationResponse.failure(
        new ApplicationError(
          "Error al restablecer contraseña",
          ErrorCodes.SERVER_ERROR,
          e?.message,
          e,
        ),
      );
    }
  }

  async verifyEmail(req: VerifyEmailRequest): Promise<ApplicationResponse> {
    try {
      if (!req?.token) {
        return ApplicationResponse.failure(
          new ApplicationError("Token requerido", ErrorCodes.VALIDATION_ERROR),
        );
      }
      const tokenData = this.tokenPort.verifyToken(req.token);
      if (!tokenData) {
        return ApplicationResponse.failure(
          new ApplicationError("Token inválido o expirado", ErrorCodes.VALIDATION_ERROR),
        );
      }
      const uResp = await this.userQueryPort.getUserByFilters({
        email: req.email,
        includeFilters: true,
      });

      if (uResp.getValue().status == UserStatus.ACTIVE) {
        return ApplicationResponse.failure(
          new ApplicationError("El usuario ya se activo", ErrorCodes.BUSINESS_RULE_VIOLATION),
        );
      }
      if (!uResp.isSuccess || !uResp.value) {
        return ApplicationResponse.failure(
          new ApplicationError("No se encontro el usuario", ErrorCodes.INVALID_EMAIL),
        );
      }
      const up = await this.userCommandPort.updateUser(uResp.value.id, {
        status: "ACTIVE" as any,
        updated_at: new Date(),
        concurrency_stamp: this.tokenPort.generateStamp(),
        security_stamp: this.tokenPort.generateStamp(),
      } as any);
      if (!up.isSuccess) {
        return ApplicationResponse.failure(
          new ApplicationError("No se pudo activar la cuenta", ErrorCodes.DATABASE_ERROR),
        );
      }
      return ApplicationResponse.emptySuccess();
    } catch (e: any) {
      return ApplicationResponse.failure(
        new ApplicationError("Error al verificar email", ErrorCodes.SERVER_ERROR, e?.message, e),
      );
    }
  }
}
