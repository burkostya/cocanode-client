# cocanode-client

Wrapper around cocaine-framework-nodejs for simplifying connecting to
cocaine services created with cocanode-service

## Installation

`npm install cocanode`

## Usage

```js
var Cocanode = require('cocanode-client');
```

## API

### new Cocanode(options)

Options:
  - hostname `String` Hostname of cocaine. Default `localhost`
  - port `Number` Port of locator on cocaine host. Default `10053`
  - service `String` __Required.__ Name of service to connect to.
  - type `String` Type of service to connect to. Default `app`
  - client `Object` _Optional_ Instance of require('cocaine').Client
    Use it if you do not want to create connection for every service.

### invoke(method, message, done)

  - method `String` Name of service method to invoke
  - message `Mixed` Message for method
  - done `Function` Callback
    * err `Error` Error
    * response `Object` response from service

### responseStream(method, message)

  - method `String` Name of service method to invoke
  - message `Mixed` Message for method

  Returns response from service as Readable stream

```js
var water = service.responseStream('water', '200 gallons please');
water.pipe(aquarium);
```

### close()

  Closes connection to service in 30 sec because of cocaine internals.

## Example

```js
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
```

Same but using `cocaine` module:

```js
var Client = require('cocaine').Client;
var cli = new Client(['localhost', 10053]);

var mp = require('msgpack');

var app = cli.Service('iss', 'app');

cli.on('error', function(err){
  console.log('client error', err);
});

app.on('error', function(err){
  console.log('app error', err);
});

app.connect();

app.on('connect', function(){
  var s = app.enqueue(
    'http',
    mp.pack(['GET','/','HTTP/1.1',[['some-header','value']],'']));

  var header;
  var body = [];

  s.on('data', function(chunk){
    var data = mp.unpack(chunk);
    if(header === undefined){
      header = data;
    } else {
      body.push(data);
    }
  });

  s.on('end', function(){
    app.close();
    cli.close();
  });

  s.on('error', function(err){
    console.log('reply error', err);
  });
});
```

### Development

Use env `DEBUG=cocaine-client` for verbose mode
