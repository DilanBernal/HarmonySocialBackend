// tests/mocks/utils/TokenPort.mock.ts
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import TokenPort from "../../../../../src/domain/ports/utils/TokenPort";

export const createMockTokenPort = (): jest.Mocked<TokenPort> => {
  const validTokens = new Map();

  // Generar tokens válidos para testing
  const securityStamp = "security_stamp_123";
  const concurrencyStamp = "concurrency_stamp_123";
  const validToken = jwt.sign(
    { securityStamp, concurrencyStamp, stampsCombined: "combined_123" },
    "test_secret",
    { expiresIn: "24h" },
  );

  validTokens.set(validToken, { securityStamp, concurrencyStamp, email: "testuser@example.com" });

  return {
    generateStamp: jest.fn().mockReturnValue(uuidv4()),
    generateConfirmAccountToken: jest.fn().mockReturnValue(validToken),
    generateRecoverPasswordToken: jest.fn().mockReturnValue(validToken),
    verifyToken: jest.fn().mockImplementation((token: string) => {
      // Simular exactamente el comportamiento de tu TokenAdapter
      try {
        if (token === "valid_token_123") {
          return {
            securityStamp: "security_stamp_123",
            concurrencyStamp: "concurrency_stamp_123",
            stampsCombined: "combined_stamps_123",
            email: "testuser@example.com",
          };
        }

        // Para otros tokens, simular JWT verification
        const payload = validTokens.get(token);
        if (payload) {
          return payload;
        }

        // Simular token inválido
        return null;
      } catch {
        return null;
      }
    }),
  };
};
