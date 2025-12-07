import { Request, Response } from "express";
import PermissionService from "../../application/services/seg/permission/PermissionService";

export default class PermissionController {
  constructor(private service: PermissionService) {}

  create = async (req: Request, res: Response) => {
    const { name, description } = req.body || {};
    const result = await this.service.create(name, description);
    res.status(result.success ? 201 : 400).json(result);
  };

  update = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.service.update(id, req.body || {});
    res.status(result.success ? 200 : 400).json(result);
  };

  delete = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.service.delete(id);
    res.status(result.success ? 200 : 400).json(result);
  };

  list = async (_req: Request, res: Response) => {
    const result = await this.service.getAll();
    res.status(result.success ? 200 : 500).json(result);
  };
}
