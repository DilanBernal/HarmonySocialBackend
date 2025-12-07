import { RoleUpdateData } from "./../../../domain/ports/data/seg/RolePort";
import { Router } from "express";
import RoleService from "../../../application/services/seg/role/RoleService";
import RoleAdapter from "../../adapter/data/seg/RoleAdapter";
import UserRoleAdapter from "../../adapter/data/seg/UserRoleAdapter";
import LoggerAdapter from "../../adapter/utils/LoggerAdapter";
import RoleController from "../../controller/RoleController";
import authenticateToken from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import roleCreateSchema from "../../validator/seg/role/RoleCreateValidator";
import roleUpdateSchema from "../../validator/seg/role/RoleUpdateValidator";

const router = Router();
const roleAdapter = new RoleAdapter();
const userRoleAdapter = new UserRoleAdapter();
const logger = new LoggerAdapter();
const service = new RoleService(roleAdapter, userRoleAdapter, logger);
const controller = new RoleController(service, logger);

router.post("/", authenticateToken, validateRequest(roleCreateSchema), (req, res) =>
  controller.create(req, res),
);
router.get("/", authenticateToken, (req, res) => controller.list(req, res));
router.get("/:id", authenticateToken, (req, res) => controller.getById(req, res));
router.put("/:id", authenticateToken, validateRequest(roleUpdateSchema), (req, res) =>
  controller.update(req, res),
);
router.delete("/:id", authenticateToken, (req, res) => controller.delete(req, res));

export default router;
