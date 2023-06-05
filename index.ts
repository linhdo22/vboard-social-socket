import { Server } from "socket.io";
import { listen } from "./listen";

export const io = new Server(8000, {
  cors: {
    origin: "*",
  },
});
listen();

io.on("connection", (socket) => {
  const userId = socket.handshake.auth.token;
  socket.join(userId + "");
  console.log(
    "User " + socket.handshake.auth.token + " connected " + socket.id
  );
  socket.emit("message", userId);
});
