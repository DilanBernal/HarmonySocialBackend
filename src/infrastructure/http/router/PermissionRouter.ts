import { Router } from "express";
import PermissionService from "../../../application/services/seg/permission/PermissionService";
import PermissionAdapter from "../../adapter/data/seg/PermissionAdapter";
import PermissionController from "../../controller/PermissionController";

const adapter = new PermissionAdapter();
const service = new PermissionService(adapter);
const controller = new PermissionController(service);

const router = Router();
router.post("/permissions", controller.create);
router.get("/permissions", controller.list);
router.put("/permissions/:id", controller.update);
router.delete("/permissions/:id", controller.delete);

export default router;
