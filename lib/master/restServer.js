"use strict";

const ENGINES = ['webkit', 'gecko'];

let restify = require('restify'),
  request = require('request'),
  logger = new (require('../common/logger'))(true); //@TODO correct debug flag value

function RestServer(hubRegistry) {
  this._hubRegistry = hubRegistry;
  this._server = restify.createServer();
  this._server.use(restify.bodyParser());
  this._setupRoutes();
}

RestServer.prototype.listen = function(port) {
  this._server.listen(port);
};

RestServer.prototype._setupRoutes = function() {
  this._server.post('/sessions', this._postSessions.bind(this));
  this._server.get('/hubs', this._getHubs.bind(this));
  this._server.get('/health', this._getHealth.bind(this));
};

RestServer.prototype._postSessions = function(req, resp, next) {
  let hub = this._hubRegistry.find(req.body.location);

  if(hub === null) {
    logger.error('Could not select a hub', {
      location : req.body.location
    });

    return next(new restify.ServiceUnavailableError('No hubs available'));
  }

  if(req.body.engine !== undefined && ENGINES.indexOf(req.body.engine) === -1) {
    logger.warn('Client sent invalid engine', {
      engine : req.body.engine
    });

    return next(new restify.InvalidArgumentError('Invalid engine, supported : ' + ENGINES.join(', ')));
  }

  request.post({
    url : 'http://' + hub.ip + ':' + hub.port + '/new',
    json : true,
    body : {
      engine : req.body.engine
    }
  }).pipe(resp);
};

RestServer.prototype._getHubs = function(req, resp) {
  resp.send(this._hubRegistry.asArray());
};

RestServer.prototype._getHealth = function(req, resp) {
  //@TODO implement me
};

module.exports = RestServer;