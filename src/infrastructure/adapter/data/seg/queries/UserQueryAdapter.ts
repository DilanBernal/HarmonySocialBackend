import {
  EntityNotFoundError,
  In,
  QueryFailedError,
  Repository,
  SelectQueryBuilder,
  TypeORMError,
} from "typeorm";
import DomainEntityNotFoundError from "../../../../../domain/errors/EntityNotFoundError";
import { UserEntity } from "../../../../entities/Sql/seg";
import { SqlAppDataSource } from "../../../../config/con_database";
import User, { UserStatus } from "../../../../../domain/models/seg/User";
import UserQueryPort from "../../../../../domain/ports/data/seg/query/UserQueryPort";
import Response from "../../../../../domain/shared/Result";
import DomainError from "../../../../../domain/errors/DomainError";
import UserFilters from "../../../../../domain/valueObjects/UserFilters";
import {
  ApplicationError,
  ErrorCodes,
} from "../../../../../application/shared/errors/ApplicationError";
import envs from "../../../../config/environment-vars";

export default class UserAdapter implements UserQueryPort {
  private userRepository: Repository<UserEntity>;

  constructor() {
    this.userRepository = SqlAppDataSource.getRepository(UserEntity);
  }

  async getUserByFilters(filters: UserFilters): Promise<Response<User>> {
    try {
      const queryBuilder: SelectQueryBuilder<UserEntity> = this.applyFilters(filters);

      const result = await queryBuilder.getOne();

      if (result) return Response.ok(result.toDomain());
      return Response.fail(new DomainEntityNotFoundError({ entity: "usuario" }));
    } catch (error: unknown) {
      if (error instanceof TypeORMError) {
        if (error instanceof QueryFailedError) {
          return Response.fail(
            new ApplicationError(
              "Ocurrio un error al procesar la solicitud",
              ErrorCodes.DATABASE_ERROR,
              [
                error.name,
                error.stack,
                [
                  error.name,
                  error.stack,
                  envs.ENVIRONMENT === "dev" ? error.query : error.driverError,
                ],
                error,
              ],
              error,
            ),
          );
        }
        return Response.fail(
          new ApplicationError(error.name, ErrorCodes.DATABASE_ERROR, [
            [error.name, error.stack, error.message],
            error,
          ]),
        );
      }
      if (error instanceof Error) {
        throw error;
      }
      throw Error("Ocurrio un error inexplicable");
    }
  }

  async getUsersByIds(ids: number[]): Promise<Response<User[]>> {
    try {
      if (!ids.length) return Response.ok([]);
      const rows = await this.userRepository.find({ where: { id: In(ids) } });
      const mapped = rows.map((r) => r.toDomain());
      return Response.ok(mapped);
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        return Response.fail(
          new ApplicationError(
            "Ocurrio un error con la db al obtener los usuarios por ids",
            ErrorCodes.DATABASE_ERROR,
            [error.name, error.stack, envs.ENVIRONMENT === "dev" ? error.query : error.driverError],
            error,
          ),
        );
      }
      if (error instanceof Error) {
        return Response.fail(
          new ApplicationError(
            "Ocurrio un error al obtener usuarios por ids",
            ErrorCodes.DATABASE_ERROR,
            [error.name, error.stack],
            error,
          ),
        );
      }
      return Response.fail(new DomainError("Error desconocido"));
    }
  }

  async getUserById(id: number): Promise<Response<User>> {
    try {
      const user = await this.userRepository.findOneByOrFail({ id: id });
      return Response.ok(UserEntity.toDomain(user));
    } catch (error) {
      if (error instanceof TypeORMError) {
        if (error instanceof EntityNotFoundError) {
          return Response.fail(
            new DomainEntityNotFoundError({ message: "No se encontraron usuarios" }),
          );
        }
        if (error instanceof QueryFailedError) {
          return Response.fail(
            new ApplicationError(
              "Ocurrio un error en la query",
              ErrorCodes.DATABASE_ERROR,
              [
                error.name,
                error.stack,
                envs.ENVIRONMENT === "dev" ? error.query : error.driverError,
              ],
              error,
            ),
          );
        }
        return Response.fail(
          new ApplicationError(error.name, ErrorCodes.DATABASE_ERROR, [
            [error.name, error.stack, error.message],
            error,
          ]),
        );
      }
      if (error instanceof Error) {
        return Response.fail(
          new ApplicationError(
            "Ocurrio un error al obtener usuarios por ids",
            ErrorCodes.DATABASE_ERROR,
            [error.name],
            error,
          ),
        );
      }
      return Response.fail(new DomainError("Error desconocido", error as Error));
    }
  }

  async existsUserById(id: number): Promise<Response<boolean>> {
    try {
      const userExists = await this.userRepository.existsBy({ id: id });

      return Response.ok(userExists != null);
    } catch (error: unknown) {
      if (error instanceof EntityNotFoundError) {
        return Response.ok(false);
      }
      if (error instanceof Error) {
        return Response.fail(
          new ApplicationError(
            "Ocurrio un error al buscar el usuario",
            ErrorCodes.DATABASE_ERROR,
            { errorName: error.name, errorMessage: error.message },
            error,
          ),
        );
      }
      return Response.fail(
        new ApplicationError("Error desconocido", ErrorCodes.SERVER_ERROR, undefined, undefined),
      );
    }
  }

  async searchUsersByFilters(filters: UserFilters): Promise<Response<User[]>> {
    try {
      const qb: SelectQueryBuilder<UserEntity> = this.applyFilters(filters);

      const result = await qb.getMany();
      return Response.ok(result.map(UserEntity.toDomain));
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        return Response.fail(
          new ApplicationError(
            "Ocurrio un error con la db",
            ErrorCodes.DATABASE_ERROR,
            [error.name, error.stack, envs.ENVIRONMENT === "dev" ? error.query : error.driverError],
            error,
          ),
        );
      }
      if (error instanceof Error) {
        return Response.fail(
          new ApplicationError(
            "Ocurrio un error inesperado",
            ErrorCodes.SERVER_ERROR,
            [error.name, error.stack, error.message],
            error,
          ),
        );
      }
    }
    throw new Error("Method not implemented.");
  }
  async searchUsersByIds(ids: number[]): Promise<Response<Array<User>>> {
    try {
      const result = await this.userRepository.find({ where: { id: In(ids) } });

      return Response.ok(result.map((u) => u.toDomain()));
    } catch (error: unknown) {
      throw error;
    }
  }
  async existsUserByFilters(filters: UserFilters): Promise<Response<boolean>> {
    try {
      const qb: SelectQueryBuilder<UserEntity> = this.applyFilters(filters);
      const result = await qb.select("user.id").getOne();
      return Response.ok(result != null);
    } catch (error: unknown) {
      throw error;
    }
  }

  async getActiveUserById(id: number): Promise<Response<User>> {
    try {
      const result = await this.userRepository.findOneByOrFail({
        id: id,
        status: UserStatus.ACTIVE,
      });

      return Response.ok(result.toDomain());
    } catch (error: unknown) {
      throw error;
    }
  }
  async getActiveUserByFilters(filters: Omit<UserFilters, "status">): Promise<Response<User>> {
    try {
      const qb: SelectQueryBuilder<UserEntity> = this.applyFilters({
        ...filters,
      });

      qb.andWhere("status = :status", { status: UserStatus.ACTIVE });

      const result = await qb.getOneOrFail();

      return Response.ok(result.toDomain());
    } catch (error: unknown) {
      throw error;
    }
  }
  async searchActiveUserByFilters(filters: Omit<UserFilters, "status">): Promise<Response<User[]>> {
    try {
      const qb: SelectQueryBuilder<UserEntity> = this.applyFilters({
        ...filters,
      });

      qb.andWhere("status = :status", { status: UserStatus.ACTIVE });

      const response = await qb.getMany();
      return Response.ok(response.map((u) => u.toDomain()));
    } catch (error: unknown) {
      throw error;
    }
  }

  async searchActiveUsersByIds(ids: number[]): Promise<Response<Array<User>>> {
    try {
      const result = await this.userRepository.findBy({ id: In(ids), status: UserStatus.ACTIVE });
      return Response.ok(result.map((u) => u.toDomain()));
    } catch (error: unknown) {
      throw error;
    }
  }

  async existsActiveUserById(id: number): Promise<Response<boolean>> {
    try {
      const response = await this.userRepository.existsBy({ id: id, status: UserStatus.ACTIVE });

      return Response.ok(response);
    } catch (error: unknown) {
      throw error;
    }
  }

  async existsActiveUserByFilters(
    filters: Omit<UserFilters, "status">,
  ): Promise<Response<boolean>> {
    try {
      const qb: SelectQueryBuilder<UserEntity> = this.applyFilters({
        ...filters,
      });

      qb.andWhere("status = :status", { status: UserStatus.ACTIVE });

      const response = await qb.getExists();

      return Response.ok(response);
    } catch (error: unknown) {
      throw error;
    }
  }

  private applyFilters(filters: UserFilters): SelectQueryBuilder<UserEntity> {
    const queryBuilder: SelectQueryBuilder<UserEntity> =
      this.userRepository.createQueryBuilder("user");

    if (filters.includeFilters) {
      if (filters.id) queryBuilder.andWhere("user.id = :id", { id: filters.id });

      if (filters.email)
        queryBuilder.andWhere("user.normalized_email = :email", {
          email: filters.email.toUpperCase(),
        });

      if (filters.username)
        queryBuilder.andWhere("user.normalized_username = :username", {
          username: filters.username.toUpperCase(),
        });

      if (filters.status)
        queryBuilder.andWhere("user.status = :status", { status: filters.status });
    } else {
      if (filters.id) queryBuilder.orWhere("user.id = :id", { id: filters.id });

      if (filters.email)
        queryBuilder.orWhere("user.normalized_email = :email", { email: filters.email });

      if (filters.username)
        queryBuilder.orWhere("user.normalized_username = :username", {
          username: filters.username,
        });

      if (filters.status) queryBuilder.orWhere("user.status = :status", { status: filters.status });
    }
    return queryBuilder;
  }
}
