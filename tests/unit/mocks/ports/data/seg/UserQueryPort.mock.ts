import {
  ApplicationError,
  ErrorCodes,
} from "../../../../../../src/application/shared/errors/ApplicationError";
import PaginationRequest from "../../../../../../src/application/dto/utils/PaginationRequest";
import UserSearchParamsRequest from "../../../../../../src/application/dto/requests/User/UserSearchParamsRequest";
import User, { UserStatus, UserInstrument } from "../../../../../../src/domain/models/seg/User";
import UserQueryPort from "../../../../../../src/domain/ports/data/seg/query/UserQueryPort";
import UserFilters from "../../../../../../src/domain/valueObjects/UserFilters";
import Result from "../../../../../../src/domain/shared/Result";

// Mock data para las pruebas
const mockUser: User = new User(
  1,
  "Test User",
  "testuser@example.com",
  "testuser",
  "$2b$10$hashedPassword",
  "default.jpg",
  100,
  UserStatus.ACTIVE,
  UserInstrument.GUITAR,
  "mock-concurrency-stamp",
  "mock-security-stamp",
  new Date("2023-01-01"),
  new Date("2023-01-01"),
);

const mockUsers: User[] = [
  mockUser,
  new User(
    2,
    "User Two",
    "user2@example.com",
    "user2",
    "$2b$10$hashedPassword2",
    "default2.jpg",
    50,
    UserStatus.ACTIVE,
    UserInstrument.PIANO,
    "mock-concurrency-stamp-2",
    "mock-security-stamp-2",
    new Date("2023-01-02"),
    new Date("2023-01-02"),
  ),
  new User(
    3,
    "User Three",
    "user3@example.com",
    "user3",
    "$2b$10$hashedPassword3",
    "default3.jpg",
    75,
    UserStatus.ACTIVE,
    UserInstrument.BASS,
    "mock-concurrency-stamp-3",
    "mock-security-stamp-3",
    new Date("2023-01-03"),
    new Date("2023-01-03"),
  ),
];

function applyFilters(filters: UserFilters): boolean {
  let response: boolean = false;

  if (filters.includeFilters) {
    if (filters.id) response = filters.id === 2;
    // For mock purposes, we simulate filtering logic without actual query builder
    if (filters.email) response = filters.email.toLowerCase() === "testuser@example.com";
    if (filters.username) response = filters.username.toLowerCase() === "testuser";
    if (filters.status) response = filters.status === UserStatus.ACTIVE;
  } else {
    // OR logic for exclude filters
    if (filters.id) response = filters.id === 1;
    if (filters.email) response = filters.email.toLowerCase() === "testuser@example.com";
    if (filters.username) response = filters.username.toLowerCase() === "testuser";
    if (filters.status) response = filters.status === UserStatus.ACTIVE;
  }
  return response;
}

const createUserQueryPortMock = (): jest.Mocked<UserQueryPort> => {
  return {
    getUserById: jest.fn().mockImplementation((id: number) => {
      const user = mockUsers.find((u) => u.id === id);
      if (user) {
        return Promise.resolve(Result.ok(user));
      }
      return Promise.resolve(Result.fail(new Error("Usuario no encontrado")));
    }),

    getUserByFilters: jest.fn().mockImplementation((filters: UserFilters) => {
      // Find user matching filters
      const user = mockUsers.find((u) => {
        if (
          filters.email &&
          (u.email.toLowerCase() === filters.email.toLowerCase() ||
            u.normalizedEmail === filters.email.toUpperCase())
        ) {
          return true;
        }
        if (
          filters.username &&
          (u.username.toLowerCase() === filters.username.toLowerCase() ||
            u.normalizedUsername === filters.username.toUpperCase())
        ) {
          return true;
        }
        if (filters.id && u.id === filters.id) {
          return true;
        }
        return false;
      });

      if (user) {
        return Promise.resolve(Result.ok(user));
      }
      return Promise.resolve(Result.fail(new Error("Usuario no encontrado")));
    }),

    searchUsersByFilters: jest.fn().mockImplementation((filters: UserFilters) => {
      let filteredUsers = [...mockUsers];

      if (filters.email) {
        filteredUsers = filteredUsers.filter((u) =>
          u.email.toLowerCase().includes(filters.email!.toLowerCase()),
        );
      }
      if (filters.username) {
        filteredUsers = filteredUsers.filter((u) =>
          u.username.toLowerCase().includes(filters.username!.toLowerCase()),
        );
      }
      if (filters.status) {
        filteredUsers = filteredUsers.filter((u) => u.status === filters.status);
      }

      return Promise.resolve(Result.ok(filteredUsers));
    }),

    searchUsersByIds: jest.fn().mockImplementation((ids: number[]) => {
      const users = mockUsers.filter((u) => ids.includes(u.id));
      return Promise.resolve(Result.ok(users));
    }),

    existsUserById: jest.fn().mockImplementation((id: number) => {
      const exists = mockUsers.some((u) => u.id === id);
      return Promise.resolve(Result.ok(exists));
    }),

    existsUserByFilters: jest.fn().mockImplementation((filters: UserFilters) => {
      const exists = mockUsers.some((u) => {
        if (
          filters.email &&
          (u.email.toLowerCase() === filters.email.toLowerCase() ||
            u.normalizedEmail === filters.email.toUpperCase())
        ) {
          return true;
        }
        if (
          filters.username &&
          (u.username.toLowerCase() === filters.username.toLowerCase() ||
            u.normalizedUsername === filters.username.toUpperCase())
        ) {
          return true;
        }
        return false;
      });
      return Promise.resolve(Result.ok(exists));
    }),

    getActiveUserById: jest.fn().mockImplementation((id: number) => {
      const user = mockUsers.find((u) => u.id === id && u.status === UserStatus.ACTIVE);
      if (user) {
        return Promise.resolve(Result.ok(user));
      }
      return Promise.resolve(Result.fail(new Error("Usuario activo no encontrado")));
    }),

    getActiveUserByFilters: jest.fn().mockImplementation((filters: Omit<UserFilters, "status">) => {
      const user = mockUsers.find((u) => {
        if (u.status !== UserStatus.ACTIVE) return false;
        if (filters.email && u.email.toLowerCase() === filters.email.toLowerCase()) {
          return true;
        }
        if (filters.username && u.username.toLowerCase() === filters.username.toLowerCase()) {
          return true;
        }
        return false;
      });

      if (user) {
        return Promise.resolve(Result.ok(user));
      }
      return Promise.resolve(Result.fail(new Error("Usuario activo no encontrado")));
    }),

    searchActiveUserByFilters: jest
      .fn()
      .mockImplementation((filters: Omit<UserFilters, "status">) => {
        const activeUsers = mockUsers.filter((u) => u.status === UserStatus.ACTIVE);
        return Promise.resolve(Result.ok(activeUsers));
      }),

    searchActiveUsersByIds: jest.fn().mockImplementation((ids: number[]) => {
      const users = mockUsers.filter((u) => ids.includes(u.id) && u.status === UserStatus.ACTIVE);
      return Promise.resolve(Result.ok(users));
    }),

    existsActiveUserById: jest.fn().mockImplementation((id: number) => {
      const exists = mockUsers.some((u) => u.id === id && u.status === UserStatus.ACTIVE);
      return Promise.resolve(Result.ok(exists));
    }),

    existsActiveUserByFilters: jest
      .fn()
      .mockImplementation((filters: Omit<UserFilters, "status">) => {
        const exists = mockUsers.some((u) => {
          if (u.status !== UserStatus.ACTIVE) return false;
          if (filters.email && u.email.toLowerCase() === filters.email.toLowerCase()) {
            return true;
          }
          if (filters.username && u.username.toLowerCase() === filters.username.toLowerCase()) {
            return true;
          }
          return false;
        });
        return Promise.resolve(Result.ok(exists));
      }),
  };
};
export default createUserQueryPortMock;
