import FilePort from "../../../../../src/domain/ports/data/FilesPort";
import { FilePayload } from "../../../../../src/application/dto/utils/FilePayload";
import { FileUploadResponse } from "../../../../../src/application/dto/utils/FileUploadResponse";
import FileStream from "../../../../../src/application/dto/utils/FileStream";
import { ApplicationResponse } from "../../../../../src/application/shared/ApplicationReponse";
import {
  ApplicationError,
  ErrorCodes,
} from "../../../../../src/application/shared/errors/ApplicationError";

// Mock storage for files
const mockImageFiles = new Map<string, FilePayload>();
const mockSongFiles = new Map<string, FilePayload>();

// Initialize with some test data
mockImageFiles.set("test-image-1.jpg", {
  data: Buffer.from("mock image data"),
  filename: "test-image-1.jpg",
  mimeType: "image/jpeg",
});

mockSongFiles.set("test-song-1.mp3", {
  data: Buffer.from("mock song data"),
  filename: "test-song-1.mp3",
  mimeType: "audio/mpeg",
});

const createFilePortMock = (): jest.Mocked<FilePort> => {
  return {
    // ----------- IMAGES -----------
    createImage: jest
      .fn()
      .mockImplementation(
        async (file: FilePayload): Promise<ApplicationResponse<FileUploadResponse>> => {
          if (!file || !file.data || !file.filename) {
            return ApplicationResponse.failure(
              new ApplicationError("Archivo inválido", ErrorCodes.VALIDATION_ERROR),
            );
          }

          const blobName = `images/${Date.now()}-${file.filename}`;
          const url = `https://mockstorage.blob.core.windows.net/images/${blobName}`;

          // Store in mock storage
          mockImageFiles.set(blobName, file);

          return ApplicationResponse.success({
            url,
            blobName,
          });
        },
      ),

    getImageFile: jest
      .fn()
      .mockImplementation(async (id: string): Promise<ApplicationResponse<FilePayload | null>> => {
        const file = mockImageFiles.get(id);
        if (!file) {
          return ApplicationResponse.failure(
            new ApplicationError("Imagen no encontrada", ErrorCodes.BLOB_NOT_FOUND),
          );
        }

        return ApplicationResponse.success(file);
      }),

    getImageUrl: jest
      .fn()
      .mockImplementation(async (id: string): Promise<ApplicationResponse<string | null>> => {
        const file = mockImageFiles.get(id);
        if (!file) {
          return ApplicationResponse.failure(
            new ApplicationError("Imagen no encontrada", ErrorCodes.BLOB_NOT_FOUND),
          );
        }

        const url = `https://mockstorage.blob.core.windows.net/images/${id}`;
        return ApplicationResponse.success(url);
      }),

    updateImage: jest
      .fn()
      .mockImplementation(async (id: string, file: FilePayload): Promise<ApplicationResponse> => {
        if (!mockImageFiles.has(id)) {
          return ApplicationResponse.failure(
            new ApplicationError("Imagen no encontrada", ErrorCodes.BLOB_NOT_FOUND),
          );
        }

        mockImageFiles.set(id, file);
        return ApplicationResponse.emptySuccess();
      }),

    deleteImage: jest.fn().mockImplementation(async (id: string): Promise<ApplicationResponse> => {
      if (!mockImageFiles.has(id)) {
        return ApplicationResponse.failure(
          new ApplicationError("Imagen no encontrada", ErrorCodes.BLOB_NOT_FOUND),
        );
      }

      mockImageFiles.delete(id);
      return ApplicationResponse.emptySuccess();
    }),

    // ----------- SONGS -----------
    createSong: jest
      .fn()
      .mockImplementation(
        async (file: FilePayload): Promise<ApplicationResponse<FileUploadResponse>> => {
          if (!file || !file.data || !file.filename) {
            return ApplicationResponse.failure(
              new ApplicationError("Archivo inválido", ErrorCodes.VALIDATION_ERROR),
            );
          }

          const blobName = `songs/${Date.now()}-${file.filename}`;
          const url = `https://mockstorage.blob.core.windows.net/songs/${blobName}`;

          // Store in mock storage
          mockSongFiles.set(blobName, file);

          return ApplicationResponse.success({
            url,
            blobName,
          });
        },
      ),

    getSongFile: jest
      .fn()
      .mockImplementation(async (id: string): Promise<ApplicationResponse<FilePayload | null>> => {
        const file = mockSongFiles.get(id);
        if (!file) {
          return ApplicationResponse.failure(
            new ApplicationError("Canción no encontrada", ErrorCodes.BLOB_NOT_FOUND),
          );
        }

        return ApplicationResponse.success(file);
      }),

    getSongUrl: jest
      .fn()
      .mockImplementation(async (id: string): Promise<ApplicationResponse<string | null>> => {
        const file = mockSongFiles.get(id);
        if (!file) {
          return ApplicationResponse.failure(
            new ApplicationError("Canción no encontrada", ErrorCodes.BLOB_NOT_FOUND),
          );
        }

        const url = `https://mockstorage.blob.core.windows.net/songs/${id}`;
        return ApplicationResponse.success(url);
      }),

    getSongFileStream: jest
      .fn()
      .mockImplementation(async (id: string): Promise<ApplicationResponse<FileStream>> => {
        const file = mockSongFiles.get(id);
        if (!file) {
          return ApplicationResponse.failure(
            new ApplicationError("Canción no encontrada", ErrorCodes.BLOB_NOT_FOUND),
          );
        }

        // Create a mock readable stream
        const { Readable } = require("stream");
        const mockStream = new Readable({
          read() {
            this.push(file.data);
            this.push(null);
          },
        });

        return ApplicationResponse.success({
          stream: mockStream,
          filename: file.filename,
          mimeType: file.mimeType,
          contentLength: file.data.length,
        } as FileStream);
      }),

    updateSong: jest
      .fn()
      .mockImplementation(async (id: string, file: FilePayload): Promise<ApplicationResponse> => {
        if (!mockSongFiles.has(id)) {
          return ApplicationResponse.failure(
            new ApplicationError("Canción no encontrada", ErrorCodes.BLOB_NOT_FOUND),
          );
        }

        mockSongFiles.set(id, file);
        return ApplicationResponse.emptySuccess();
      }),

    deleteSong: jest.fn().mockImplementation(async (id: string): Promise<ApplicationResponse> => {
      if (!mockSongFiles.has(id)) {
        return ApplicationResponse.failure(
          new ApplicationError("Canción no encontrada", ErrorCodes.BLOB_NOT_FOUND),
        );
      }

      mockSongFiles.delete(id);
      return ApplicationResponse.emptySuccess();
    }),
  };
};

export default createFilePortMock;
