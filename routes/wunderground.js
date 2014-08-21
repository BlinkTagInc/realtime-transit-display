var express = require('express');
var request = require('request');
var async = require('async');
var nconf = require('nconf');
var router = express.Router();

router.get('/', function(req, res){
  async.parallel([getConditions, getForecast], function(e, data) {
    res.json(data);
  })


  function getConditions(cb) {
    if(!nconf.get('WUNDERGROUND_TOKEN')) {
      console.error('No Wunderground Token defined.');
      res.json({});
    }
    request.get({
        url: 'http://api.wunderground.com/api/' + nconf.get('WUNDERGROUND_TOKEN') + '/conditions/q/CA/San_Francisco.json'
      , json: true
    }, function(e, response, body) {
      cb(null, body);
    });
  }

  function getForecast(cb) {
    if(!nconf.get('WUNDERGROUND_TOKEN')) {
      console.error('No Wunderground Token defined.');
      res.json({});
    }
    request.get({
        url: 'http://api.wunderground.com/api/' + nconf.get('WUNDERGROUND_TOKEN') + '/forecast/q/CA/San_Francisco.json'
      , json: true
    }, function(e, response, body) {
      cb(null, body);
    });
  }
});


module.exports = router;
