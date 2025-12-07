import { FindOptionsWhere, In, QueryFailedError, Repository, Not, And } from "typeorm";
import FriendshipUsersIdsRequest from "../../../../application/dto/requests/Friendship/FriendshipUsersIdsRequest";
import FriendshipsResponse from "../../../../application/dto/responses/FriendshipsResponse";
import { ApplicationResponse } from "../../../../application/shared/ApplicationReponse";
import FriendshipPort from "../../../../domain/ports/data/social/FriendshipPort";
import FriendshipEntity from "../../../entities/Sql/social/FriendshipEntity";
import { SqlAppDataSource } from "../../../config/con_database";
import Friendship, { FrienshipStatus } from "../../../../domain/models/social/Friendship";
import {
  ApplicationError,
  ErrorCodes,
} from "../../../../application/shared/errors/ApplicationError";

export default class FriendshipAdapter implements FriendshipPort {
  private frienshipRepository: Repository<FriendshipEntity>;
  // private repository: Repository;

  constructor() {
    this.frienshipRepository = SqlAppDataSource.getRepository(FriendshipEntity);
  }
  private toDomain(friendship: FriendshipEntity): Friendship {
    return new Friendship(
      friendship.id,
      friendship.user_id,
      friendship.friend_id,
      friendship.status,
      friendship.created_at,
      friendship.updated_at,
    );
  }
  private toEntity(userId: number, friendId: number, status: FrienshipStatus) {
    const friendshipEntity: FriendshipEntity = new FriendshipEntity();
    friendshipEntity.user_id = userId;
    friendshipEntity.friend_id = friendId;
    friendshipEntity.status = status;
    friendshipEntity.created_at = new Date();
    friendshipEntity.friend = { id: friendId } as any;
    friendshipEntity.user = { id: userId } as any;
    return friendshipEntity;
  }
  private toFriendshipsResponse(list: Array<Friendship>): FriendshipsResponse {
    let friendshipResponse: FriendshipsResponse = {
      friendships: list.map((x) => ({
        id: x.id,
        user_id: x.userId,
        friend_id: x.friendId,
        status: x.status,
      })),
    };
    return friendshipResponse;
  }

  async createFriendship(req: FriendshipUsersIdsRequest): Promise<ApplicationResponse<boolean>> {
    try {
      const frienshipEntity = this.toEntity(req.user_id, req.friend_id, FrienshipStatus.PENDING);

      const result = await this.frienshipRepository.save(frienshipEntity);
      if (result) {
        return ApplicationResponse.success(true);
      } else {
        return ApplicationResponse.success(false);
      }
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "No se pudo crear la amistad",
            ErrorCodes.SERVER_ERROR,
            error.message,
            error,
          ),
        );
      }
      if (error instanceof Error) {
        return ApplicationResponse.failure(
          new ApplicationError(
            "Ocurrio un error al crear la amistad",
            ErrorCodes.SERVER_ERROR,
            error.message,
            error,
          ),
        );
      }
      throw ApplicationResponse.failure(
        new ApplicationError("Error desconocido", ErrorCodes.SERVER_ERROR, error),
      );
    }
  }
  async deleteFriendship(id: number): Promise<ApplicationResponse<boolean>> {
    try {
      const result = await this.frienshipRepository.delete(id);
      if (result.affected === 1) {
        return ApplicationResponse.success(true);
      } else {
        return ApplicationResponse.success(false);
      }
    } catch (error) {
      return ApplicationResponse.failure(new ApplicationError("", ErrorCodes.SERVER_ERROR));
    }
  }

  /**
   * Busca una relación de amistad entre dos usuarios, comprobando ambas direcciones
   * @param req Objeto con los IDs de usuario y amigo
   * @returns ApplicationResponse con la relación de amistad encontrada o null si no existe
   */
  async getFriendshipByUsersIds(
    req: FriendshipUsersIdsRequest,
  ): Promise<ApplicationResponse<Friendship | null>> {
    try {
      const whereCondition: FindOptionsWhere<FriendshipEntity>[] = [
        { user: { id: req.user_id }, friend_id: req.friend_id },
        { user: { id: req.friend_id }, friend_id: req.user_id }, // Comprobamos también la relación inversa
      ];

      const entity = await this.frienshipRepository.findOne({
        where: whereCondition,
        select: {
          id: true,
          user_id: true,
          friend_id: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!entity) {
        return ApplicationResponse.success<Friendship | null>(null);
      }

      // Convertimos la entidad al modelo de dominio
      const domainModel = this.toDomain(entity);
      return ApplicationResponse.success<Friendship>(domainModel);
    } catch (error) {
      return ApplicationResponse.failure(
        new ApplicationError("Error al buscar la relación de amistad", ErrorCodes.SERVER_ERROR),
      );
    }
  }

  /**
   * Busca una relación de amistad por su ID
   * @param id ID de la amistad a buscar
   * @returns ApplicationResponse con la relación de amistad encontrada o null si no existe
   */
  async getFriendshipById(id: number): Promise<ApplicationResponse<Friendship | null>> {
    try {
      const entity = await this.frienshipRepository.findOne({
        where: { id: id },
        select: {
          id: true,
          user_id: true,
          friend_id: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!entity) {
        return ApplicationResponse.success<Friendship | null>(null);
      }

      // Convertimos la entidad al modelo de dominio
      const domainModel = this.toDomain(entity);
      return ApplicationResponse.success<Friendship>(domainModel);
    } catch (error) {
      return ApplicationResponse.failure(
        new ApplicationError("Error al buscar la amistad por ID", ErrorCodes.SERVER_ERROR),
      );
    }
  }
  async getAllFriendshipsByUser(id: number): Promise<ApplicationResponse<FriendshipsResponse>> {
    try {
      const whereCondition: FindOptionsWhere<FriendshipEntity>[] = [
        { user_id: id, status: FrienshipStatus.ACCEPTED },
      ];
      const entities = await this.frienshipRepository.find({ where: whereCondition });

      const response = this.toFriendshipsResponse(entities.map((e) => this.toDomain(e)));
      return ApplicationResponse.success(response);
    } catch (error) {
      return ApplicationResponse.failure(new ApplicationError("", ErrorCodes.SERVER_ERROR));
    }
  }
  async getAllCommonFriendships(
    req: FriendshipUsersIdsRequest,
  ): Promise<ApplicationResponse<FriendshipsResponse>> {
    try {
      // Intentamos delegar la intersección y búsqueda a la BD mediante el stored function
      // La función devuelve filas de la tabla friendships correspondientes a los mutual friends
      const sql = `SELECT * from fn_get_mutual_friendships($1, $2)`;
      const rows = await this.frienshipRepository.query(sql, [req.user_id, req.friend_id]);

      if (!rows || rows.length === 0) {
        return ApplicationResponse.success(this.toFriendshipsResponse([]));
      }

      // Mapear filas a modelos de dominio (Friendship)
      const domainList: Friendship[] = rows.map(
        (r: any) =>
          new Friendship(
            Number(r.id),
            Number(r.user_id),
            Number(r.friend_id),
            (r.status as FrienshipStatus) ?? FrienshipStatus.ACCEPTED,
            new Date(r.created_at),
            r.updated_at ? new Date(r.updated_at) : undefined,
          ),
      );

      const response = this.toFriendshipsResponse(domainList);
      return ApplicationResponse.success(response);
    } catch (error) {
      return ApplicationResponse.failure(
        new ApplicationError("", ErrorCodes.SERVER_ERROR, error, error as Error),
      );
    }
  }
  async getFrienshipsByUserAndSimilarName(
    id: number,
    name: string,
  ): Promise<ApplicationResponse<FriendshipsResponse>> {
    try {
      const whereCondition: FindOptionsWhere<FriendshipEntity>[] = [
        { user_id: id, status: FrienshipStatus.ACCEPTED },
      ];
      const entities = await this.frienshipRepository.find({ where: whereCondition });

      const response = this.toFriendshipsResponse(entities.map((e) => this.toDomain(e)));
      return ApplicationResponse.success(response);
    } catch (error) {
      return ApplicationResponse.failure(new ApplicationError("", ErrorCodes.SERVER_ERROR));
    }
  }
  async removeFriendshipById(id: number): Promise<ApplicationResponse> {
    try {
      const whereCondition: FindOptionsWhere<FriendshipEntity>[] = [
        { id: id, status: In([FrienshipStatus.ACCEPTED, FrienshipStatus.PENDING]) },
      ];
      const entity = await this.frienshipRepository.findOne({ where: whereCondition });
      if (!entity) {
        return ApplicationResponse.failure(
          new ApplicationError("No se encontro la amistad", ErrorCodes.VALUE_NOT_FOUND),
        );
      }

      const response = await this.frienshipRepository.delete(entity.id);
      if (response.affected === 0) {
        return ApplicationResponse.failure(
          new ApplicationError("No se pudo eliminar la amistad", ErrorCodes.SERVER_ERROR),
        );
      }

      return ApplicationResponse.emptySuccess();
    } catch (error) {
      return ApplicationResponse.failure(new ApplicationError("", ErrorCodes.SERVER_ERROR));
    }
  }
  async removeFriendshipByUsersIds(req: FriendshipUsersIdsRequest): Promise<ApplicationResponse> {
    try {
      const whereCondition: FindOptionsWhere<FriendshipEntity>[] = [
        {
          user: { id: req.user_id },
          friend: { id: req.friend_id },
          status: In([FrienshipStatus.ACCEPTED, FrienshipStatus.PENDING]),
        },
      ];
      const entity = await this.frienshipRepository.findOne({ where: whereCondition });
      if (!entity) {
        return ApplicationResponse.failure(
          new ApplicationError("No se encontro la amistad", ErrorCodes.VALUE_NOT_FOUND),
        );
      }

      const response = await this.frienshipRepository.delete(entity.id);
      if (response.affected === 0) {
        return ApplicationResponse.failure(
          new ApplicationError("No se pudo eliminar la amistad", ErrorCodes.SERVER_ERROR),
        );
      }

      return ApplicationResponse.emptySuccess();
    } catch (error) {
      return ApplicationResponse.failure(new ApplicationError("", ErrorCodes.SERVER_ERROR));
    }
  }
  async aproveFrienshipRequest(id: number): Promise<ApplicationResponse> {
    try {
      const whereCondition: FindOptionsWhere<FriendshipEntity>[] = [
        { id: id, status: FrienshipStatus.PENDING },
      ];
      const entity = await this.frienshipRepository.findOne({ where: whereCondition });
      if (!entity) {
        return ApplicationResponse.failure(
          new ApplicationError("No se encontro la amistad", ErrorCodes.VALUE_NOT_FOUND),
        );
      }

      entity.status = FrienshipStatus.ACCEPTED;
      entity.updated_at = new Date();

      const response = await this.frienshipRepository.update(entity.id, entity);

      if (response.affected === 0) {
        return ApplicationResponse.failure(
          new ApplicationError("No se pudo eliminar la amistad", ErrorCodes.SERVER_ERROR),
        );
      }

      return ApplicationResponse.emptySuccess();
    } catch (error) {
      return ApplicationResponse.failure(new ApplicationError("", ErrorCodes.SERVER_ERROR));
    }
  }
  async rejectFrienshipRequest(id: number): Promise<ApplicationResponse> {
    try {
      const whereCondition: FindOptionsWhere<FriendshipEntity>[] = [
        { id: id, status: FrienshipStatus.PENDING },
      ];
      const entity = await this.frienshipRepository.findOne({ where: whereCondition });
      if (!entity) {
        return ApplicationResponse.failure(
          new ApplicationError("No se encontro la amistad", ErrorCodes.VALUE_NOT_FOUND),
        );
      }

      entity.status = FrienshipStatus.REJECTED;
      entity.updated_at = new Date();

      const response = await this.frienshipRepository.update(entity.id, entity);

      if (response.affected === 0) {
        return ApplicationResponse.failure(
          new ApplicationError("No se pudo eliminar la amistad", ErrorCodes.SERVER_ERROR),
        );
      }

      return ApplicationResponse.emptySuccess();
    } catch (error) {
      return ApplicationResponse.failure(new ApplicationError("", ErrorCodes.SERVER_ERROR));
    }
  }
}
