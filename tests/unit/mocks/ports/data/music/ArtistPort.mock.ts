import ArtistPort from "../../../../../../src/domain/ports/data/music/ArtistPort";
import Artist, { ArtistStatus } from "../../../../../../src/domain/models/music/Artist";
import { ArtistSearchFilters } from "../../../../../../src/application/dto/requests/Artist/ArtistSearchFilters";
import { ApplicationResponse } from "../../../../../../src/application/shared/ApplicationReponse";
import {
  ApplicationError,
  ErrorCodes,
} from "../../../../../../src/application/shared/errors/ApplicationError";
import PaginationRequest from "../../../../../../src/application/dto/utils/PaginationRequest";
import PaginationResponse from "../../../../../../src/application/dto/utils/PaginationResponse";

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

let nextId = 4;

const createArtistPortMock = (): jest.Mocked<ArtistPort> => {
  // Clone the array to avoid mutation between tests
  let artists = createMockArtists();

  return {
    create: jest
      .fn()
      .mockImplementation(
        async (
          artist: Omit<Artist, "id" | "createdAt" | "updatedAt">,
        ): Promise<ApplicationResponse<number>> => {
          // Validate required fields
          if (!artist.artistName || !artist.formationYear) {
            return ApplicationResponse.failure(
              new ApplicationError("Datos de artista inválidos", ErrorCodes.VALIDATION_ERROR),
            );
          }

          // Check for duplicate artist name
          const exists = artists.some(
            (a) => a.artistName.toLowerCase() === artist.artistName.toLowerCase(),
          );
          if (exists) {
            return ApplicationResponse.failure(
              new ApplicationError(
                "Ya existe un artista con ese nombre",
                ErrorCodes.DATABASE_ERROR,
              ),
            );
          }

          // Create new artist
          const newArtist = createMockArtist(
            nextId++,
            artist.artistUserId,
            artist.artistName,
            artist.biography,
            artist.verified,
            artist.formationYear,
            artist.countryCode,
            artist.status,
            new Date(),
            undefined,
          );

          artists.push(newArtist);
          return ApplicationResponse.success(newArtist.id);
        },
      ),

    update: jest
      .fn()
      .mockImplementation(
        async (id: number, artist: Partial<Artist>): Promise<ApplicationResponse> => {
          const index = artists.findIndex((a) => a.id === id);
          if (index === -1) {
            return ApplicationResponse.failure(
              new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
            );
          }

          // Update artist properties
          const existing = artists[index];
          if (artist.artistName !== undefined) existing.artistName = artist.artistName;
          if (artist.biography !== undefined) existing.biography = artist.biography;
          if (artist.formationYear !== undefined) existing.formationYear = artist.formationYear;
          if (artist.countryCode !== undefined) existing.countryCode = artist.countryCode;
          if (artist.verified !== undefined) existing.verified = artist.verified;
          existing.updatedAt = new Date();

          return ApplicationResponse.emptySuccess();
        },
      ),

    logicalDelete: jest
      .fn()
      .mockImplementation(async (id: number): Promise<ApplicationResponse> => {
        const artist = artists.find((a) => a.id === id);
        if (!artist) {
          return ApplicationResponse.failure(
            new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
          );
        }

        artist.status = ArtistStatus.DELETED;
        artist.updatedAt = new Date();
        return ApplicationResponse.emptySuccess();
      }),

    findById: jest
      .fn()
      .mockImplementation(async (id: number): Promise<ApplicationResponse<Artist>> => {
        const artist = artists.find((a) => a.id === id);
        if (!artist) {
          return ApplicationResponse.failure(
            new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
          );
        }

        return ApplicationResponse.success(artist);
      }),

    searchPaginated: jest
      .fn()
      .mockImplementation(
        async (
          filters: PaginationRequest<ArtistSearchFilters>,
        ): Promise<ApplicationResponse<PaginationResponse<Artist>>> => {
          let filteredArtists = [...artists];

          // Apply filters
          if (filters.filters) {
            if (filters.filters.name) {
              filteredArtists = filteredArtists.filter((a) =>
                a.artistName.toLowerCase().includes(filters.filters!.name!.toLowerCase()),
              );
            }
            if (filters.filters.verified !== undefined) {
              filteredArtists = filteredArtists.filter(
                (a) => a.verified === filters.filters!.verified,
              );
            }
            if (filters.filters.country) {
              filteredArtists = filteredArtists.filter(
                (a) => a.countryCode === filters.filters!.country,
              );
            }
          }

          // Apply pagination
          const pageSize = filters.page_size ?? 10;
          const page = filters.page_number ?? 0;
          const start = page * pageSize;
          const paginatedArtists = filteredArtists.slice(start, start + pageSize);

          const response = PaginationResponse.create(
            paginatedArtists,
            paginatedArtists.length,
            filteredArtists.length,
          );

          return ApplicationResponse.success(response);
        },
      ),

    existsById: jest
      .fn()
      .mockImplementation(async (id: number): Promise<ApplicationResponse<boolean>> => {
        const exists = artists.some((a) => a.id === id);
        return ApplicationResponse.success(exists);
      }),

    updateStatus: jest
      .fn()
      .mockImplementation(
        async (id: number, status: ArtistStatus): Promise<ApplicationResponse> => {
          const artist = artists.find((a) => a.id === id);
          if (!artist) {
            return ApplicationResponse.failure(
              new ApplicationError("Artista no encontrado", ErrorCodes.VALUE_NOT_FOUND),
            );
          }

          artist.status = status;
          artist.updatedAt = new Date();
          return ApplicationResponse.emptySuccess();
        },
      ),
  };
};

export default createArtistPortMock;
