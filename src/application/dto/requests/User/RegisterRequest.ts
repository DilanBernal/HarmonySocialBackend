import User from "../../../../domain/models/seg/User";

export default interface RegisterRequest
  extends Pick<
    User,
    "fullName" | "email" | "username" | "password" | "profileImage" | "favoriteInstrument"
  > {
  usesDefaultImage?: boolean;
}
