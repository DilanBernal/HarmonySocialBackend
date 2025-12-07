import UserTag from "./UserTag";

type UserPreferences = {
  userId: number;
  userPostTags?: Array<UserTag>;
  userSongTags?: Array<UserTag>;
  userArtistsTags?: Array<UserTag>;
};

export default UserPreferences;
