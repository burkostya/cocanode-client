var util = require('util');

var debug = require('debug')('cocanode-client:responseStream');
var mp    = require('msgpack');

var message = require('./message.js');

var Readable = require('readable-stream').Readable;

var ResponseStream = function (options) {
  var self = this;

  debug('Constructor');

  Readable.call(self);

  self.options = options;
};

util.inherits(ResponseStream, Readable);

ResponseStream.prototype._read = function () {
  var self = this;

  debug('_read');

  var client = self.options.client;

  debug('Connecting to cocaine');
  client._connect(function (err) {
    debug('Connected to cocaine');
    if (err) { self.emit('error', err); }

    if (!self._cocaineSession) {
      self._setupSession();
    }

    self._readResponse();
  });
};

/**
 * Reads response from cocaine and pipes to response stream
 * @private
 */
ResponseStream.prototype._readResponse = function () {
  var chunk = this._cocaineSession.read();

  if (chunk === null) {
    return this.push('');
  }

  chunk = mp.unpack(chunk);

  if (!this._header) {
    debug('Reading header');
    this._header = chunk;
    this.push('');
  } else {
    debug('Reading chunk');
    this.push(chunk);
  }

};

/**
 * Setup cocaine session
 * @private
 */
ResponseStream.prototype._setupSession = function () {
  var self = this;

  var options = self.options;

  var msg = message(options.message);

  var cocaineService = options.client._cocaineService;
  self._cocaineSession = cocaineService.enqueue(options.method, msg);

  self._cocaineSession.once('end', function onCocaineSessionEnd () {
    self.push(null);
  });

  self._cocaineSession.once('error', function onCocaineSessionError (err) {
    self.emit('error', err);
  });

  self._cocaineSession.on('readable', function onCocaineSessionReadable () {
    self.read(0);
  });
};

module.exports = ResponseStream;
