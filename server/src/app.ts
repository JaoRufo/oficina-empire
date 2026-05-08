import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";

const app = Fastify();

type Player = {
  id: string;
  x: number;
  y: number;
};

const players: Record<string, Player> = {};

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

    players[socket.id] = {
      id: socket.id,
      x: 400,
      y: 300,
    };

    socket.emit("currentPlayers", players);

    socket.broadcast.emit("newPlayer", players[socket.id]);

    socket.on("playerMove", (data) => {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;

      socket.broadcast.emit("playerMoved", players[socket.id]);
    });

    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);

      delete players[socket.id];

      io.emit("playerDisconnected", socket.id);
    });
  });

  await app.listen({
    port: 3333,
    host: "0.0.0.0",
  });

  console.log("🚀 Server running on port 3333");
}

bootstrap();
