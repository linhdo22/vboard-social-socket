import { Server } from "socket.io";

const io = new Server(8000, {
//   path: "socket",
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(socket.id);
  socket.send(socket.id);
});
