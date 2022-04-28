const app = require("express")();
app.use(cors());
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("Running");
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  // const user = users
  console.log("a user connected.");
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //send and get message
  socket.on("sendMessage", ({ senderId, receiverID, text }) => {
    const user = getUser(receiverID);
    user &&
      io.to(user.socketId).emit("getMessage", {
        senderId,
        text,
      });
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });

  socket.on("sendNotification", ({ senderName, receiverID,type, tweetId, avatar }) => {
    const user = getUser(receiverID);
    user && io.to(user.socketId).emit("getNotification", {
      senderName,
      type, 
      tweetId,
      avatar
    });
  });

  socket.on("callUser", ({ userToCall, signalData, from }) => {
    const user = getUser(userToCall);
    const sernderID = getUser(from);
    io.to(user.socketId).emit("callUser", {
      signal: signalData,
      from: sernderID.socketId,
    });
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });
});



server.listen(PORT, () => {
  console.log(`Express is working on port ${PORT}`);
});