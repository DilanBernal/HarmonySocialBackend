import User, { UserStatus, UserInstrument } from "../../../../../../src/domain/models/seg/User";
import UserCommandPort from "../../../../../../src/domain/ports/data/seg/command/UserCommandPort";
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

let nextId = 4;

const createUserCommandPortMock = (): jest.Mocked<UserCommandPort> => {
  return {
    createUser: jest.fn().mockImplementation((user: Omit<User, "id">) => {
      // Simular éxito en la creación
      if (user.email && user.username && user.fullName) {
        const newId = nextId++;
        return Promise.resolve(Result.ok(newId));
      }
      // Simular error de duplicado
      if (user.email === mockUser.email) {
        return Promise.resolve(Result.fail(new Error("Email ya existe")));
      }
      const newId = nextId++;
      return Promise.resolve(Result.ok(newId));
    }),

    updateUser: jest.fn().mockImplementation((id: number, user: Partial<User>) => {
      const existingUser = mockUsers.find((u) => u.id === id);
      if (existingUser) {
        return Promise.resolve(Result.ok(undefined));
      }
      return Promise.resolve(Result.fail(new Error("Usuario no encontrado")));
    }),

    deleteUser: jest.fn().mockImplementation((id: number) => {
      const existingUser = mockUsers.find((u) => u.id === id);
      if (existingUser) {
        return Promise.resolve(Result.ok(undefined));
      }
      return Promise.resolve(Result.fail(new Error("Usuario no encontrado")));
    }),
  };
};

export default createUserCommandPortMock;
