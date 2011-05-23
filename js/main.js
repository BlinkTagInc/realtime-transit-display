var map;

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
  //Get weather from SimpleGeo
  var client = new simplegeo.ContextClient('FCxs4Y5Au5YpndD2p5WFvtv5DvZhSv4G');
  
  client.getContext('37.778381','-122.389388', function(err, context) {
    if (err) {
      console.log(err);
    } else {
      $('#weather').html('');
      $('#weather').append(
        '<div class="temp">' + context.weather.temperature.replace("F", "&deg;") + '</div>' +
        '<strong>' + context.weather.conditions + '</strong>' +
        '<br>Precipitation: <strong>' + context.weather.forecast.today.precipitation + '</strong>' +
        '<br>Range: <strong>' + context.weather.forecast.today.temperature.min.replace("F", "&deg;F") + 
        ' - ' + context.weather.forecast.today.temperature.max.replace("F", "&deg;F") + '</strong>'
      );
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
      case 'SF Airport':
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

function getMUNI(routes){
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
        var div = $('#muni' + route + '_' + stop + ' .departure');
        
        //Remove old times
        $('#muni' + route + '_' + stop + ' .departure span').remove();
        
        //Check if route is still running
        if($(result).find('prediction').length > 0){
          div.show();
          
          $(result).find('prediction').each(function(i, data){
            //Limit to 3 results
            if(i<3){
              div.append('<span class="time">' + $(data).attr('minutes') + '</span>');
            }
          });
        } else {
          div.hide();
        }
      }
    });
  }

  //Loop through all routes
  for(var i in routes){
    getRoute(routes[i].route, routes[i].stop);
  }
}


function launchMap(){
  
  map = new google.maps.Map(document.getElementById("map_canvas"), {
    zoom: 16,
    center: new google.maps.LatLng(37.76720, -122.41768),
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
    {x:-122.41924,y:37.76720,labeltext:'14, 49'},
    {x:-122.42050,y:37.76620,labeltext:'14, 49'},
    {x:-122.41608,y:37.76827,labeltext:'12'},
    {x:-122.41490,y:37.76573,labeltext:'12'},
    {x:-122.41606,y:37.76495,labeltext:'22, 33'},
    {x:-122.41903,y:37.76540,labeltext:'22'},
    {x:-122.42009,y:37.76454,labeltext:'33'},
    
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


google.setOnLoadCallback(function(){
  
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
    stop:3291
  },
  {
    route: 22,
    stop:3293
  },
  {
    route: 33,
    stop:3292
  },
  {
    route: 33,
    stop:3299
  }
  ];

  //Do transit directions
  getBART();
  
  getMUNI(MUNIroutes);
  setInterval(getMUNI(MUNIroutes), 15000);
  
  getWeather();

  //Launch Google Maps
  launchMap();
});