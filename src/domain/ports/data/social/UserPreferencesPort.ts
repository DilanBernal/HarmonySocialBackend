import { ApplicationResponse } from "../../../../application/shared/ApplicationReponse";
import UserPreferences from "../../../models/social/UserPreferences";
import UserTag from "../../../models/social/UserTag";

export default interface UserPreferencesPort {
  addPositiveUserPostTags(
    userId: number,
    liked: Array<UserTag>,
  ): Promise<ApplicationResponse<UserPreferences>>;
  addNegativeUserPostTags(userId: number, liked: Array<UserTag>): Promise<ApplicationResponse>;
  getPositivePreferencesByUserId(userId: number): Promise<ApplicationResponse<Array<UserTag>>>;
  getNegativePreferencesByUserId(userId: number): Promise<ApplicationResponse<Array<UserTag>>>;
}
