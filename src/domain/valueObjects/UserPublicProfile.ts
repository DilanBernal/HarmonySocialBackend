import User, { UserInstrument } from "../models/seg/User";

export default class UserPublicProfile {
  constructor(
    public readonly id: number,
    public readonly username: string,
    public readonly profileImage: string,
    public readonly activeFrom: number,
    public readonly learningPoints: number,
    public readonly favoriteInstrument: UserInstrument,
  ) {}
}
