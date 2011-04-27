var connect = require('connect'),
    redis   = require('redis'),
    mu      = require('mu'),
    Twilio  = require('twilio').Client,
    
    fs      = require('fs');

APP = {};

(function () {
  var config = fs.readFileSync(__dirname + '/config/conf.json');
  APP.config = JSON.parse(config.toString());
  
  config = null;
  
  try {
    var path = process.env.CONFIG_PATH || __dirname + '/config/my_conf.json';
    
    config = fs.readFileSync(path);
  } catch (e) {
    console.log('No my_conf.json found.');
  }
  
  if (config) {
    config = JSON.parse(config)
    for (var k in config) {
      APP.config[k] = config[k];
    }
  }  
}());

APP.redisClient = redis.createClient(APP.config.redisPort, APP.config.redisHost);


connect(
  connect.static(__dirname + '/public'),
  connect.router(require('./app/ideas'))
).listen(APP.config.httpPort);

var twilioClient = new Twilio(
  APP.config.twilio.SID,
  APP.config.twilio.authToken,
  APP.config.twilio.domain
);

var phone = twilioClient.getPhoneNumber(APP.config.twilio.phoneNumber);

phone.setup(function () {
  phone.on('incomingSms', function(reqParams, res) {
      // As above, reqParams contains the Twilio request parameters.
      // Res is a Twiml.Response object.

      console.log('Received incoming SMS with text: ' + reqParams.Body);
      console.log('From: ' + reqParams.From);
      
      APP.redisClient.incr('ids:ideas', function (err, id) {
        APP.redisClient.sadd('ideas:ids', id);
        APP.redisClient.hmset('ideas:' + id, 'idea', reqParams.Body, 'phone', reqParams.From, 'id', id);
      });
  });
})
