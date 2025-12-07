import Post from "../../../../../domain/models/social/Post";
import PostQueryPort from "../../../../../domain/ports/data/social/query/PostQueryPort";
import Result from "../../../../../domain/shared/Result";
import PostFilters from "../../../../../domain/valueObjects/PostFilters";

export default class PostQueryAdapter implements PostQueryPort {
  // private readonly

  findById(id: number): Promise<Result<Post>> {
    throw new Error("Method not implemented.");
  }
  findByFilters(filters: PostFilters): Promise<Result<Post>> {
    throw new Error("Method not implemented.");
  }
  searchByFilters(filters: PostFilters): Promise<Result<Post[]>> {
    throw new Error("Method not implemented.");
  }
  searchByUser(userId: number): Promise<Result<Post[]>> {
    throw new Error("Method not implemented.");
  }
  existsById(id: number): Promise<Result<boolean>> {
    throw new Error("Method not implemented.");
  }
}
