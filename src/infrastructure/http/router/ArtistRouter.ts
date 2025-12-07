import { Router } from "express";
import {
  requirePermissions,
  enrichPermissionsFromToken,
} from "../middleware/authorizationMiddleware";
import ArtistService from "../../../application/services/ArtistService";
import { CorePermission } from "../../../domain/models/seg/Permission";
import ArtistQueryAdapter from "../../adapter/data/music/ArtistQueryAdapter";
import ArtistCommandAdapter from "../../adapter/data/music/ArtistCommandAdapter";
import RoleAdapter from "../../adapter/data/seg/RoleAdapter";
import UserRoleAdapter from "../../adapter/data/seg/UserRoleAdapter";
import LoggerAdapter from "../../adapter/utils/LoggerAdapter";
import ArtistController from "../../controller/ArtistController";
import artistCreateSchema from "../../validator/music/artist/ArtistCreateValidator";
import artistPaginatedRequestValidator from "../../validator/music/artist/ArtistPaginatedRequestValidator";
import artistUpdateSchema from "../../validator/music/artist/ArtistUpdateValidator";
import authenticateToken from "../middleware/authMiddleware";
import parseNestedQuery from "../middleware/parseNestedQuery";
import { validatePaginatedRequest } from "../middleware/validatePaginatedRequest";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();
const queryAdapter = new ArtistQueryAdapter();
const commandAdapter = new ArtistCommandAdapter();
const logger = new LoggerAdapter();
const roleAdapter = new RoleAdapter();
const userRoleAdapter = new UserRoleAdapter();
const service = new ArtistService(
  queryAdapter,
  commandAdapter,
  logger,
  roleAdapter,
  userRoleAdapter,
);
const controller = new ArtistController(service, logger);

// Public endpoint: allows anyone to submit an artist request (stays PENDING)
router.post("/", validateRequest(artistCreateSchema), (req, res) => controller.create(req, res));

// Admin endpoint: creates artist directly (accepted). Requires ARTIST_CREATE permission
router.post(
  "/admin",
  authenticateToken,
  enrichPermissionsFromToken,
  requirePermissions(CorePermission.ARTIST_CREATE),
  validateRequest(artistCreateSchema),
  (req, res) => controller.createAsAdmin(req, res),
);
router.get("/", (req, res) => controller.search(req, res));
router.get("/search", (req, res) => controller.search(req, res));
router.get("/id/:id", (req, res) => controller.getById(req, res));

router.get(
  "/paginated",
  parseNestedQuery,
  validatePaginatedRequest(artistPaginatedRequestValidator),
  async (req, res) => await controller.search(req, res),
);

router.put(
  ":id",
  authenticateToken,
  enrichPermissionsFromToken,
  requirePermissions(CorePermission.ARTIST_UPDATE),
  validateRequest(artistUpdateSchema),
  (req, res) => controller.update(req, res),
);
router.delete(
  ":id",
  authenticateToken,
  enrichPermissionsFromToken,
  requirePermissions(CorePermission.ARTIST_DELETE),
  (req, res) => controller.logicalDelete(req, res),
);
router.put(
  ":id/accept",
  authenticateToken,
  enrichPermissionsFromToken,
  requirePermissions(CorePermission.ARTIST_ACCEPT),
  (req, res) => controller.accept(req, res),
);
router.put(
  ":id/reject",
  authenticateToken,
  enrichPermissionsFromToken,
  requirePermissions(CorePermission.ARTIST_REJECT),
  (req, res) => controller.reject(req, res),
);

export default router;
