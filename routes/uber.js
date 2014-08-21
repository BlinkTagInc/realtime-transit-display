var express = require('express');
var request = require('request');
var async = require('async');
var nconf = require('nconf');
var router = express.Router();

router.get('/', function(req, res){
  if(!nconf.get('UBER_TOKEN')) {
    console.error('No Uber Token defined.');
    res.json({});
  }

  async.parallel([getEstimates, getSurge], function(e, data) {
    res.json(data);
  });

  function getEstimates(cb) {
    request.get({
      url: 'https://api.uber.com/v1/estimates/time?start_longitude=-122.416949&start_latitude=37.766892',
      json: true,
      headers: {
        Authorization: 'Token ' + nconf.get('UBER_TOKEN')
      }
    }, function(e, response, body) {
      cb(null, body);
    });
  }

  function getSurge(cb) {
    request.get({
      url: 'https://api.uber.com/v1/estimates/price?start_longitude=-122.416949&start_latitude=37.766892&end_longitude=-122.404523&end_latitude=37.787874',
      json: true,
      headers: {
        Authorization: 'Token ' + nconf.get('UBER_TOKEN')
      }
    }, function(e, response, body) {
      cb(null, body);
    });
  }


});

module.exports = router;
