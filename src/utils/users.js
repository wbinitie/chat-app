const users = [];

// addUser, removeUser, getUser, getUsersInRoom

const addUser = ({ id, username, room }) => {
  // Clean the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  // Validate the data
  if (!username || !room) {
    return {
      error: "Username and room are required",
    };
  }

  // Check if the user exists
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
  });
  // Validate username
  if (existingUser) {
    return {
      error: "Username already exists",
    };
  }

  // Store user in the room
  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = (id) => {
  const user = users.find((user) => user.id === id);
  if (!user) return undefined;

  return { user };
};

const usersInRoom = (roomName) => {
  const usersInRoom = users.filter((user) => user.room === roomName);
  return usersInRoom;
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  usersInRoom,
};
