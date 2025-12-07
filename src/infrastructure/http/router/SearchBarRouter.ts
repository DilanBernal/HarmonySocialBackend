import { Request, Response, Router } from "express";
import SearchBarController from "../../controller/SearchBarController";
import SearchBarService from "../../../application/services/util/SearchBarService";
import UserPublicProfileQueryAdapter from "../../adapter/data/seg/queries/UserPublicProfileQueryAdapter";
import UserPublicProfileQueryPort from "../../../domain/ports/data/seg/query/UserPublicProfileQueryPort";
import ArtistQueryPort from "../../../domain/ports/data/music/query/ArtistQueryPort";
import SongQueryPort from "../../../domain/ports/data/music/query/SongQueryPort";
import ArtistQueryAdapter from "../../adapter/data/music/ArtistQueryAdapter";
import SongQueryAdapter from "../../adapter/data/music/SongQueryAdapter";

const router = Router();

const userQueryPort: UserPublicProfileQueryPort = new UserPublicProfileQueryAdapter();
const artistQueryPort: ArtistQueryPort = new ArtistQueryAdapter();
const songQueryPort: SongQueryPort = new SongQueryAdapter();
const searchBarService: SearchBarService = new SearchBarService(
  userQueryPort,
  artistQueryPort,
  songQueryPort,
);
const searchBarController: SearchBarController = new SearchBarController(searchBarService);

router.get("", async (req: Request, res: Response) => {
  await searchBarController.search(req, res);
});

export default router;
