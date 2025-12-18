const serverless = require('serverless-http');
const app = require('../server'); // Path to server.js

module.exports = app;
module.exports.handler = serverless(app);
