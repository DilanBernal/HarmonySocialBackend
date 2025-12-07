import { Repository, ILike, DeepPartial } from "typeorm";
import { SqlAppDataSource } from "../../../config/con_database";
import SongEntity from "../../../entities/Sql/music/SongEntity";

const toInt = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

export type CreateSongDTO = {
  title: string;
  audioUrl: string;
  description?: string | null;
  genre?: string | null;
  artistId?: number | null;
  userId?: number | null;
  duration?: number | null | string;
  bpm?: number | null | string;
  keyNote?: string | null;
  album?: number;
  decade?: number | null | string;
  country?: string | null;
  instruments?: unknown | null;
};

export type UpdateSongDTO = Partial<CreateSongDTO>;

export default class SongAdapter {
  private readonly repo: Repository<SongEntity>;

  constructor() {
    this.repo = SqlAppDataSource.getRepository(SongEntity);
  }

  async create(dto: CreateSongDTO): Promise<SongEntity> {
    const partial: DeepPartial<SongEntity> = {
      title: dto.title,
      audioUrl: dto.audioUrl,
      description: dto.description ?? null,
      genre: dto.genre ?? null,
      artistId: dto.artistId ?? null,
      userId: dto.userId ?? null,
      duration: toInt(dto.duration),
      bpm: toInt(dto.bpm),
      keyNote: dto.keyNote ?? null,
      album: { id: dto.album },
      decade: toInt(dto.decade),
      country: dto.country ?? null,
      instruments: dto.instruments ?? null,
      verifiedByArtist: false,
      verifiedByUsers: false,
    };

    const entity = this.repo.create(partial);
    return await this.repo.save(entity);
  }

  async getById(id: number): Promise<SongEntity | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async search(
    query: string,
    page = 1,
    limit = 20,
  ): Promise<{ rows: SongEntity[]; total: number; page: number; limit: number }> {
    const where = query
      ? [{ title: ILike(`%${query}%`) }, { genre: ILike(`%${query}%`) }]
      : undefined;

    const [rows, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { rows, total, page, limit };
  }

  async update(id: number, dto: UpdateSongDTO): Promise<SongEntity | null> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) return null;

    let albumObj: any = undefined;
    if (dto.album !== undefined) {
      // Si el DTO trae un id de álbum, busca el objeto AlbumEntity
      const AlbumEntity = require("../../entities/AlbumEntity").default;
      albumObj = await SqlAppDataSource.getRepository(AlbumEntity).findOne({
        where: { id: dto.album },
      });
    }

    const partial: DeepPartial<SongEntity> = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.audioUrl !== undefined && { audioUrl: dto.audioUrl }),
      ...(dto.description !== undefined && { description: dto.description ?? null }),
      ...(dto.genre !== undefined && { genre: dto.genre ?? null }),
      ...(dto.artistId !== undefined && { artistId: dto.artistId ?? null }),
      ...(dto.userId !== undefined && { userId: dto.userId ?? null }),
      ...(dto.duration !== undefined && { duration: toInt(dto.duration) }),
      ...(dto.bpm !== undefined && { bpm: toInt(dto.bpm) }),
      ...(dto.keyNote !== undefined && { keyNote: dto.keyNote ?? null }),
      ...(dto.album !== undefined && { album: albumObj }),
      ...(dto.decade !== undefined && { decade: toInt(dto.decade) }),
      ...(dto.country !== undefined && { country: dto.country ?? null }),
      ...(dto.instruments !== undefined && { instruments: dto.instruments ?? null }),

      verifiedByArtist: (dto as any)?.verifiedByArtist ?? found.verifiedByArtist,
      verifiedByUsers: (dto as any)?.verifiedByUsers ?? found.verifiedByUsers,
    };

    this.repo.merge(found, partial);
    return await this.repo.save(found);
  }

  async searchByUser(
    userId: number,
    page = 1,
    limit = 20,
  ): Promise<{ rows: SongEntity[]; total: number; page: number; limit: number }> {
    const [rows, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { rows, total, page, limit };
  }

  async delete(id: number): Promise<boolean> {
    const r = await this.repo.delete(id);
    return (r.affected ?? 0) > 0;
  }
}
