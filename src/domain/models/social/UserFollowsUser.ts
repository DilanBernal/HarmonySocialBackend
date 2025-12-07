export default class UserFollowsUser {
  private _id!: number;
  private _userIdFollower!: number;
  private _userIdFollowed!: number;
  private _createdAt!: Date;

  constructor(id: number, userIdFollower: number, userIdFollowed: number, createdAt?: Date) {
    this.id = id;
    this.userIdFollower = userIdFollower;
    this.userIdFollowed = userIdFollowed;
    this._createdAt = createdAt ?? new Date();
  }

  public get id(): number {
    return this._id;
  }
  public set id(value: number) {
    if (value < 0) {
      throw new Error("El id no puede ser menor a 0");
    }
    this._id = value;
  }

  public get userIdFollower(): number {
    return this._userIdFollower;
  }
  public set userIdFollower(value: number) {
    if (value <= 0) {
      throw new Error("El userIdFollower debe ser mayor a 0");
    }
    this._userIdFollower = value;
  }

  public get userIdFollowed(): number {
    return this._userIdFollowed;
  }
  public set userIdFollowed(value: number) {
    if (value <= 0) {
      throw new Error("El userIdFollowed debe ser mayor a 0");
    }
    if (this._userIdFollower && value === this._userIdFollower) {
      throw new Error("No puedes seguirte a ti mismo");
    }
    this._userIdFollowed = value;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }
}
