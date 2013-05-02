var async = require('async')
  , _ = require('underscore')
  , moment = require('moment')
  , request = require('request');


module.exports = function routes(app){
  

  app.get('/api/weather.json', function(req, res){
    async.parallel([getConditions, getForecast], function(e, data) {
      res.json(data);
    })
    

    function getConditions(cb) {
      if(!app.set('wundergroundToken')) { 
        console.error('No Wunderground Token defined.');
        res.json({});
      }
      request.get({
          url: 'http://api.wunderground.com/api/' + app.set('wundergroundToken') + '/conditions/q/CA/San_Francisco.json'
        , json: true
      }, function(e, response, body) {
        cb(null, body);
      });
    }

    function getForecast(cb) {
      if(!app.set('wundergroundToken')) { 
        console.error('No Wunderground Token defined.');
        res.json({});
      }
      request.get({
          url: 'http://api.wunderground.com/api/' + app.set('wundergroundToken') + '/forecast/q/CA/San_Francisco.json'
        , json: true
      }, function(e, response, body) {
        cb(null, body);
      });
    }
  });



  //Nothing specified
  app.use(function(req, res, next){
    res.send(404, 'Sorry cant find that!');
  });
}

