import SongQueryPort from "../../domain/ports/data/music/query/SongQueryPort";
import SongCommandPort from "../../domain/ports/data/music/command/SongCommandPort";
import Song, { SongDifficultyLevel } from "../../domain/models/music/Song";
import { SongCreateDTO } from "../dto/requests/Song/SongCreateRequestDto";
import { SongUpdateDTO } from "../dto/requests/Song/SongUpdateRequestDto";
import SongFilters from "../../domain/valueObjects/SongFilters";

export default class SongService {
  constructor(
    private readonly queryPort: SongQueryPort,
    private readonly commandPort: SongCommandPort,
  ) {}

  async create(dto: SongCreateDTO): Promise<Song> {
    if (!dto?.title?.trim()) throw new Error("title es requerido");
    if (!dto?.audioUrl?.trim()) throw new Error("audioUrl es requerido");

    const songData: Omit<Song, "id" | "createdAt" | "updatedAt"> = {
      title: dto.title.trim(),
      audioUrl: dto.audioUrl.trim(),
      description: dto.description,
      duration: dto.duration,
      bpm: dto.bpm,
      keyNote: dto.keyNote,
      album: dto.album,
      decade: dto.decade,
      genre: dto.genre,
      country: dto.country,
      instruments: dto.instruments,
      difficultyLevel: dto.difficultyLevel as SongDifficultyLevel | null | undefined,
      artistId: dto.artistId,
      userId: dto.userId,
      verifiedByArtist: dto.verifiedByArtist ?? false,
      verifiedByUsers: dto.verifiedByUsers ?? false,
    };

    const result = await this.commandPort.create(songData);
    if (!result.isSuccess) {
      throw result.error;
    }

    const createdId = result.getValue();
    const songResult = await this.queryPort.findById(createdId);
    if (!songResult.isSuccess) {
      throw songResult.error;
    }

    return songResult.getValue();
  }

  async getById(id: number): Promise<Song | null> {
    if (!Number.isFinite(id)) throw new Error("id inválido");
    const result = await this.queryPort.findById(id);
    if (!result.isSuccess) {
      return null;
    }
    return result.getValue();
  }

  async search(
    query = "",
    page = 1,
    limit = 20,
  ): Promise<{ data: Song[]; total: number; page: number; limit: number }> {
    const filters: SongFilters = {
      includeFilters: false,
      title: query || undefined,
    };

    const result = await this.queryPort.searchByFilters(filters);
    if (!result.isSuccess) {
      return { data: [], total: 0, page, limit };
    }

    const songs = result.getValue();
    const start = (page - 1) * limit;
    const paginatedSongs = songs.slice(start, start + limit);

    return { data: paginatedSongs, total: songs.length, page, limit };
  }

  async getMine(
    userId: number,
    page = 1,
    limit = 20,
  ): Promise<{ data: Song[]; total: number; page: number; limit: number }> {
    if (!Number.isFinite(userId)) throw new Error("userId inválido");
    const result = await this.queryPort.searchByUser(userId);
    if (!result.isSuccess) {
      return { data: [], total: 0, page, limit };
    }

    const songs = result.getValue();
    const start = (page - 1) * limit;
    const paginatedSongs = songs.slice(start, start + limit);

    return { data: paginatedSongs, total: songs.length, page, limit };
  }

  async update(id: number, dto: SongUpdateDTO): Promise<Song | null> {
    if (!Number.isFinite(id)) throw new Error("id inválido");

    const updateData: Partial<Song> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.audioUrl !== undefined) updateData.audioUrl = dto.audioUrl;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.bpm !== undefined) updateData.bpm = dto.bpm;
    if (dto.keyNote !== undefined) updateData.keyNote = dto.keyNote;
    if (dto.album !== undefined) updateData.album = dto.album;
    if (dto.decade !== undefined) updateData.decade = dto.decade;
    if (dto.genre !== undefined) updateData.genre = dto.genre;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.instruments !== undefined) updateData.instruments = dto.instruments;
    if (dto.difficultyLevel !== undefined)
      updateData.difficultyLevel = dto.difficultyLevel as SongDifficultyLevel | null | undefined;
    if (dto.artistId !== undefined) updateData.artistId = dto.artistId;
    if (dto.userId !== undefined) updateData.userId = dto.userId;
    if (dto.verifiedByArtist !== undefined) updateData.verifiedByArtist = dto.verifiedByArtist;
    if (dto.verifiedByUsers !== undefined) updateData.verifiedByUsers = dto.verifiedByUsers;

    const result = await this.commandPort.update(id, updateData);
    if (!result.isSuccess) {
      return null;
    }

    const songResult = await this.queryPort.findById(id);
    if (!songResult.isSuccess) {
      return null;
    }

    return songResult.getValue();
  }

  async delete(id: number): Promise<boolean> {
    if (!Number.isFinite(id)) throw new Error("id inválido");
    const result = await this.commandPort.delete(id);
    if (!result.isSuccess) {
      return false;
    }
    return result.getValue();
  }
}
