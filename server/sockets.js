const { io } = require("./server");
const game = require("./game-logic/game.server");

const TIME_STEP = 50;

function validation(username) {
  return true;
}

//Middleware para autenticacion
io.use((client, next) => {
  let username = client.handshake.query.username;
  console.log("Middleware: validando conexion ", username);
  if (validation(username)) {
    return next();
  }
  //client.disconnect();
  return next(new Error("authentication error"));
});

io.on("connection", (client) => {
  let username = client.handshake.query.username;
  console.log("Usuario Conectado", username);
  game.spawnPlayer(client.id, username);
  client.emit("welcomeMessage", {
    message: "Bienvenido al juego",
    id: client.id,
    state: game.STATE,
  });

  client.on("move", (axis) => {
    game.setAxis(client.id, axis);
  });
  client.broadcast.emit("userConnection", {
    message: "Se ha conectado un nuevo usuario",
  });

  //Listeners
  client.on("broadcastEmit", (data, callback) => {
    console.log("Cliente:", data);
    client.broadcast.emit("broadcastEmit", data);
    callback({ message: "El mensaje fue recibido correctamente" });
  });
  client.on("disconnect", () => {
    console.log("Usuario desconectado");
    game.removePlayer(client.id);
    client.broadcast.emit("userDisconnection", {
      message: "Se ha desconectado un usuario",
    });
  });
});

setInterval(() => {
  io.emit("updateState", { state: game.STATE });
}, TIME_STEP);
