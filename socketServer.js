module.exports = (server) => {
  global.io = require('socket.io')(server);
  io.on('connection', (socket)=>{
    console.log('someone connected');
  });
};
