import app from "./infrastructure/http/web/app";
import ServerBootstrap from "./infrastructure/bootstrap/server_bootstrap";
import {
  connectSqlDB,
  connectMongoDB,
  closeMongoDB,
  getMongoDB,
} from "./infrastructure/config/con_database";

const server = new ServerBootstrap(app);

(async () => {
  try {
    await connectSqlDB();
    await connectMongoDB();

    process.on("SIGINT", async () => {
      await closeMongoDB();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await closeMongoDB();
      process.exit(0);
    });

    await Promise.all([server.init()]);
  } catch (error) {
    console.error("Ha ocurrido un error iniciando la app", error);
    process.exit(1);
  }
})();
