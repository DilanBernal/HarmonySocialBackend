import AuthPort from "../../../../../../src/domain/ports/data/seg/AuthPort";
import LoginRequest from "../../../../../../src/application/dto/requests/User/LoginRequest";
import AuthResponse from "../../../../../../src/application/dto/responses/seg/user/AuthResponse";
import bcrypt from "bcryptjs";

const createAuthPortMock = (): jest.Mocked<AuthPort> => {
  return {
    loginUser: jest
      .fn()
      .mockImplementation(
        async (
          credentials: LoginRequest,
          payload: object,
          imageAndId: Pick<AuthResponse, "profile_image" | "id">,
        ): Promise<AuthResponse> => {
          // Generate mock auth response
          const payloadData = payload as { id: number; roles: string[]; permissions: string[] };
          return {
            id: imageAndId.id,
            token: `mock_jwt_token_${Date.now()}`,
            username: credentials.userOrEmail.includes("@")
              ? credentials.userOrEmail.split("@")[0]
              : credentials.userOrEmail,
            email: credentials.userOrEmail.includes("@")
              ? credentials.userOrEmail
              : `${credentials.userOrEmail}@example.com`,
            roles: payloadData.roles || [],
            permissions: payloadData.permissions || [],
            profile_image: imageAndId.profile_image,
          } as AuthResponse;
        },
      ),

    recoverAccount: jest.fn().mockImplementation(async (email: string): Promise<boolean> => {
      // Simulate successful recovery for known emails
      const knownEmails = ["testuser@example.com", "user2@example.com", "user3@example.com"];
      return knownEmails.includes(email.toLowerCase());
    }),

    comparePasswords: jest
      .fn()
      .mockImplementation(async (password: string, hashPassword: string): Promise<boolean> => {
        // For testing, check if the password matches common test patterns
        // In real implementation, this would use bcrypt.compare
        if (password === "password123" && hashPassword.startsWith("$2b$10$")) {
          return true;
        }
        if (password === "wrongpassword") {
          return false;
        }
        // Default behavior: compare using bcrypt
        try {
          return await bcrypt.compare(password, hashPassword);
        } catch {
          return password === hashPassword;
        }
      }),

    encryptPassword: jest.fn().mockImplementation(async (password: string): Promise<string> => {
      // Generate a mock hash that looks like bcrypt output
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    }),
  };
};

export default createAuthPortMock;
