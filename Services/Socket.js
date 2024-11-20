// socket.js
const socketIO = require("socket.io");

let io;

function initSocket(server) {
  io = socketIO(server, {
    cors: {
      origin: "https://localhost:3000", // Replace with your frontend URL in production
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.emit('hello', 'Welcome to the server!');

    socket.emit("test", { message: "You are connected!" });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

function getSocketIO() {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
}

module.exports = { initSocket, getSocketIO };
