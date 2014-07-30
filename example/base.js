var Cocanode = require('cocanode-client');

var iss = new Cocanode({
  hostname: 'localhost',
  service:  'iss'
});

iss.invoke('http', 'some message', function (err, response) {
  console.log(response);
  iss.close();
});
