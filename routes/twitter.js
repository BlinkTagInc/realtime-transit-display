var express = require('express');
var router = express.Router();

const async = require('async');
const _ = require('underscore');
const request = require('request');
const nconf = require('nconf');


router.get('/', function(req, res){
  if (!nconf.get('TWITTER_TOKEN')) {
    console.error('No Twitter Token defined.');
    return res.json({});
  }

  const usernames = nconf.get('TWITTER_USERS').split(',').map((username) => `from:${username}`);

  let userCount = 0;
  const userIncrement = 20;
  let tweets = [];

  async.whilst(() => userCount <= usernames.length,
    (cb) => {
      request.get({
        url: 'https://api.twitter.com/1.1/search/tweets.json',
        qs: {
          count: 100,
          include_entities: true,
          result_type: 'recent',
          since_id: req.query.since_id || 0,
          q: usernames.slice(userCount, (userCount + userIncrement)).join(' OR '),
          tweet_mode: 'extended',
        },
        headers: {
          Authorization: `Bearer ${nconf.get('TWITTER_TOKEN')}`
        },
        json: true
      }, (e, response, body) => {
        try {
          tweets = tweets.concat(body.statuses);
        } catch (e) {}
        cb();
      });
      userCount += userIncrement;
    }, (e, result) => {
      res.json(tweets);
    }
  );
});

module.exports = router;
