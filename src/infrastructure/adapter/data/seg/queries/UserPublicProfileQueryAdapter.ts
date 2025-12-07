import { Repository, SelectQueryBuilder, Brackets } from "typeorm";
import UserPublicProfileQueryPort from "../../../../../domain/ports/data/seg/query/UserPublicProfileQueryPort";
import Result from "../../../../../domain/shared/Result";
import UserFilters from "../../../../../domain/valueObjects/UserFilters";
import UserPublicProfile from "../../../../../domain/valueObjects/UserPublicProfile";
import { SqlAppDataSource } from "../../../../config/con_database";
import { UserEntity } from "../../../../entities/Sql/seg";
import DomainEntityNotFoundError from "../../../../../domain/errors/EntityNotFoundError";
import { UserStatus } from "../../../../../domain/models/seg/User";

export default class UserPublicProfileQueryAdapter implements UserPublicProfileQueryPort {
  private userRepository: Repository<UserEntity>;

  constructor() {
    this.userRepository = SqlAppDataSource.getRepository(UserEntity);
  }

  async getUserPublicProfileById(id: number): Promise<Result<UserPublicProfile>> {
    try {
      const response: UserEntity = await this.userRepository.findOneOrFail({
        where: { id: id, status: UserStatus.ACTIVE },
        select: {
          id: true,
          username: true,
          profile_image: true,
          learning_points: true,
          favorite_instrument: true,
          created_at: true,
        },
      });

      if (!response) {
        return Result.fail(new DomainEntityNotFoundError({ entity: "usuario" }));
      }

      const userPublicProfile: UserPublicProfile = response.toUserPublicProfile();

      return Result.ok(userPublicProfile);
    } catch (error: unknown) {
      if (error instanceof Error) {
        return Result.fail(error);
      }
    }
    throw new Error("Method not implemented.");
  }
  async getUserPublicProfileByFilters(filters: UserFilters): Promise<Result<UserPublicProfile>> {
    try {
      const qb = this.applyFilters(filters).select([
        "user.id",
        "user.username",
        "user.profile_image",
        "user.learning_points",
        "user.favorite_instrument",
        "user.created_at",
      ]);
      const entity = await qb.getOne();
      if (!entity) return Result.fail(new DomainEntityNotFoundError({ entity: "usuario" }));
      return Result.ok(entity.toUserPublicProfile());
    } catch (error: unknown) {
      return Result.fail(error as Error);
    }
  }
  async searchUsersPublicProfileByFilters(
    filters: UserFilters,
  ): Promise<Result<UserPublicProfile[]>> {
    try {
      const qb = this.applyFilters(filters).select([
        "user.id",
        "user.username",
        "user.profile_image",
        "user.learning_points",
        "user.favorite_instrument",
        "user.created_at",
      ]);
      const rows = await qb.getMany();
      return Result.ok(rows.map((u) => u.toUserPublicProfile()));
    } catch (error: unknown) {
      return Result.fail(error as Error);
    }
  }

  private applyFilters(filters: UserFilters): SelectQueryBuilder<UserEntity> {
    const queryBuilder: SelectQueryBuilder<UserEntity> = this.userRepository
      .createQueryBuilder("user")
      .limit(50)
      .innerJoin("user_roles", "ur", "user.id = ur.user_id")
      .andWhere("ur.role_id = 1")
      .andWhere("user.status = :status", { status: UserStatus.ACTIVE });

    if (filters.includeFilters) {
      if (filters.id) queryBuilder.andWhere("user.id = :id", { id: filters.id });

      if (filters.email)
        queryBuilder.andWhere("user.normalized_email = :email", { email: filters.email });

      if (filters.username)
        queryBuilder.andWhere("user.normalized_username like :username", {
          username: `${filters.username.toUpperCase()}%`,
        });
    } else {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          if (filters.id) qb.orWhere("user.id = :id", { id: filters.id });

          if (filters.email) qb.orWhere("user.normalized_email = :email", { email: filters.email });

          if (filters.username)
            qb.orWhere("user.normalized_username like :username", {
              username: `${filters.username.toUpperCase()}%`,
            });
        }),
      );
    }
    return queryBuilder;
  }
}
