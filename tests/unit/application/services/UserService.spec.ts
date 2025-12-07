import RegisterRequest from "../../../../src/application/dto/requests/User/RegisterRequest";
import UserSearchParamsRequest from "../../../../src/application/dto/requests/User/UserSearchParamsRequest";
import PaginationRequest from "../../../../src/application/dto/utils/PaginationRequest";
import UserCommandService from "../../../../src/application/services/seg/user/UserCommandService";
import UserQueryService from "../../../../src/application/services/seg/user/UserQueryService";
import { UserInstrument } from "../../../../src/domain/models/seg/User";
import AuthPort from "../../../../src/domain/ports/data/seg/AuthPort";
import UserCommandPort from "../../../../src/domain/ports/data/seg/command/UserCommandPort";
import UserQueryPort from "../../../../src/domain/ports/data/seg/query/UserQueryPort";
import RolePort from "../../../../src/domain/ports/data/seg/RolePort";
import UserRolePort from "../../../../src/domain/ports/data/seg/UserRolePort";
import EmailPort from "../../../../src/domain/ports/utils/EmailPort";
import LoggerPort from "../../../../src/domain/ports/utils/LoggerPort";
import TokenPort from "../../../../src/domain/ports/utils/TokenPort";
import createRolePortMock from "../../mocks/ports/data/seg/RolePort.mock";
import createUserCommandPortMock from "../../mocks/ports/data/seg/UserCommandPort.mock";
import createUserQueryPortMock from "../../mocks/ports/data/seg/UserQueryPort.mock";
import createUserRolePortMock from "../../mocks/ports/data/seg/UserRolePort.mock";
import createLoggerPort from "../../mocks/ports/extra/LoggerPort.mock";
import createEmailPortMock from "../../mocks/ports/utils/EmailPort.mock";
import { createMockTokenPort } from "../../mocks/ports/utils/TokenPort.mock";

describe("UserService", () => {
  let userCommandService: UserCommandService;
  let userQueryService: UserQueryService;

  const mockUserCommandPort: jest.Mocked<UserCommandPort> = createUserCommandPortMock();
  const mockUserQueryPort: jest.Mocked<UserQueryPort> = createUserQueryPortMock();

  const mockAuthPort: jest.Mocked<AuthPort> = {
    comparePasswords: jest.fn(),
    loginUser: jest.fn(),
    encryptPassword: jest.fn(),
    verifyPassword: jest.fn(),
  } as any;

  const mockEmailPort: jest.Mocked<EmailPort> = createEmailPortMock();

  const mockLoggerPort: jest.Mocked<LoggerPort> = createLoggerPort();

  const mockTokenPort: jest.Mocked<TokenPort> = createMockTokenPort();

  const mockUserRolePort: jest.Mocked<UserRolePort> = createUserRolePortMock();

  const mockRolePort: jest.Mocked<RolePort> = createRolePortMock();

  beforeEach(() => {
    jest.clearAllMocks();

    userCommandService = new UserCommandService(
      mockUserCommandPort,
      mockUserQueryPort,
      mockRolePort,
      mockUserRolePort,
      mockAuthPort,
      mockEmailPort,
      mockTokenPort,
      mockLoggerPort,
    );
    userQueryService = new UserQueryService(mockUserQueryPort, mockUserRolePort, mockLoggerPort);
  });

  describe("paginacion", () => {
    it("Debe traer los usuarios correctamente", async () => {
      const req: PaginationRequest<UserSearchParamsRequest> = PaginationRequest.create({}, 15);
      const response = await userQueryService.searchUsers(req);

      expect(response.success).toBeTruthy();
      expect(response.data?.page_size).toBeGreaterThanOrEqual(0);
      expect(response.data?.rows.length).toEqual(response.data?.page_size);
      expect(response.data).not.toBe(undefined);
    });
  });

  describe("Creacion de usuario", () => {
    it("Debe crear el usuario", async () => {
      const req: RegisterRequest = {
        fullName: undefined,
        email: "",
        username: "",
        password: "",
        profileImage: "",
        favoriteInstrument: UserInstrument.GUITAR,
      };
    });
  });
});
