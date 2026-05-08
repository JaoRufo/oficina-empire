import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";

const app = Fastify();

async function bootstrap() {
  await app.register(cors, {
    origin: "*",
  });

  app.get("/", async () => {
    return {
      status: "ok",
    };
  });

  const io = new Server(app.server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);
    });
  });

  await app.listen({
    port: 3333,
    host: "0.0.0.0",
  });

  console.log("🚀 Server running on port 3333");
}

bootstrap();
