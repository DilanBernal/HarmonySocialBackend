import { Router } from "express";
import UserRoleAdapter from "../../adapter/data/seg/UserRoleAdapter";
import RoleService from "../../../application/services/seg/role/RoleService";
import UserRoleService from "../../../application/services/seg/userRole/UserRoleService";
import RoleAdapter from "../../adapter/data/seg/RoleAdapter";
import LoggerAdapter from "../../adapter/utils/LoggerAdapter";
import UserRoleController from "../../controller/UserRoleController";
import authenticateToken from "../middleware/authMiddleware";
import { validateRequest } from "../middleware/validateRequest";
import UserRoleAssignValidator from "../../validator/seg/userRole/UserRoleAssignValidator";

const router = Router();
const logger = new LoggerAdapter();
const roleAdapter = new RoleAdapter();
const userRoleAdapter = new UserRoleAdapter();
const userRoleService = new UserRoleService(userRoleAdapter, roleAdapter, logger as any);
const controller = new UserRoleController(userRoleService, logger);

router.post("/", authenticateToken, validateRequest(UserRoleAssignValidator), (req, res) =>
  controller.assign(req, res),
);
router.delete("/:userId/:roleId", authenticateToken, (req, res) => controller.remove(req, res));
router.get("/roles/:userId", authenticateToken, (req, res) => controller.listRoles(req, res));
router.get("/users/:roleName", authenticateToken, (req, res) => controller.listUsers(req, res));

export default router;
