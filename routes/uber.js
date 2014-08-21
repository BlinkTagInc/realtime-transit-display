var express = require('express');
var request = require('request');
var nconf = require('nconf');
var router = express.Router();

router.get('/', function(req, res){
  if(!nconf.get('UBER_TOKEN')) {
    console.error('No Uber Token defined.');
    res.json({});
  }
  request.get({
    url: 'https://api.uber.com/v1/estimates/time?start_longitude=-122.416949&start_latitude=37.766892',
    json: true,
    headers: {
      Authorization: 'Token ' + nconf.get('UBER_TOKEN')
    }
  }, function(e, response, body) {
    res.json(body);
  });
});

module.exports = router;
