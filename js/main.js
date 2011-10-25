var map;
var bartAPIKey = 'MW9S-E7SL-26DU-VV8V';

function Label(opt_options) {
  // Initialization
  this.setValues(opt_options);

  // Label specific
  var span = this.span_ = document.createElement('span');
  span.className += 'map_label';

  var div = this.div_ = document.createElement('div');
  div.appendChild(span);
  div.style.cssText = 'position: absolute; display: none';
  };
  Label.prototype = new google.maps.OverlayView;

  // Implement onAdd
  Label.prototype.onAdd = function() {
  var pane = this.getPanes().overlayLayer;
  pane.appendChild(this.div_);

  // Ensures the label is redrawn if the text or position is changed.
  var me = this;
  this.listeners_ = [
  google.maps.event.addListener(this, 'position_changed',
     function() { me.draw(); }),
  google.maps.event.addListener(this, 'text_changed',
     function() { me.draw(); })
  ];
  };

  // Implement onRemove
  Label.prototype.onRemove = function() {
  this.div_.parentNode.removeChild(this.div_);

  // Label is removed from the map, stop updating its position/text.
  for (var i = 0, I = this.listeners_.length; i < I; ++i) {
  google.maps.event.removeListener(this.listeners_[i]);
  }
  };

  // Implement draw
  Label.prototype.draw = function() {
  var projection = this.getProjection();
  var position = projection.fromLatLngToDivPixel(this.get('position'));

  var div = this.div_;
  div.style.left = position.x + 'px';
  div.style.top = position.y + 'px';
  div.style.display = 'block';

  this.span_.innerHTML = this.get('text').toString();
};

function getWeather(){
  
  //Get weather from Wunderground via YQL
  $.getJSON('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D%22http%3A%2F%2Fapi.wunderground.com%2Fweatherstation%2FWXCurrentObXML.asp%3FID%3DKCASANFR58%22&format=json&callback=?',function(data){
    //Current conditions
    $('#weather .temp').html(Math.round(data.query.results.current_observation.temp_f) + '&deg;');
  });
  $.getJSON('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%3D%22http%3A%2F%2Fapi.wunderground.com%2Fauto%2Fwui%2Fgeo%2FForecastXML%2Findex.xml%3Fquery%3D94103%22&format=json&callback=?',function(data){
    //Forecast
    var forecast = data.query.results.forecast.simpleforecast.forecastday[0];
    $('#weather .forecast').html(
      '<img src="http://icons-ak.wxug.com/i/c/a/' + forecast.icon + '.gif" class="weathericon">' +
      '<strong>' + forecast.conditions + '</strong>' +
      '<br>Range: <strong>' + forecast.low.fahrenheit + '&deg;F' + 
      ' - ' + forecast.high.fahrenheit + '&deg;F' + '</strong>' +
      '<br>Precip: <strong>' + forecast.pop + '%</strong>'
    );
  });
}


function getBART(){
  var url = 'http://api.bart.gov/api/etd.aspx';
  
  var bart = [];

  //Request Northbound Departures
  $.ajax({
    url: url,
    data: {
      cmd: 'etd',
      orig: '16TH',
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      $('#bartNorth .departures').html('');
      $('#bartSouth .departures').html('');
      
      $(result).find('etd').each(function(i, data){
        //Process directions
        departure = addDirection(data);
        if(departure){
          bart.push(departure);
        }
      });
      
      //Sort departures
      bart.sort(bartSortHandler);
      
      $.each(bart, function(i, departure){
        if(departure.direction == 'North'){
          $('#bartNorth .departures').append(departure.div);
        } else {
          $('#bartSouth .departures').append(departure.div);
        }
      });
    }
  });
  
  function addDirection(data){
    var departure = {};
    
    departure.destination = $(data).find('destination').text();
    
    switch(departure.destination){
      case 'Dublin/Pleasanton':
        var color = '#00aeef';
        break;
      case 'Pittsburg/Bay Point':
        var color = '#ffe800';
        break;
      case 'Concord':
        var color = '#ffe800';
        break;
      case 'North Concord':
        var color = '#ffe800';
        break;
      case 'Richmond':
        var color = '#ed1c24';
        break;
      case 'Fremont':
        var color = '#4db848';
        break;
      case 'Daly City':
        var color = '#00aeef';
        break;
      case 'SFO/Millbrae':
        var color = '#ffe800';
        break;
      case 'SF Airport':
        var color = '#ffe800';
        break;
      case 'Millbrae':
        var color = '#ed1c24';
        break;
      default:
        var color = '#a8a9a9';
    }
    
    departure.div = '<div class="departure">';
    departure.div += '<div class="colorbox" style="background:' + color + '"></div>';
    departure.div += '<div class="destination">' + departure.destination + '</div>';
    departure.div += '<div class="times">';
    
    departure.times = [];
    
    $(data).find('estimate').each(function(j, data){
      //Only add times where minutes are less than 100
      if($(data).find('minutes').text() < 100){
        //Convert "Arrived" to "Arr"
        var minutes = ($(data).find('minutes').text() == 'Arrived') ? 0 : $(data).find('minutes').text();
        
        departure.times.push(minutes);
        
        departure.direction = $(data).find('direction').text();

        departure.div += '<span>' + minutes + ' min</span>';
      }
    });
    departure.div += '</div>';
    departure.div += '</div>';
    
    //Check if first time is less than 40 minutes away. If not, discard entire destination
    if(departure.times[0] < 40){
      return departure;
    } else {
      return false;
    }
  }
    
  function bartSortHandler(a, b){
    return (a.times[0] - b.times[0]);
  }
}

function getAdvisories(){
  var url = 'http://api.bart.gov/api/etd.aspx';

  var bart = [];

  //Request Northbound Departures
  $.ajax({
    url: url,
    data: {
      cmd: 'bsa',
      orig: '16TH',
      key: bartAPIKey
    },
    dataType: 'xml',
    success:function(result){
      $('#advisories').html('');
      $(result).find('bsa').each(function(i, data){
        //Process alert
        $('#advisories').append('<div>Alert: ' + data.description + '<br>' + data.posted + '</div>');
      });
    }
  });
}

function getMUNI(){
  //Define Muni Roures
  var MUNIroutes = [
  {
    route: 12,
    stop:4668
  },
  {
    route: 12,
    stop:4669
  },
  {
    route: 49,
    stop:5551
  },
  {
    route: 49,
    stop:5552
  },
  {
    route: 14,
    stop:5551
  },
  {
    route: 14,
    stop:5552
  },
  {
    route: '14L',
    stop:5551
  },
  {
    route: '14L',
    stop:5552
  },
  {
    route: 22,
    stop:7289
  },
  {
    route: 22,
    stop:3293
  },
  {
    route: 33,
    stop:7289
  },
  {
    route: 33,
    stop:3299
  },
  {
    route: 'N',
    stop:6996
  },
  {
    route: 'N OWL',
    stop:5696
  }
  ];
  
  var url = 'http://webservices.nextbus.com/service/publicXMLFeed';
  
  function getRoute(route, stop){
    //Request Departures
    $.ajax({
      url: url,
      data: {
        command: 'predictions',
        a: 'sf-muni',
        r: route,
        s: stop
      },
      dataType: 'xml',
      success:function(result){
        var div = $('#muni' + route.toString().replace(/\s/g, '') + '_' + stop);
        
        //Clear old times
        $('.times', div).html('');
        
        //Check if route is still running
        if($(result).find('prediction').length > 0){
          div.show();
          
          var count = 0;
          
          $(result).find('prediction').each(function(i, data){
            //Limit to 3 results, only show times less than 100, don't show results that are 0
            if(count < 3 && $(data).attr('minutes') < 100 && $(data).attr('minutes') > 0){
              
              $('.times', div).append('<span>' + $(data).attr('minutes') + ' min</span>');
              
              count++;
            }
          });
        } else {
          div.hide();
        }
      }
    });
  }

  //Loop through all routes
  for(var i in MUNIroutes){
    getRoute(MUNIroutes[i].route, MUNIroutes[i].stop);
  }
}


function launchMap(){
  
  map = new google.maps.Map(document.getElementById("map_canvas"), {
    zoom: 16,
    center: new google.maps.LatLng(37.76670, -122.41768),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    panControl: false,
    zoomControl: false,
    streetViewControl: false
  });
  
  /*
  //Walking map styles -- needed if transit map stops working
  
  var styles=[{featureType:"road.arterial",elementType:"all",stylers:[{visibility:"simplified"}]},{featureType:"road",elementType:"all",stylers:[{visibility:"on"},{lightness:13}]},{featureType:"road",elementType:"all",stylers:[{visibility:"on"},{saturation:-14},{gamma:1.14},{lightness:29},{hue:"#ddff00"}]},{featureType:"administrative.country",elementType:"all",stylers:[{visibility:"off"}]},{featureType:"administrative.locality",elementType:"all",stylers:[{visibility:"off"}]},{featureType:"administrative.province",elementType:"all",stylers:[{visibility:"off"}]},{featureType:"landscape",elementType:"all",stylers:[{hue:"#ffc300"},{lightness:-24},{saturation:2}]},{featureType:"poi",elementType:"geometry",stylers:[{visibility:"on"},{lightness:-11},{saturation:20},{hue:"#a1ff00"}]},{featureType:"poi.medical",elementType:"all",stylers:[{visibility:"off"}]},{featureType:"poi.school",elementType:"all",stylers:[{visibility:"off"}]},{featureType:"road.highway",elementType:"labels",stylers:[{visibility:"off"}]},{featureType:"road.arterial",elementType:"geometry",stylers:[{saturation:-1},{lightness:64},{gamma:0.74}]},{featureType:"landscape.man_made",elementType:"all",stylers:[{hue:"#ffc300"},{lightness:26},{gamma:1.29}]},{featureType:"road.highway",elementType:"all",stylers:[{saturation:36},{lightness:-8},{gamma:0.96},{visibility:"off"}]},{featureType:"road.highway",elementType:"all",stylers:[{lightness:88},{gamma:3.78},{saturation:1},{visibility:"off"}]},
  
  var styledMapOptions = {
     name: "walking"
   }
   var walkingMapType = new google.maps.StyledMapType(styles, styledMapOptions);
   map.mapTypes.set('walking', walkingMapType);
   map.setMapTypeId('walking');
   
  */
   
  //Add transit layer
  var transitOptions = {
    getTileUrl: function(coord, zoom) {
      return "http://mt1.google.com/vt/lyrs=m@155076273,transit:comp|vm:&hl=en&opts=r&s=Galil&" +
      "z=" + zoom + "&x=" + coord.x + "&y=" + coord.y;
    },
    tileSize: new google.maps.Size(256, 256),
    isPng: true
  };
  
  var transitMapType = new google.maps.ImageMapType(transitOptions);
  map.overlayMapTypes.insertAt(0, transitMapType);
  
  //Pwn Depot Marker
  var marker = new google.maps.Marker({
    position: new google.maps.LatLng(37.76616, -122.41688),
    map: map,
    icon: 'http://pwn.blinktag.com/images/thepwndepot.png',
    shadow: 'http://pwn.blinktag.com/images/thepwndepot_shadow.png',
    clickable: false
  });
  
  // Add  Labels
  var labels = [
    {x:-122.41914,y:37.76720,labeltext:'14, 49'},
    {x:-122.42054,y:37.76620,labeltext:'14, 49'},
    {x:-122.41608,y:37.76827,labeltext:'12'},
    {x:-122.41485,y:37.76573,labeltext:'12'},
    {x:-122.41606,y:37.76495,labeltext:'22, 33'},
    {x:-122.41606,y:37.76565,labeltext:'22, 33'},
    
  ];
  
  function addLabel(labeloptions){
    LatLng = new google.maps.LatLng(labeloptions.y, labeloptions.x);
    
    var label = new Label({
      map: map,
      text: labeloptions.labeltext,
      position: LatLng
    });
  }
  
  
  for(var i in labels){
    addLabel(labels[i]);
  }
}

function getTweets(usernames){
  
  //Add parseURL to get links out of tweets
  String.prototype.parseURL = function() {
    return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {
      return url.link(url);
    });
  };
  
  // Declare variables to hold twitter API url and user name
  var twitter_api_url = 'http://search.twitter.com/search.json';
  
  var since_id = 0;
  
  function processTweet(tweet){
    // Calculate how many hours ago was the tweet posted
    var date_diff  = new Date() - new Date(tweet.created_at);
    if(date_diff/(1000*60*60) < 1){
      var time = Math.round(date_diff/(1000*60)) + " minutes";
    } else {
      var time = Math.round(date_diff/(1000*60*60)) + " hours";
    }
    
    // Build the html string for the current tweet
    var tweet_html = '<div class="tweet">';
    tweet_html    += '<img src="' + tweet.profile_image_url + '" class="tweetImage">';
    tweet_html    += '<div class="tweetInfo">';
    tweet_html    += '<a href="http://www.twitter.com/';
    tweet_html    += tweet.from_user + '/status/' + tweet.id + '" class="tweetUser"">';
    tweet_html    += tweet.from_user + '</a> ';
    tweet_html    += '<div class="tweetHours">' + time + ' ago</div>';
    tweet_html    += '</div>';
    tweet_html    += '<div class="tweetStatus">';
    tweet_html    += tweet.text.parseURL() + '</div>';
    
    //Update 'since_id' if larger
    since_id = (tweet.id > since_id) ? tweet.id : since_id;

    // Append html string to tweet_container div
    $('#tweetContainer').append(tweet_html);
  }
  
  
  function updateTweets(){
    //Build URL using 'since_id' to find only new tweets
    var query_url = twitter_api_url + '?callback=?&rpp=25&since_id=' + since_id + '&q=';
    for(var i in usernames){
      //Add each username to query
      query_url += 'from:' + usernames[i] + '+OR+';
    }
    //Add statement to find tweets referenceing @pwndepot
    query_url += '@pwndepot';

    $.getJSON( query_url,
      function(data) {
        $.each(data.results, function(i, tweet) {
          if(tweet.text !== undefined && tweet.id != since_id) {
            processTweet(tweet);
          }
        });
      }
    );
  }
  
  //Get updates every two minutes
  updateTweets();
  setInterval(updateTweets,12000);
}


function rotateTweets(){
  var visibleTweet = $('#tweetContainer .tweet:visible');
  var nextTweet = $('#tweetContainer .tweet:visible').next();
  visibleTweet.slideUp('fast',function(){
    if(nextTweet.length != 0){
      nextTweet.slideDown('fast');
    } else {
       $('#tweetContainer .tweet:first').slideDown('fast');
    }
  });
}

function updateClock()
{
  var currentTime = new Date();

  var currentHours = currentTime.getHours();
  var currentMinutes = currentTime.getMinutes();
  var currentSeconds = currentTime.getSeconds();

  // Pad the minutes and seconds with leading zeros, if required
  currentMinutes = ( currentMinutes < 10 ? "0" : "" ) + currentMinutes;
  currentSeconds = ( currentSeconds < 10 ? "0" : "" ) + currentSeconds;

  // Choose either "AM" or "PM" as appropriate
  var timeOfDay = ( currentHours < 12 ) ? "AM" : "PM";

  // Convert the hours component to 12-hour format if needed
  currentHours = ( currentHours > 12 ) ? currentHours - 12 : currentHours;

  // Convert an hours component of "0" to "12"
  currentHours = ( currentHours == 0 ) ? 12 : currentHours;

  // Compose the string for display
  var currentTimeString = currentHours + ":" + currentMinutes + ":" + currentSeconds + " " + timeOfDay;

  // Update the time display
  $('#clock').html(currentTimeString);
}


function resizeWindow() {
  var newWindowHeight = $(window).height();
  $(".container").css("height", newWindowHeight);
  //Scale departures
  resizeDepartures();
}

function resizeDepartures(){
  var visibleHeight = $(window).height() - $('#pageTitle').height() - $('#tweetContainer').height();
  //Set #transitBox font-size to 100%;
  $('#transitBoxContainer').css('font-size','100%');
  var currentHeight = $('#transitBoxContainer').height();
  
  if(currentHeight > visibleHeight){
    //Calculate percent to scale
    var percent = Math.ceil((1 - ((currentHeight - visibleHeight) / currentHeight)) * 100);
    $('#transitBoxContainer').css('font-size', percent + '%');
  }
}


google.setOnLoadCallback(function(){
  
  //Resize Window
  resizeWindow();
  $(window).bind("resize", resizeWindow);
  
  // Rotate Tweets
  setInterval(rotateTweets,10000);

  //Update Clock
  setInterval(updateClock, 1000);

  //Do transit directions
  //Get BART
  getBART();
  setInterval(getBART,15000);
  
  //Get MUNI
  getMUNI()
  setInterval(getMUNI, 15000);
  
  //Get weather from SimpleGeo
  getWeather();
  setInterval(getWeather,1200000);

  //Launch Google Maps
  launchMap();
  
  //Get Tweets
  var usernames = [
    'brendannee',
    'lstonehill',
    '_nw_',
    'lweite',
    'jedhorne',
    'woeismatt',
    'halfhenry',
    'stevebice',
    'w01fe',
    'qago',
    'blinktaginc',
    'pwndepot',
    'keussen',
    'dduugg',
    'juliebadoolie'
  ];
  getTweets(usernames);
  
  //Get BART service advisories
  getAdvisories();
  setInterval(getAdvisories,1200000);
  
  //Resize transit if needed
  resizeDepartures();
  setInterval(resizeDepartures,1000);
  
});