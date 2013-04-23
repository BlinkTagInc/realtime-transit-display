var bartAPIKey = 'MW9S-E7SL-26DU-VV8V';

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


function updateWeather() {
  $.getJSON('/api/weather.json', function(data){
    console.log(data)
    //Current conditions
    var temp = Math.round(data[0].current_observation.temp_f);
    $('#weather .temp')
      .css('color', colorTemp(temp))
      .html(temp + '&deg;');

    //Forecast
    var forecast = data[1].forecast.simpleforecast.forecastday[0];
    $('#weather .forecast').html(
      '<img src="http://icons-ak.wxug.com/i/c/a/' + forecast.icon + '.gif" class="weathericon">' +
      forecast.conditions + 
      '<br>High: <span style="color:' + colorTemp(forecast.high.fahrenheit) + ';">' + forecast.high.fahrenheit + '&deg;F</span>' + 
      '<br>Low: <span style="color:' + colorTemp(forecast.low.fahrenheit) + ';">' + forecast.low.fahrenheit + '&deg;F' + '</span>' +
      '<br>Precip: ' + forecast.pop + '%'
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
    
    $(data).find('estimate').each(function(j, data){
      //Only add times where minutes are less than 100
      if($(data).find('minutes').text() < 100){
        //Convert "Arrived" to "Arr"
        var minutes = ($(data).find('minutes').text() == 'Arrived') ? 0 : $(data).find('minutes').text();
        departure.hexcolor = $(data).find('hexcolor').text();
        departure.color = $(data).find('color').text();
        departure.times.push(minutes);
        departure.direction = $(data).find('direction').text();
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
      $('#advisories').empty();
      $(result).find('bsa').each(function(i, data){
        //Process alert
        $('#advisories').append('<div>Alert: ' + data.description + '<br>' + data.posted + '</div>');
      });
    }
  });
}


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
      destination: 'Mission to Transbay & Ferry Building'
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
      destination: '16th St to Potrero Hill & Dogpatch'
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
          $('.muniContainer').each(function(idx, muniContainer){
            $('.muni', muniContainer).orderBy(function() {return +$('.nextbus', this).text();}).appendTo(muniContainer);
          });
        }
      }
    });
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
  
  //Get weather every 20 minutes
  updateWeather();
  setInterval(updateWeather, 1200000);
  
  //Get BART service advisories
  getAdvisories();
  setInterval(getAdvisories, 60000);
  
  //Resize transit if needed
  resizeDepartures();
  setInterval(resizeDepartures, 1000);

  //reload browser every 6 hours
  setInterval(reloadPage, 21600000);
  
});
