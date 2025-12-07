import User from "../../../../models/seg/User";
import Response from "../../../../shared/Result";
import UserFilters from "../../../../valueObjects/UserFilters";

export default interface UserQueryPort {
  getUserById(id: number): Promise<Response<User>>;
  getUserByFilters(filters: UserFilters): Promise<Response<User>>;
  searchUsersByFilters(filters: UserFilters): Promise<Response<User[]>>;
  searchUsersByIds(ids: number[]): Promise<Response<Array<User>>>;
  existsUserById(id: number): Promise<Response<boolean>>;
  existsUserByFilters(filters: UserFilters): Promise<Response<boolean>>;
  getActiveUserById(id: number): Promise<Response<User>>;
  getActiveUserByFilters(filters: Omit<UserFilters, "status">): Promise<Response<User>>;
  searchActiveUserByFilters(filters: Omit<UserFilters, "status">): Promise<Response<User[]>>;
  searchActiveUsersByIds(ids: number[]): Promise<Response<Array<User>>>;
  existsActiveUserById(id: number): Promise<Response<boolean>>;
  existsActiveUserByFilters(filters: Omit<UserFilters, "status">): Promise<Response<boolean>>;
}
