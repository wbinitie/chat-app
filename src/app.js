const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const { generateMessage } = require("./utils/messages");
const Filter = require("bad-words");
const { addUser, removeUser, getUser, usersInRoom } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const iO = socketIo(server);

const publicPathDirectory = path.join(__dirname, "../src/public");

app.use(express.static(publicPathDirectory));

iO.on("connection", (socket) => {
  console.log("New Web Socket connection"); // logs a  message to the console so you'll know if it connects

  socket.on("join", (options, callback) => {
    // receive a join event to join a chat room with options and a callback; options should contain username and room
    const { error, user } = addUser({ id: socket.id, ...options }); // used a spread operator to add the remaining properties as arguments

    if (error) {
      // if there was an error it will be passed as a callback using events acknowledgement
      return callback(error);
    }

    socket.join(user.room); // will only run there's no error using the join method to create a room

    socket.emit("message", generateMessage("Admin", "Welcome"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage("Admin", `${user.username} has joined`));

    iO.to(user.room).emit("roomData", {
      room: user.room,
      users: usersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) return callback("Profanity is not allowed");

    iO.to(user.user.room).emit(
      "message",
      generateMessage(user.user.username, message)
    );
    callback();
  });

  socket.on("sendLocation", ({ latitude, longitude }, callback) => {
    const user = getUser(socket.id);

    iO.to(user.user.room).emit(
      "locationMessage",
      generateMessage(
        user.user.username,
        `https://google.com/maps?q=${latitude},${longitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      iO.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} disconnected`)
      );

      iO.to(user.room).emit("roomData", {
        room: user.room,
        users: usersInRoom(user.room),
      });
    }
  });
});

module.exports = server;
