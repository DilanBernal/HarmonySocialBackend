import SongService from "../../application/services/SongService";
import { Request, Response } from "express";

export default class SongController {
  constructor(private songService: SongService) {}

  async getPagedSongs(req: Request, res: Response) {
    try {
      const { query = "", page = "1", limit = "20" } = req.query;
      const result = await this.songService.search(String(query), Number(page), Number(limit));

      if (result.total < 1) {
        return res.status(404).json({ message: "No se encontraron canciones" });
      }
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Ocurrio un problema al buscar las canciones, intente nuevamente mas tarde",
      });
    }
  }

  async getUserSongList(req: Request, res: Response) {
    try {
      const userId = Number((req as any).userId);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { page = "1", limit = "20" } = req.query as Record<string, string>;
      const data = await this.songService.getMine(userId, Number(page), Number(limit));
      return res.json({ success: true, data });
    } catch (e: any) {
      console.error("[songs] mine/list error:", e);
      return res.status(400).json({ error: e?.message ?? "Bad request" });
    }
  }

  async getSongById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const song = await this.songService.getById(id);
      if (!song) return res.status(404).json({ error: "Not found" });
      res.json(song);
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "Bad request" });
    }
  }

  async createNewSong(req: Request, res: Response) {
    try {
      const body = req.body ?? {};

      const userId = body.userId ?? (req as any).userId;
      const created = await this.songService.create({
        ...body,
        userId: userId ?? null,
      });
      res.status(201).json(created);
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "Bad request" });
    }
  }

  async updateSong(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const updated = await this.songService.update(id, req.body ?? {});
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "Bad request" });
    }
  }

  async deleteSong(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const ok = await this.songService.delete(id);
      if (!ok) return res.status(404).json({ error: "Not found" });
      res.status(204).send();
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "Bad request" });
    }
  }
}
