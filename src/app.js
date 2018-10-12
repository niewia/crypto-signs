const server = require('./server');
const alertEmitter = require('./socket/alertEmitter');

// start the server
const port = process.env.PORT || 3000;
const runningServer = server.listen(port, () => {
    console.log('listening on port ' + port);
});

const io = require('socket.io')(runningServer);

alertEmitter.init(io);

module.exports = runningServer;