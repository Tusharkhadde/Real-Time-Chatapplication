// Map to store user ID -> socket IDs (one user can have multiple connections)
const userSockets = new Map();

const addUserSocket = (userId, socketId) => {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socketId);
};

const removeUserSocket = (userId, socketId) => {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSockets.delete(userId);
    }
  }
};

const getUserSockets = (userId) => {
  const sockets = userSockets.get(userId);
  return sockets ? Array.from(sockets) : [];
};

const isUserOnline = (userId) => {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
};

const getOnlineUsers = () => {
  return Array.from(userSockets.keys());
};

const getAllConnections = () => {
  const connections = [];
  userSockets.forEach((sockets, userId) => {
    connections.push({
      userId,
      socketCount: sockets.size,
      socketIds: Array.from(sockets)
    });
  });
  return connections;
};

module.exports = {
  addUserSocket,
  removeUserSocket,
  getUserSockets,
  isUserOnline,
  getOnlineUsers,
  getAllConnections
};