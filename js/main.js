var map;

function getWeather(){
  //Get weather from SimpleGeo
  var client = new simplegeo.ContextClient('FCxs4Y5Au5YpndD2p5WFvtv5DvZhSv4G');
  
  client.getContext('37.778381','-122.389388', function(err, context) {
    if (err) {
      console.log(err);
    } else {
      $('#weather').html('');
      $('#weather').append('<div class="temp">' + context.weather.temperature.replace("F", "&deg;"));
      $('#weather').append('<strong>' + context.weather.conditions + '</strong>');
      $('#weather').append('<br>Precipitation: <strong>' + context.weather.forecast.today.precipitation + '</strong>');
      $('#weather').append('<br>Range: <strong>' + context.weather.forecast.today.temperature.max.replace("F", "&deg;F") + ' - ' + context.weather.forecast.today.temperature.min.replace("F", "&deg;F") + '</strong>');
    }
  });
  
  setInterval(getWeather,1200000);
}


function getBART(){
  var bartAPIKey = 'MW9S-E7SL-26DU-VV8V';
  var url = 'http://api.bart.gov/api/etd.aspx';

  //Request Northbound Departures
  $.ajax({
    url: url,
    data: {
      cmd: 'etd',
      orig: '16TH',
      key: bartAPIKey,
      dir: 'n'
    },
    dataType: 'xml',
    success:function(result){
      $('#bart_north .departures').html('');
      $(result).find('etd').each(function(i, data){
        $('#bart_north .departures').append(addDirection(data));
      });
    }
  });
  
  //Request Southbound Departures
  $.ajax({
    url: url,
    data: {
      cmd: 'etd',
      orig: '16TH',
      key: bartAPIKey,
      dir: 's'
    },
    dataType: 'xml',
    success:function(result){
      $('#bart_south .departures').html('');
      $(result).find('etd').each(function(i, data){
        $('#bart_south .departures').append(addDirection(data));
      });
    }
  });
  
  function addDirection(data){
    var destination = $(data).find('destination').text();
    switch(destination){
      case 'Dublin/Pleasanton':
        var color = '#00aeef';
        break;
      case 'Pittsburg/Bay Point':
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
      case 'Millbrae':
        var color = '#ed1c24';
        break;
      default:
        var color = '#a8a9a9';
    }
    
    var departure = '<div class="departure">';
    departure += '<div class="colorbox" style="background:' + color + '"></div>';
    departure += '<div class="destination">' + destination + '</div>';
    $(data).find('estimate').each(function(j, data){
      //Convert "Arrived" to "Arr"
      var minutes = ($(data).find('minutes').text() == 'Arrived') ? "0" : $(data).find('minutes').text();
      departure += '<span class="time">' + minutes + '</span>';
    });
    departure += '</div>';
    
    return departure
  }
  
  setInterval(getBART,15000);
}

function getMUNI(route, stop){
  var url = 'http://webservices.nextbus.com/service/publicXMLFeed';

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
      $('#muni' + route + '_' + stop + ' .departure span').remove();
      $(result).find('prediction').each(function(i, data){
        //Limit to 3 results
        if(i<3){
          $('#muni' + route + '_' + stop + ' .departure').append('<span class="time">' + $(data).attr('minutes') + '</span>');
        }
      });
    }
  });
}


function launchMap(){
  
  var styles = [
  {
      featureType: "road.arterial",
      elementType: "all",
      stylers: [
        { visibility: "simplified" }
      ]
    },{
      featureType: "road",
      elementType: "all",
      stylers: [
        { visibility: "on" },
        { lightness: 13 }
      ]
    },{
      featureType: "road",
      elementType: "all",
      stylers: [
        { visibility: "on" },
        { saturation: -14 },
        { gamma: 1.14 },
        { lightness: 29 },
        { hue: "#ddff00" }
      ]
    },{
      featureType: "administrative.country",
      elementType: "all",
      stylers: [
        { visibility: "off" }
      ]
    },{
      featureType: "administrative.locality",
      elementType: "all",
      stylers: [
        { visibility: "off" }
      ]
    },{
      featureType: "administrative.province",
      elementType: "all",
      stylers: [
        { visibility: "off" }
      ]
    },{
      featureType: "landscape",
      elementType: "all",
      stylers: [
        { hue: "#ffc300" },
        { lightness: -24 },
        { saturation: 2 }
      ]
    },{
      featureType: "poi",
      elementType: "geometry",
      stylers: [
        { visibility: "on" },
        { lightness: -11 },
        { saturation: 20 },
        { hue: "#a1ff00" }
      ]
    },{
      featureType: "poi.medical",
      elementType: "all",
      stylers: [
        { visibility: "off" }
      ]
    },{
      featureType: "poi.school",
      elementType: "all",
      stylers: [
        { visibility: "off" }
      ]
    },{
      featureType: "road.highway",
      elementType: "labels",
      stylers: [
        { visibility: "off" }
      ]
    },{
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [
        { saturation: -1 },
        { lightness: 64 },
        { gamma: 0.74 }
      ]
    },{
      featureType: "landscape.man_made",
      elementType: "all",
      stylers: [
        { hue: "#ffc300" },
        { lightness: 26 },
        { gamma: 1.29 }
      ]
    },{
      featureType: "road.highway",
      elementType: "all",
      stylers: [
        { saturation: 36 },
        { lightness: -8 },
        { gamma: 0.96 },
        { visibility: "off" }
      ]
    },{
      featureType: "road.highway",
      elementType: "all",
      stylers: [
        { lightness: 88 },
        { gamma: 3.78 },
        { saturation: 1 },
        { visibility: "off" }
      ]
    },{
      featureType: "road.local",
      elementType: "labels",
      stylers: [
        { visibility: "on" },
        { lightness: 27 },
        { saturation: -3 }
      ]
    },{
      featureType: "poi.business",
      elementType: "all",
      stylers: [
        { hue: "#ff0900" }
      ]
    },{
      featureType: "poi.government",
      elementType: "all",
      stylers: [
        { hue: "#ff1a00" }
      ]
    },{
      featureType: "poi.sports_complex",
      elementType: "all",
      stylers: [
        { hue: "#ff1a00" }
      ]
    },{
      featureType: "poi.place_of_worship",
      elementType: "all",
      stylers: [
        { hue: "#ff3300" }
      ]
    },{
      featureType: "all",
      elementType: "all",
      stylers: [

      ]
    }
  ];
  
  map = new google.maps.Map(document.getElementById("map_canvas"), {
    zoom: 17,
    center: new google.maps.LatLng(37.76590, -122.41768),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    panControl: false,
    zoomControl: false,
    streetViewControl: false
  });
  
  /*var styledMapOptions = {
     name: "walking"
   }
   var walkingMapType = new google.maps.StyledMapType(styles, styledMapOptions);
   map.mapTypes.set('walking', walkingMapType);
   map.setMapTypeId('walking');*/
   
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
   
   var marker = new google.maps.Marker({
     position: new google.maps.LatLng(37.76640, -122.41688),
     map: map,
     icon: 'http://pwn.blinktag.com/images/thepwndepot.png',
     shadow: 'http://pwn.blinktag.com/images/thepwndepot_shadow.png',
     clickable: false
   });
}


google.setOnLoadCallback(function(){
  
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
    stop:3291
  },
  {
    route: 22,
    stop:3293
  },
  ];

  getBART();
  
  for(var i in MUNIroutes){
    
    getMUNI(MUNIroutes[i].route, MUNIroutes[i].stop);
    setInterval(getMUNI(MUNIroutes[i].route, MUNIroutes[i].stop), 15000);
  }
  
  getWeather();

  //Launch Google Maps
  launchMap();
});