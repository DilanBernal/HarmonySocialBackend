import { findRegex } from "../../../src/application/shared/utils/regexIndex";
import { userValidations } from "../../../src/application/shared/utils/regex/userValidations";

describe("userValidations", () => {
  it("should contain all expected regex names", () => {
    const names = userValidations.map((v) => v.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "usernameRegex",
        "fullNameRegex",
        "userOrEmailRegex",
        "passwordRegex",
        "emailRegex",
        "profileImageRegex",
      ]),
    );
  });

  describe("usernameRegex", () => {
    const regex = findRegex("usernameRegex", userValidations);
    it("validates correct usernames", () => {
      expect("user_01").toMatch(regex);
      expect("aB1*").toMatch(regex);
      expect("user-name#").toMatch(regex);
    });
    it("rejects invalid usernames", () => {
      expect("a").not.toMatch(regex);
      expect("thisusernameiswaytoolongtobevalidbecauseitexceedsthefiftycharacterlimit").not.toMatch(
        regex,
      );
      expect("user name").not.toMatch(regex);
    });
  });

  describe("fullNameRegex", () => {
    const regex = findRegex("fullNameRegex", userValidations);
    it("validates correct full names", () => {
      expect("José Álvarez").toMatch(regex);
      expect("O'Connor").toMatch(regex);
      expect("Jean-Pierre").toMatch(regex);
      expect("Ana María López").toMatch(regex);
    });
    it("rejects invalid full names", () => {
      expect("John123").not.toMatch(regex);
      expect("!@#").not.toMatch(regex);
      expect(" ").not.toMatch(regex);
    });
  });

  describe("userOrEmailRegex", () => {
    const regex = findRegex("userOrEmailRegex", userValidations);
    it("validates usernames", () => {
      expect("user_01").toMatch(regex);
    });
    it("validates emails", () => {
      expect("test@example.com").toMatch(regex);
      expect("user.name+tag@domain.co.uk").toMatch(regex);
    });
    it("rejects invalid values", () => {
      expect("a").not.toMatch(regex);
      expect("invalid-email@").not.toMatch(regex);
    });
  });

  describe("passwordRegex", () => {
    const regex = findRegex("passwordRegex", userValidations);
    it("validates strong passwords", () => {
      expect("Abcdef1!").toMatch(regex);
      expect("StrongPass123$").toMatch(regex);
    });
    it("rejects weak passwords", () => {
      expect("abcdefg").not.toMatch(regex);
      expect("ABCDEFGH").not.toMatch(regex);
      expect("12345678").not.toMatch(regex);
      expect("Abcdefgh").not.toMatch(regex);
      expect("Abcdef1").not.toMatch(regex);
      expect("Abcdef1! ".repeat(20)).not.toMatch(regex); // contains space
    });
  });

  describe("emailRegex", () => {
    const regex = findRegex("emailRegex", userValidations);
    it("validates correct emails", () => {
      expect("test@example.com").toMatch(regex);
      expect("user.name+tag@domain.co.uk").toMatch(regex);
    });
    it("rejects invalid emails", () => {
      expect("test@").not.toMatch(regex);
      expect("test@com").not.toMatch(regex);
      expect("test@.com").not.toMatch(regex);
      expect("test@domain.").not.toMatch(regex);
    });
  });

  describe("profileImageRegex", () => {
    const regex = findRegex("profileImageRegex", userValidations);
    it("validates avatar names", () => {
      for (let i = 1; i <= 8; i++) {
        expect(`avatar${i}`).toMatch(regex);
      }
    });
    it("validates image URLs", () => {
      expect("https://example.com/image.png").toMatch(regex);
      expect("http://domain.com/img.jpg").toMatch(regex);
    });
    it("rejects invalid profile images", () => {
      expect("avatar9").not.toMatch(regex);
      expect("ftp://example.com/image.png").not.toMatch(regex);
      expect("not_a_url").not.toMatch(regex);
    });
  });
});
