const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const alerts = require('./routes/alerts.js');
const alertEmitter = require('./socket/alertEmitter');

// define the Express server
const server = express();

// enhance your server security with Helmet
server.use(helmet());

// use bodyParser to parse serverlication/json content-type
server.use(bodyParser.json());

// enable all CORS requests
server.use(cors());

// log HTTP requests
server.use(morgan('combined'));

// Serve static files from the React server
process.env.PWD = process.cwd();
var pathToBuild = path.join(process.env.PWD, 'src/views')
server.use(express.static(pathToBuild));

server.use('/api/v1/alerts', alerts)

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
server.get('*', (req, res) => {
    res.sendFile(pathToBuild + '/index.html');
});

module.exports = server;