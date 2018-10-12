const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const alerts = require('./routes/alerts.js');
const alertEmitter = require('./socket/alertEmitter');

// define the Express app
const app = express();

// enhance your app security with Helmet
app.use(helmet());

// use bodyParser to parse application/json content-type
app.use(bodyParser.json());

// enable all CORS requests
app.use(cors());

// log HTTP requests
app.use(morgan('combined'));

// Serve static files from the React app
process.env.PWD = process.cwd();
var pathToBuild = path.join(process.env.PWD, 'src/views')
app.use(express.static(pathToBuild));

app.use('/api/v1/alerts', alerts)

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(pathToBuild + '/index.html');
});

// start the server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log('listening on port ' + port);
});

const io = require('socket.io')(server);

alertEmitter.init(io);

module.exports = app;