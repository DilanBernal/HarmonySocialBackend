import User from "../../../domain/models/seg/User";
import UserFilters from "../../../domain/valueObjects/UserFilters";
import UserPublicProfile from "../../../domain/valueObjects/UserPublicProfile";
import PaginationRequest from "../../dto/utils/PaginationRequest";
import PaginationResponse from "../../dto/utils/PaginationResponse";
export default interface UserAppQueryPort {
  getUsersPublicProfilePaginated(
    request: PaginationRequest<UserFilters>,
  ): Promise<PaginationResponse<UserPublicProfile>>;
  getUsersPaginated(request: PaginationRequest<UserFilters>): Promise<PaginationResponse<User>>;
}
