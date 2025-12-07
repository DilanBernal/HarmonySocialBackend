import ArtistQueryPort from "../../../../../../src/domain/ports/data/music/query/ArtistQueryPort";
import Artist, { ArtistStatus } from "../../../../../../src/domain/models/music/Artist";
import ArtistFilters from "../../../../../../src/domain/valueObjects/ArtistFilters";
import Result from "../../../../../../src/domain/shared/Result";

// Helper function to create mock Artist instances
const createMockArtist = (
  id: number,
  artistUserId: number | undefined,
  artistName: string,
  biography: string | undefined,
  verified: boolean,
  formationYear: number,
  countryCode: string | undefined,
  status: ArtistStatus,
  createdAt: Date,
  updatedAt?: Date,
): Artist => {
  return new Artist(
    id,
    artistUserId,
    artistName,
    biography,
    verified,
    formationYear,
    countryCode,
    status,
    createdAt,
    updatedAt,
  );
};

// Mock data for artists
const createMockArtists = (): Artist[] => [
  createMockArtist(
    1,
    1,
    "Test Artist",
    "A test artist biography",
    true,
    2020,
    "USA",
    ArtistStatus.ACTIVE,
    new Date("2023-01-01"),
    new Date("2023-06-01"),
  ),
  createMockArtist(
    2,
    2,
    "Pending Artist",
    "Waiting for approval",
    false,
    2021,
    "MEX",
    ArtistStatus.PENDING,
    new Date("2023-02-01"),
    undefined,
  ),
  createMockArtist(
    3,
    undefined,
    "Admin Created Artist",
    "Created by admin",
    true,
    2019,
    "COL",
    ArtistStatus.ACTIVE,
    new Date("2023-03-01"),
    new Date("2023-07-01"),
  ),
];

const createArtistQueryPortMock = (): jest.Mocked<ArtistQueryPort> => {
  const artists = createMockArtists();

  return {
    findById: jest.fn().mockImplementation(async (id: number): Promise<Result<Artist>> => {
      const artist = artists.find((a) => a.id === id);
      if (!artist) {
        return Result.fail(new Error("Artista no encontrado"));
      }
      return Result.ok(artist);
    }),

    findByFilters: jest
      .fn()
      .mockImplementation(async (filters: ArtistFilters): Promise<Result<Artist>> => {
        let filteredArtists = [...artists];

        if (filters.id) {
          filteredArtists = filteredArtists.filter((a) => a.id === filters.id);
        }
        if (filters.artistName) {
          filteredArtists = filteredArtists.filter((a) =>
            a.artistName.toLowerCase().includes(filters.artistName!.toLowerCase()),
          );
        }
        if (filters.countryCode) {
          filteredArtists = filteredArtists.filter((a) => a.countryCode === filters.countryCode);
        }

        if (filteredArtists.length === 0) {
          return Result.fail(new Error("Artista no encontrado"));
        }
        return Result.ok(filteredArtists[0]);
      }),

    searchByFilters: jest
      .fn()
      .mockImplementation(async (filters: ArtistFilters): Promise<Result<Artist[]>> => {
        let filteredArtists = [...artists];

        if (filters.artistName) {
          filteredArtists = filteredArtists.filter((a) =>
            a.artistName.toLowerCase().includes(filters.artistName!.toLowerCase()),
          );
        }
        if (filters.verified !== undefined) {
          filteredArtists = filteredArtists.filter((a) => a.verified === filters.verified);
        }
        if (filters.countryCode) {
          filteredArtists = filteredArtists.filter((a) => a.countryCode === filters.countryCode);
        }
        if (filters.formationYear) {
          filteredArtists = filteredArtists.filter(
            (a) => a.formationYear === filters.formationYear,
          );
        }

        return Result.ok(filteredArtists);
      }),

    existsById: jest.fn().mockImplementation(async (id: number): Promise<Result<boolean>> => {
      const exists = artists.some((a) => a.id === id);
      return Result.ok(exists);
    }),

    existsByFilters: jest
      .fn()
      .mockImplementation(async (filters: ArtistFilters): Promise<Result<boolean>> => {
        let filteredArtists = [...artists];

        if (filters.artistName) {
          filteredArtists = filteredArtists.filter((a) =>
            a.artistName.toLowerCase().includes(filters.artistName!.toLowerCase()),
          );
        }
        if (filters.countryCode) {
          filteredArtists = filteredArtists.filter((a) => a.countryCode === filters.countryCode);
        }

        return Result.ok(filteredArtists.length > 0);
      }),
  };
};

export default createArtistQueryPortMock;
