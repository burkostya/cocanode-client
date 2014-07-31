var Cocanode = require('cocanode-client');

var iss = new Cocanode({
  hostname: 'localhost',
  service:  'iss'
});

iss.invoke('http', 'some message', function (err, response) {
  console.log(response);
});

// Or you can stream response
var stream = iss.responseStream('http', 'give me a stream please');
stream.pipe(process.stdout);

stream.on('end', function () {
  iss.close();
});
