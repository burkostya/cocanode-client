var debug = require('debug')('cocanode-client');

var mp            = require('msgpack');
var CocaineClient = require('cocaine').Client;

/**
 * Constructor
 * @param {String} options.hostname Hostname of cocaine
 * @param {Number} options.port     Port of cocaine locator
 * @param {String} options.service  Name of service to connect to
 * @param {String} options.type     Type of service
 */
var Client = function (options) {
  options = options || {};

  options.hostname = options.hostname || 'localhost';
  options.port     = options.port     || 10053;

  // we can use existing cocaine client
  if (options.client) {
    this._cocaineClient = options.client;
    this._isExplicitCocaineClient = true;
  } else {
    this._cocaineClient = new CocaineClient([
      options.hostname,
      options.port
    ]);
  }
  // expose client
  this.client = this._cocaineClient;

  this._cocaineClient.on('error', function onCocaineClientError (err) {
    debug('Cocaine client threw an error: ' + err.message);
    this._cocaineClientError = err;
  });

  if (!options.service) {
    throw new Error('Service name must be provided');
  }

  if (!options.type) {
    options.type = 'app';
    debug('Using default remote service type `app`');
  }

  this._cocaineService = this._cocaineClient.Service(
    options.service,
    options.type
  );

  // FIXME: Remove?
  this._cocaineService.on('error', function (err) {
    debug('Cocaine service threw an error: ' + err.message);
    this._cocaineServiceError = err;
  });

  this.options = options;

  this._isConnected = false;

};

/**
 * Invokes remote method with message
 * @param  {String}                      method   Method name
 * @param  {String|Buffer|Number|Object} message  Message
 * @param  {Function}                    done     Callback (err, response)
 * @return {String|Buffer|Number|Object} response Response from service
 */
Client.prototype.invoke = function (method, message, done) {
  var self = this;

  if (!self._isConnected) {
    debug('Connecting to cocaine from invoke');
    self._connect(function onConnectFromInvoke (err) {
      debug('Connected to cocaine from invoke');
      if (err) { return done(err); }
      self._invoke(method, message, done);
    });
  } else {
    self._invoke(method, message, done);
  }
};

/**
 * Invokes remote method with message
 * @param  {String}                      method   Method name
 * @param  {String|Buffer|Number|Object} message  Message
 * @param  {Function}                    done     Callback (err, response)
 * @return {String|Buffer|Number|Object} response Response from service
 * @private
 */
Client.prototype._invoke = function (method, message, done) {
  debug('Invoking method `' + method + '`');

  var msg = mp.pack([
    'GET',
    '/',
    'HTTP/1.1',
    [  //headers
      ['cocanode-message', message]
    ],
    '' // body
  ]);

  var cocaineService = this._cocaineService;
  var cocaineSession = cocaineService.enqueue(method, msg);

  var responseHeader;
  var responseBody = '';

  cocaineSession.on('readable', function onSessionReadable () {
    var chunk = cocaineSession.read();
    chunk = mp.unpack(chunk);
    if (!responseHeader) {
      debug('Reading header from response');
      responseHeader = chunk;
    } else {
      debug('Reading chunk from response');
      responseBody += chunk;
    }
  });

  function onCocaineSessionError (err) {
    debug('Cocaine session threw error:', err.message);

    cocaineSession.close();
    done(err);
  }
  cocaineSession.once('error', onCocaineSessionError);

  cocaineSession.once('end', function onSessionResponseEnd () {
    debug('Finish getting response');

    // clean up resources
    cocaineSession.removeListener('error', onCocaineSessionError);
    cocaineSession.close();

    done(null, responseBody);
  });


};

/**
 * Connect to cocaine
 * @param  {Function} done Callback
 * @private
 */
Client.prototype._connect = function (done) {
  var cocaineService = this._cocaineService;

  function onCocaineServiceError (err) { return done(err); }
  cocaineService.once('error', onCocaineServiceError);

  cocaineService.once('connect', function onCocaineServiceConnect () {
    cocaineService.removeListener('error', onCocaineServiceError);
    done();
  });
  cocaineService.connect();
};

/**
 * Closes connection
 */
Client.prototype.close = function () {
  debug('Will close in 30 sec...');

  this._cocaineService.close();
  if (!this._isExplicitCocaineClient) {
    this._cocaineClient.close();
  }
};

/**
 * Create stream for response
 * @param  {String} method                       Method name
 * @param  {String|Buffer|Number|Object} message Message for service
 * @return {Stream}                              Stream of response from service
 */
Client.prototype.stream = function (method, message) {

};

module.exports = Client;
