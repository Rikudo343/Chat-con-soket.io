const application = require('express')();
const server = require('http').createServer(application)
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000

const users = {};

  application.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

  server.listen(PORT, () => {
    console.log('Servidor ejecutando en puerto: ' + PORT);
  });

io.on('connection', (socket) => {

  socket.on('new file', (data) => {
    io.emit('file received', {
      file: data.file,
      filename: data.filename,
      filetype: data.filetype,
      sender: socket.username
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Usuario desconectado - Usuario: ' + socket.username);
    delete users[socket.username];
  });

  socket.on('new message', (msg) => {
    io.emit('send message', {message: msg, user: socket.username});
  });

  socket.on('new user', (usr) => {
    if (users[usr]) {
      socket.emit('username taken');
    } else {
      socket.username = usr;
      console.log('Usuario conectado - Usuario: ' + socket.username);
      users[usr] = true;
    }
  });

  socket.on('private message', (data) => {
    const recipientSocket = findRecipientSocket(data.recipient);
    if (recipientSocket) {
      recipientSocket.emit('private message', {
        message: data.message,
        sender: socket.username,
      });
      socket.emit('private message', {
        message: data.message,
        recipient: data.recipient,
      });
    } else {
      socket.emit('private message error', {
        error: `El usuario ${data.recipient} no está conectado al chat.`,
      });
    }
  });

  socket.on('disconnect', () => {
      console.log('Usuario desconectado - Usuario: ' + socket.username);

      delete users[socket.username];
      io.emit('user left', socket.username);
   });
   

});

function findRecipientSocket(username) {
  const connectedSockets = Array.from(io.sockets.sockets.values());
  for (const socket of connectedSockets) {
    console.log('Socket:', socket);
    if (socket.username === username) {
      return socket;
    }
  }
  return null;
}