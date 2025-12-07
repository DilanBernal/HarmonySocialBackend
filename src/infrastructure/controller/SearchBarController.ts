import { Request, Response } from "express";
import SearchBarService from "../../application/services/util/SearchBarService";
export default class SearchBarController {
  constructor(private readonly searchBarService: SearchBarService) {}

  async search(req: Request, res: Response) {
    const value = req.query.searchBy;
    if (!value) {
      return res.status(400).json({ message: "No se envio valo" });
    }
    const response = await this.searchBarService.search(value.toString());
    return res.status(200).json(response);
  }
}
