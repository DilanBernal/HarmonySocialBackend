import { Request, Response, Router } from "express";
import AuthService from "../../../application/services/AuthService";
import UserCommandService from "../../../application/services/seg/user/UserCommandService";
import UserQueryService from "../../../application/services/seg/user/UserQueryService";
import { CorePermission } from "../../../domain/models/seg/Permission";
import UserCommandPort from "../../../domain/ports/data/seg/command/UserCommandPort";
import UserPublicProfileQueryPort from "../../../domain/ports/data/seg/query/UserPublicProfileQueryPort";
import UserQueryPort from "../../../domain/ports/data/seg/query/UserQueryPort";
import AuthAdapter from "../../adapter/data/seg/AuthAdapter";
import UserCommandAdapter from "../../adapter/data/seg/commands/UserCommandPortAdapter";
import UserPublicProfileQueryAdapter from "../../adapter/data/seg/queries/UserPublicProfileQueryAdapter";
import UserQueryAdapter from "../../adapter/data/seg/queries/UserQueryAdapter";
import RoleAdapter from "../../adapter/data/seg/RoleAdapter";
import RolePermissionAdapter from "../../adapter/data/seg/RolePermissionAdapter";
import UserRoleAdapter from "../../adapter/data/seg/UserRoleAdapter";
import EmailNodemailerAdapter from "../../adapter/utils/EmailAdapter";
import LoggerAdapter from "../../adapter/utils/LoggerAdapter";
import TokenAdapter from "../../adapter/utils/TokenAdapter";
import UserController from "../../controller/UserController";
import loginSchema from "../../validator/seg/user/LoginValidator";
import registerSchema from "../../validator/seg/user/RegisterValidator";
import userSearchParamsSchema from "../../validator/seg/user/UserPaginatedValidator";
import authenticateToken from "../middleware/authMiddleware";
import {
  enrichPermissionsFromToken,
  requirePermissions,
} from "../middleware/authorizationMiddleware";
import parseNestedQuery from "../middleware/parseNestedQuery";
import { validatePaginatedRequest } from "../middleware/validatePaginatedRequest";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

const userCommandAdapter: UserCommandPort = new UserCommandAdapter();
const userQueryAdapter: UserQueryPort = new UserQueryAdapter();
const userPubliProfileAtapter: UserPublicProfileQueryPort = new UserPublicProfileQueryAdapter();
const authAdapter = new AuthAdapter();
const loggerAdapter = new LoggerAdapter();
const tokenAdapter = new TokenAdapter();
const emailAdapter = new EmailNodemailerAdapter(loggerAdapter);
const roleAdapter = new RoleAdapter();
const userRoleAdapter = new UserRoleAdapter();
const userCommandService = new UserCommandService(
  userCommandAdapter,
  userQueryAdapter,
  roleAdapter,
  userRoleAdapter,
  authAdapter,
  emailAdapter,
  tokenAdapter,
  loggerAdapter,
);
const rolePermissionAdapter: RolePermissionAdapter = new RolePermissionAdapter();
const userQueryService = new UserQueryService(userQueryAdapter, userRoleAdapter, loggerAdapter);
const authService = new AuthService(
  userQueryAdapter,
  userCommandAdapter,
  authAdapter,
  emailAdapter,
  loggerAdapter,
  tokenAdapter,
  userRoleAdapter,
  rolePermissionAdapter,
);
const userController = new UserController(
  userCommandService,
  userQueryService,
  authService,
  loggerAdapter,
);

router.post("/login", validateRequest(loginSchema), async (req: Request, res: Response) => {
  try {
    loggerAdapter.debug(req.body);
    await userController.loginUser(req, res);
  } catch (error: any) {
    console.error("Error en login: ", error);
    res.status(500).json({ message: "Error en el login del usuario" });
  }
});

router.post("/register", validateRequest(registerSchema), async (request, response) => {
  try {
    loggerAdapter.debug(request.body);
    await userController.registerUser(request, response);
  } catch (error: any) {
    console.error("Error en usuario: ", error);
    response.status(500).json({ message: "Error en la creacion del usuario" });
  }
});

router.get(
  "/all",
  authenticateToken,
  enrichPermissionsFromToken,
  requirePermissions(CorePermission.USER_READ_ALL),
  async (req, res) => {
    try {
      await userController.getAllUsers(req, res);
    } catch (error: any) {
      const errorMessage = error.message ?? "Error al traer los usuarios";
      res.status(error.statusCode ?? 500).json({
        message: errorMessage,
      });
      console.error(errorMessage, error);
    }
  },
);

router.get(
  "/id/:id",
  authenticateToken,
  enrichPermissionsFromToken,
  requirePermissions(CorePermission.USER_READ_BY_ID),
  async (req, res) => {
    try {
      await userController.getUserById(req, res);
    } catch (error: any) {
      const errorMessage = error.message ?? "Error al traer el usuario";
      res.status(error.statusCode ?? 500).json({
        message: errorMessage,
      });
      console.error(errorMessage, error);
    }
  },
);

router.get(
  "/email/:email",
  authenticateToken,
  enrichPermissionsFromToken,
  requirePermissions(CorePermission.USER_READ),
  async (req, res) => {
    try {
      await userController.getUserByEmail(req, res);
    } catch (error: any) {
      const errorMessage = error.message ?? "Error al traer el usuario";
      res.status(error.statusCode ?? 500).json({
        message: errorMessage,
      });
      console.error(errorMessage, error);
    }
  },
);

router.get("/basic-info", enrichPermissionsFromToken, async (req, res) => {
  try {
    await userController.getBasicUserData(req, res);
  } catch (error: any) {
    loggerAdapter.debug(
      "Es en la parte despues de que el error no sea instancia ni de NotFoundResponse ni de ApplicationResponse",
      [error, typeof error],
    );

    loggerAdapter.error("Ocurrio un error al traer la info del usuario", [error, error.title]);
    const errorMessage = error.message ?? "Error al traer el usuario";
    res.status(error.statusCode ?? 500).json({
      message: errorMessage,
    });
    console.error(errorMessage, error);
  }
});

router.put(
  "/:id",
  authenticateToken,
  enrichPermissionsFromToken,
  requirePermissions(CorePermission.USER_UPDATE),
  async (req, res) => {
    try {
      await userController.updateUser(req, res);
    } catch (error: any) {
      const errorMessage: string = error.message ?? "Error al actualizar el usuario";
      res.status(error.statusCode ?? 500).json({
        message: errorMessage,
      });
      console.error(errorMessage, error);
    }
  },
);

router.delete(
  "/:id",
  authenticateToken,
  enrichPermissionsFromToken,
  requirePermissions(CorePermission.USER_DELETE),
  async (req, res) => {
    try {
      await userController.logicalDeleteUser(req, res);
    } catch (error: any) {
      const errorMessage = error.message ?? "Error al eliminar el usuario";
      res.status(error.statusCode ?? 500).json({
        message: errorMessage,
      });
      console.error(errorMessage, error);
      res.status(400).json({
        message: errorMessage,
      });
    }
  },
);

// Ruta para recuperar contraseña
router.post("/forgot-password", async (req, res) => {
  try {
    await userController.forgotPassword(req, res);
  } catch (error: any) {
    const errorMessage = error.message ?? "Error al procesar la recuperación de contraseña";
    res.status(error.statusCode ?? 500).json({
      message: errorMessage,
    });
    console.error(errorMessage, error);
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    await userController.resetPassword(req, res);
  } catch (error: any) {
    const errorMessage = error.message ?? "Error al restablecer la contraseña";
    res.status(error.statusCode ?? 500).json({
      message: errorMessage,
    });
    console.error(errorMessage, error);
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    await userController.verifyEmail(req, res);
  } catch (error: any) {
    const errorMessage = error.message ?? "Error al verificar el email";
    res.status(error.statusCode ?? 500).json({
      message: errorMessage,
    });
    console.error(errorMessage, error);
  }
});

router.get(
  "/paginated",
  parseNestedQuery,
  validatePaginatedRequest(userSearchParamsSchema),
  authenticateToken,
  enrichPermissionsFromToken,
  requirePermissions(CorePermission.USER_READ),
  async (req, res) => {
    try {
      await userController.searchPaginatedUsers(req, res);
    } catch (e: any) {
      return res.status(500).json({ message: e?.message ?? "Error interno" });
    }
  },
);

export default router;
