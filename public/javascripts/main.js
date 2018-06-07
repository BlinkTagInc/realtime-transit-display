var bartAPIKey = 'MW9S-E7SL-26DU-VV8V';
var since_id = 0;
var isPi = (navigator.userAgent.indexOf("armv6") != -1 || navigator.userAgent.indexOf("Midori") != -1);

jQuery.fn.orderBy = function(keySelector) {
  return this.sort(function(a,b) {
    a = keySelector.apply(a);
    b = keySelector.apply(b);
    if (a > b)
      return 1;
    if (a < b)
      return -1;
    return 0;
  });
};


var linkify = (function () {
  var replaceSubstr = function (text, i, j, substr) {
    return text.substr(0, i) + substr + text.substr(j);
  }

  var mergeByIndices = function (a, b) {
    var i = 0,
      j = 0,
      result = [];
    while (i < a.length || j < b.length) {
      if (i < a.length && (j >= b.length || a[i].indices[0] < b[j].indices[0]))
        result.push(a[i++]);
      else
        result.push(b[j++]);
    }
    return result;
  }

  var linkEntity = function (entity) {
    if (entity.name) // user mention
      return "<a href=\"http://twitter.com/" + entity.screen_name + "\" class=\"user-mention\">@" + entity.screen_name + "</a>";
    else if (entity.url) // url
      return "<a href=\"" + entity.url + "\" class=\"url\">" + entity.display_url + "</a>";
    else // hashtag
      return "<a href=\"http://twitter.com/search/%23" + entity.text + "\" class=\"hashtag\">#" + entity.text + "</a>";
  }

  var linkify = function (post) {
    var text = post.text,
      offset = 0;
    var entities = mergeByIndices(mergeByIndices(post.entities.hashtags, post.entities.urls), post.entities.user_mentions);
    entities.forEach(function (entity) {
      var new_substr = linkEntity(entity);
      text = replaceSubstr(text, entity.indices[0] + offset, entity.indices[1] + offset, new_substr);
      offset += new_substr.length - (entity.indices[1] - entity.indices[0]);
    });
    return text;
  }
  return linkify;
})();


function updateWeather() {
  $.getJSON('/api/weather', function(data){
    //Current conditions
    var temp = Math.round(data[0].current_observation.temp_f);
    $('#weather .temp')
      .css('color', colorTemp(temp))
      .html(temp + '&deg;');

    //Forecast
    var forecast = data[1].forecast.simpleforecast.forecastday[0];
    $('#weather .forecast1').html(
      '<img src="http://icons-ak.wxug.com/i/c/a/' + forecast.icon + '.gif" class="weathericon">' +
      forecast.conditions +
      '<br>Precip: ' + forecast.pop + '%'
    );

    $('#weather .forecast2').html(
      'High: <span style="color:' + colorTemp(forecast.high.fahrenheit) + ';">' + forecast.high.fahrenheit + '&deg;F</span>' +
      '<br>Low: <span style="color:' + colorTemp(forecast.low.fahrenheit) + ';">' + forecast.low.fahrenheit + '&deg;F' + '</span>'
    );
  });

  function colorTemp(temp) {
    var color = Math.min(Math.round( 255 - Math.abs(temp - 65) * (255 / 30) ), 255);
    if(temp > 65) {
      //its hot
      return 'rgb(255,' + color + ',' + color + ')';
    } else {
      //its cold
      return 'rgb(' + color + ',' + color + ',255)';
    }
  }
}

function updateBART(){
  updateBARTDepartures();
  updateBARTAdvisories();
}

function updateBARTDepartures(){
  var bart = [];

  $.ajax({
    url: 'http://api.bart.gov/api/etd.aspx',
    data: {
      cmd: 'etd',
      orig: '16TH',
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      $('#bart-north, #bart-south').empty();

      $(result).find('etd').each(function(i, data){
        //Process directions
        departure = addDirection(data);
        if(departure){
          bart.push(departure);
        }
      });

      //Sort departures
      bart.sort(bartSortHandler);

      bart.forEach(function(departure){
        $(departure.div).appendTo( (departure.direction == 'North') ? $('#bart-north') : $('#bart-south'));
      });
    }
  });

  function addDirection(data){
    var departure = {
      destination: $(data).find('destination').text(),
      times: []
    };

    if(departure.destination == 'Dublin/Pleasanton') {
      departure.destination = 'Dublin/ Pleasanton';
    }

    if(departure.destination == 'SFO/Millbrae') {
      departure.destination = 'SFO/ Millbrae';
    }

    $(data).find('estimate').each(function(j, data){
      //Only add times where minutes are less than 100
      if($(data).find('minutes').text() < 100){
        //Convert "Arrived" to "Arr"
        var minutes = ($(data).find('minutes').text() == 'Arrived') ? 0 : $(data).find('minutes').text();
        departure.hexcolor = $(data).find('hexcolor').text();
        departure.color = $(data).find('color').text();
        departure.times.push(minutes);
        departure.direction = $(data).find('direction').text();

        if (departure.hexcolor === '#ffffff') {
          departure.hexcolor = '#bbbbbb';
        }
      }
    });

    departure.div = $('<div>')
      .addClass('bart')
      .append($('<div>')
        .addClass('destination')
        .css('background', departure.hexcolor)
        .css('color', (departure.color == 'YELLOW') ? '#333' : '#FFF')
        .html(departure.destination))
      .append($('<div>')
        .addClass('nextbus'))
      .append($('<div>')
        .addClass('laterbuses')
        .append($('<div>')
          .addClass('time'))
        .append($('<div>')
          .addClass('time')));

    departure.times.forEach(function(time, idx){
      if(idx == 0) {
        $('.nextbus', departure.div).html(time);
        $('.laterbuses .time', departure.div).empty();
      } else {
        $($('.laterbuses .time', departure.div).get((idx - 1))).html(time);
      }
    })

    //Check if first time is less than 40 minutes away. If not, discard entire destination
    return (departure.times[0] < 40) ? departure : false;
  }

  function bartSortHandler(a, b){
    return (a.times[0] - b.times[0]);
  }
}

function updateBARTAdvisories(){
  $.ajax({
    url: 'http://api.bart.gov/api/bsa.aspx',
    data: {
      cmd: 'bsa',
      orig: '16TH',
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      $('.bart-advisories').empty();
      $(result).find('bsa').each(function(i, data){
        //Process advisories
        var description = $(data).find('description').text();
        if(description != 'No delays reported.') {
          $('<div>')
            .addClass('advisory')
            .text(description)
            .appendTo('.bart-advisories');
        }
      });
    }
  });
};


function updateMUNI(){
  //Define Muni Roures
 var MUNIroutes = [
    {
      route: 12,
      stop:4668,
      direction: 'north',
      destination: 'Folsom to Downtown and North Beach'
    },
    {
      route: 12,
      stop:4669,
      direction: 'south',
      destination: 'Folsom to 24th St'
    },
    {
      route: 49,
      stop:5551,
      direction: 'north',
      destination: 'Van Ness to Ft Mason'

    },
    {
      route: 49,
      stop:5552,
      direction: 'south',
      destination: 'Mission to Excelsior'
    },
    {
      route: 14,
      stop:5551,
      direction: 'north',
      destination: 'Mission to Ferry Building'
    },
    {
      route: 14,
      stop:5552,
      direction: 'south',
      destination: 'Mission to Excelsior'
    },
    {
      route: '14L',
      stop:5551,
      direction: 'north',
      destination: 'Mission to Transbay Terminal'
    },
    {
      route: '14L',
      stop:5552,
      direction: 'south',
      destination: 'Mission to Excelsior'
    },
    {
      route: 22,
      stop:7289,
      direction: 'north',
      destination: 'Fillmore to Marina'
    },
    {
      route: 22,
      stop:3299,
      direction: 'east',
      destination: '16th St to Dogpatch'
    },
    {
      route: 33,
      stop:7289,
      direction: 'west',
      destination: '18th to the Haight & the Richmond'
    },
    {
      route: 33,
      stop:3299,
      direction: 'south',
      destination: 'Potrero to 25th St'
    }
  ];

  var url = 'http://webservices.nextbus.com/service/publicXMLFeed',
      callbackCount = 0;

  //Loop through all routes
  MUNIroutes.forEach(function(route) {
    $.ajax({
      url: url,
      data: {
        command: 'predictions',
        a: 'sf-muni',
        r: route.route,
        s: route.stop
      },
      dataType: 'xml',
      success:function(result){
        var divName = 'muni' + route.route.toString().replace(/\s/g, '') + '_' + route.stop,
            div = $('#'+ divName),
            routeName = route.route.toString().replace(/\s\D+/g, "<span>$&</span>").replace(/(\d)(L)/g, "$1<span>$2</span>"),
            predictions = $(result).find('prediction');

        callbackCount++;

        if(!div.length) {
          div = $('<div>')
            .addClass('muni')
            .attr('id', divName)
            .appendTo('#muni-' + route.direction);
        }
        div
          .empty()
          .append($('<div>')
            .addClass('busnumber')
            .html(routeName))
          .append($('<div>').addClass('destinationContainer')
            .append($('<div>')
              .addClass('rotate')
              .html(route.destination)))
          .append($('<div>')
            .addClass('nextbus time'))
          .append($('<div>')
            .addClass('laterbuses')
            .append($('<div>')
              .addClass('time'))
            .append($('<div>')
              .addClass('time')));

        var idx = 0;
        predictions.each(function(i, data){
          //Limit to 3 results, only show times less than 100, don't show results that are 0
          if(idx < 3 && $(data).attr('minutes') < 100 && $(data).attr('minutes') > 0){
            $('.time', div).eq(idx).html($(data).attr('minutes'));
            idx++;
          }
        });

        //hide if no predictions
        div.toggle((predictions.length > 0));

        if(callbackCount == MUNIroutes.length) {
          // $('.muniContainer').each(function(idx, muniContainer){
          //   $('.muni', muniContainer).orderBy(function() {
          //     return +$('.nextbus', this).text();
          //   }).appendTo(muniContainer);
          // });
        }
      }
    });
  });
}

function updateUber() {
  $.getJSON('/api/uber', function(data) {
    $('.uberContainer .col1, .uberContainer .col2').empty();

    if(data && data[0] && data[0].times) {
      data[0].times.forEach(function(service, idx) {
        var div = $('<div>')
          .addClass('uber')
          .attr('id', service.product_id)
          .append($('<div>')
            .addClass('serviceName')
            .text(service.display_name))
          .append($('<div>')
            .addClass('time')
            .text(Math.round(service.estimate / 60)));
        if(idx < Math.ceil(data[0].times.length / 2)) {
          div.appendTo('.uberContainer .col1');
        } else {
          div.appendTo('.uberContainer .col2');
        }
      });
    }
    if(data && data[1] && data[1].prices) {
      data[1].prices.forEach(function(price, idx) {
        if(price.surge_multiplier > 1) {
          var html = price.display_name + ' <span>(' + price.surge_multiplier + 'x)</span>';
          $('#' + price.product_id)
            .addClass('surge')
            .find('.serviceName')
              .html(html);
        }
      });
    }
  });
}

function updateClock() {
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  var now = new Date();

  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();
  var day = days[ now.getDay() ];
  var date = now.getDate();
  var month = months[ now.getMonth() ];

  // Pad the minutes and seconds with leading zeros, if required
  minutes = ( minutes < 10 ? '0' : '' ) + minutes;
  seconds = ( seconds < 10 ? '0' : '' ) + seconds;

  // Choose either 'AM' or 'PM' as appropriate
  var timeOfDay = ( hours < 12 ) ? 'AM' : 'PM';

  // Convert the hours component to 12-hour format if needed
  hours = ( hours > 12 ) ? hours - 12 : hours;

  // Convert an hours component of '0' to '12'
  hours = ( hours == 0 ) ? 12 : hours;

  // Compose the string for display
  var timeString = hours + ':' + minutes + ':' + seconds + ' ' + timeOfDay;
  var dateString = day + ', ' + month + ' ' + date;

  // Update the time display
  $('#clock').html(timeString);
  $('#date').html(dateString);
}


function updateTwitter() {
  try {
    $.getJSON('/api/twitter', {
      since_id: since_id
    }, function (data) {
      data.forEach(function (tweet) {
        //Update 'since_id' if larger
        since_id = (tweet.id > since_id) ? tweet.id : since_id;

        //ignore @replies and blank tweets
        if (tweet.text == undefined || (tweet.in_reply_to_user_id && tweet.in_reply_to_screen_name != 'pwndepot') || (tweet.text[0] == '@' && tweet.text.substring(0, 9) != '@pwndepot')) {
          return;
        }
        // Build the html string for the current tweet
        var statusUrl = 'http://www.twitter.com/' + tweet.from_user + '/status/' + tweet.id;
        $('<div>')
          .addClass('tweet')
          .attr('id', tweet.id)
          .append($('<div>')
            .addClass('userInfo')
            .append($('<img>')
              .attr('src', tweet.user.profile_image_url.replace('_normal', '_bigger'))
              .addClass('userImage'))
            .append($('<div>')
              .addClass('userName')
              .text(tweet.user.name))
            .append($('<div>')
              .addClass('caption')
              .html(linkify(tweet)))
            .append($('<cite>')
              .addClass('timeago')
              .attr('title', tweet.created_at)))
          .appendTo('#twitter .scroll-wrap')

        if (tweet.entities.media) {
          //grab first image
          var height = $('#twitter').width() / tweet.entities.media[0].sizes.medium.w * tweet.entities.media[0].sizes.medium.h;
          $('#' + tweet.id)
            .css('background-image', 'url(' + tweet.entities.media[0].media_url + ')')
            .height(height)
            .addClass('background');
        } else if (tweet.entities.urls && tweet.entities.urls.length) {
          //use embed.ly to get image from first URL
          var embedlyOptions = {
            key: '991322aef9ba4e68b66546387e0b216d',
            url: tweet.entities.urls[0].expanded_url,
            maxwidth: 600
          }
          $.getJSON('http://api.embed.ly/1/oembed?callback=?', embedlyOptions, function (data) {
            if (data.thumbnail_url) {
              var height = $('#twitter').width() / data.thumbnail_width * data.thumbnail_height;
              $('#' + tweet.id)
                .css('background-image', 'url(' + data.thumbnail_url + ')')
                .height(height)
                .addClass('background');
            }
          });
        }
      });
      $('#twitter .timeago').timeago();
    });
  } catch (e) {
    console.log(e);
  }
}


function scrollTwitter() {
  var first = $('#twitter .tweet:first-child');
  if (isPi) {
    $('#twitter .scroll-wrap').append(first);
  } else {
    $('#twitter .scroll-wrap').animate({
      top: -$(first).height()
    }, 800, function () {
      $('#twitter .scroll-wrap')
        .append(first)
        .css('top', 0);
    });
  }
}



function resizeWindow() {
  var newWindowHeight = $(window).height() - $('#tweetContainer').outerHeight() - $('#pageTitle').outerHeight();
  $("#transitContainer").height(newWindowHeight);
  //Scale departures
  resizeDepartures();
}

function resizeDepartures(){
  var visibleHeight = $(window).height() - $('#pageTitle').height() - $('#tweetContainer').height() - 50;
  //Set #transitBox font-size to 100%;
  $('#transitBoxContainer').css('font-size','100%');
  var currentHeight = $('#transitBoxContainer').height();

  if(currentHeight > visibleHeight){
    //Calculate percent to scale
    var percent = Math.ceil((1 - ((currentHeight - visibleHeight) / currentHeight)) * 100);
    $('#transitBoxContainer').css('font-size', percent + '%');
  }
}

function reloadPage(){
  window.location.reload(true);
}

$(document).ready(function(){

  //detect color depth
  if(screen.colorDepth < 24) {
    $('body').addClass('noGradients');
  }

  //Resize Window
  resizeWindow();
  $(window).bind("resize", resizeWindow);

  //Update Clock
  setInterval(updateClock, 1000);

  //Get BART
  updateBART();
  setInterval(updateBART, 15000);

  //Get MUNI
  updateMUNI()
  setInterval(updateMUNI, 15000);

  //Get Uber
  updateUber();
  setInterval(updateUber, 60000);

  //Get weather every hour
  updateWeather();
  setInterval(updateWeather, 3600000);

  //update Twitter every 5 minutes
  updateTwitter();
  setInterval(updateTwitter, 300000);

  //scroll every 5 seconds
  setInterval(function () {
    scrollTwitter()
  }, 5000);


  //Resize transit if needed
  resizeDepartures();
  setInterval(resizeDepartures, 1000);

  //reload browser every 6 hours
  setInterval(reloadPage, 21600000);

});
