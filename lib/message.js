var mp = require('msgpack');
var debug = require('debug')('cocanode-client:message');

/**
 * Makes request messaage
 * @param  {String|Number|Buffer|Object} message Raw message
 * @return {Object}                              Prepared message
 */
module.exports = function (message) {
  debug('Preparing message');
  return mp.pack([
    'GET',
    '/',
    'HTTP/1.1',
    [  //headers
      ['cocanode-message', message]
    ],
    '' // body
  ]);
};
