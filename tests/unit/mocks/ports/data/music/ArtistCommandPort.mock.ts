import ArtistCommandPort from "../../../../../../src/domain/ports/data/music/command/ArtistCommandPort";
import Artist, { ArtistStatus } from "../../../../../../src/domain/models/music/Artist";
import Result from "../../../../../../src/domain/shared/Result";

let nextId = 4;

const createArtistCommandPortMock = (): jest.Mocked<ArtistCommandPort> => {
  return {
    create: jest
      .fn()
      .mockImplementation(
        async (artist: Omit<Artist, "id" | "createdAt" | "updatedAt">): Promise<Result<number>> => {
          // Validate required fields
          if (!artist.artistName || !artist.formationYear) {
            return Result.fail(new Error("Datos de artista inválidos"));
          }

          const newId = nextId++;
          return Result.ok(newId);
        },
      ),

    update: jest
      .fn()
      .mockImplementation(async (id: number, artist: Partial<Artist>): Promise<Result<void>> => {
        if (id <= 0) {
          return Result.fail(new Error("Artista no encontrado"));
        }
        return Result.ok(undefined);
      }),

    updateStatus: jest
      .fn()
      .mockImplementation(async (id: number, status: ArtistStatus): Promise<Result<void>> => {
        if (id <= 0) {
          return Result.fail(new Error("Artista no encontrado"));
        }
        return Result.ok(undefined);
      }),

    logicalDelete: jest.fn().mockImplementation(async (id: number): Promise<Result<void>> => {
      if (id <= 0) {
        return Result.fail(new Error("Artista no encontrado"));
      }
      return Result.ok(undefined);
    }),
  };
};

export default createArtistCommandPortMock;
