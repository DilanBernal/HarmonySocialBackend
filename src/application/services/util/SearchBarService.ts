import Artist from "../../../domain/models/music/Artist";
import Song from "../../../domain/models/music/Song";
import ArtistQueryPort from "../../../domain/ports/data/music/query/ArtistQueryPort";
import SongQueryPort from "../../../domain/ports/data/music/query/SongQueryPort";
import UserPublicProfileQueryPort from "../../../domain/ports/data/seg/query/UserPublicProfileQueryPort";
import UserPublicProfile from "../../../domain/valueObjects/UserPublicProfile";

export default class SearchBarService {
  constructor(
    private readonly userQueryPort: UserPublicProfileQueryPort,
    private readonly artistQueryPort: ArtistQueryPort,
    private readonly songQueryPort: SongQueryPort,
  ) {}

  async search(req: string) {
    try {
      const promises: Promise<any>[] = [
        this.userQueryPort.searchUsersPublicProfileByFilters({
          username: req,
          includeFilters: true,
        }),
        this.artistQueryPort.searchByFilters({ includeFilters: true, artistName: req }),
        this.songQueryPort.searchByFilters({ includeFilters: false, genre: req, title: req }),
      ];

      const [userResult, artistResult, songResult] = await Promise.allSettled(promises);

      let users: UserPublicProfile[] = [];
      let artists: Artist[] = [];
      let songs: Song[] = [];

      if (userResult.status === "fulfilled" && userResult.value.isSuccess === true) {
        users = userResult.value.value;
      }

      if (artistResult.status === "fulfilled" && artistResult.value.isSuccess === true) {
        artists = artistResult.value.value;
      }
      if (songResult.status === "fulfilled" && songResult.value.isSuccess === true) {
        songs = songResult.value.value;
      }
      let results: {
        users: UserPublicProfile[];
        artists: Artist[];
        songs: Song[];
      } = {
        users: [],
        artists: [],
        songs: [],
      };
      results.users = users;
      results.artists = artists;
      results.songs = songs;
      return results;
    } catch (error) {
      console.log(error);
    }
  }
}
