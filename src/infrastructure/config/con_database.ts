import { Db, MongoClient, ServerApiVersion } from "mongodb";
import { DataSource } from "typeorm";
import { AlbumEntity, SongEntity, ArtistEntity, MusicTheoryEntity } from "../entities/Sql/music";
import {
  PermissionEntity,
  UserEntity,
  UserRoleEntity,
  RoleEntity,
  RolePermissionEntity,
} from "../entities/Sql/seg";
import * as SocialEntities from "../entities/Sql/social";
import FriendshipEntity from "../entities/Sql/social/FriendshipEntity";
import UserFollowEntity from "../entities/Sql/social/UserFollowsUserEntity";
import envs from "./environment-vars";
import LoggerAdapter from "../adapter/utils/LoggerAdapter";
import LoggerPort from "../../domain/ports/utils/LoggerPort";

const loggerAdapter: LoggerPort = new LoggerAdapter();

export const SqlAppDataSource = new DataSource({
  type: "postgres",
  host: envs.DB_HOST,
  port: Number(envs.DB_PG_PORT),
  username: envs.DB_PG_USER,
  password: envs.DB_PG_PASSWORD,
  database: envs.DB_PG_NAME,
  synchronize: envs.DB_PG_SYNC,
  logging: envs.ENVIRONMENT === "dev" ? true : false,
  schema: envs.DB_PG_SCHEMA,
  entities: [
    UserEntity,
    FriendshipEntity,
    SongEntity,
    ArtistEntity,
    RoleEntity,
    UserRoleEntity,
    PermissionEntity,
    RolePermissionEntity,
    UserFollowEntity,
    AlbumEntity,
    MusicTheoryEntity,
    SocialEntities.PostEntity,
  ],
});

export const connectSqlDB = async () => {
  try {
    await SqlAppDataSource.initialize();
    loggerAdapter.info("Se inicio correctamente la base de datos SQL");
  } catch (error) {
    loggerAdapter.error("Error connecting to the DB", error);
    process.exit(1);
  }
};

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

export const connectMongoDB = async (): Promise<Db> => {
  if (mongoDb) return mongoDb;
  try {
    mongoClient = new MongoClient(envs.DB_MONGO_CON_STRING, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
      },
    });

    await mongoClient.connect();
    mongoDb = mongoClient.db("HarmonySocial");
    loggerAdapter.info("Se inicio correctamente la base de datos NoSQL");

    return mongoDb;
  } catch (error) {
    loggerAdapter.error("Error conectando a MongoDB:", error);
    process.exit(1);
  }
};

export const getMongoDB = (): Db => {
  if (!mongoClient) {
    throw new Error("Mongo no esta conectado");
  }

  return mongoClient.db(envs.DB_MONGO_NAME);
};

export const closeMongoDB = async () => {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
  }
};
