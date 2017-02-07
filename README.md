# Realtime-Transit-Display

## Description

A realtime transit display meant for a kiosk with no user interaction.  It shows realtime arrivals of MUNI and BART transit vehicles for nearby stations, Uber wait times and weather.

## Screenshots

![realtime-transit-screenshot](https://cloud.githubusercontent.com/assets/96217/4850393/82544c50-6069-11e4-8a2b-a818d29e009b.png)

## Current Deployment
You can see the Realtime Transit Display in use at [transit.bn.ee](http://transit.bn.ee).  Optionally, a raspberry pi can be used to power the display.

## Installation
### Running Locally

#### Get node.js and npm.

On OS X you can use brew:

    brew install node

#### Install required modules

    npm install

#### Add your configuration

Copy config-sample.json to config.json

    cp config-sample.json config.json

Add your [wunderground token](http://www.wunderground.com/weather/api/) and [Uber token](https://developer.uber.com) to config.js.


#### Run the app

    npm start
    
#### View the site locally

Visit `http://localhost:3000` in your browser.

### Raspberry Pi Setup
To setup a raspberry pi as a kiosk, [see this
post](http://blog.bn.ee/2013/01/11/building-a-real-time-transit-information-kiosk-with-raspberry-pi/).

### Editing the display layout

Selecting your local BART station and the local Muni routes are all detailed in `main.js` located inside `/public/javascripts/`

Four letter BART Station codes are available [here](http://api.bart.gov/docs/overview/abbrev.aspx).

## APIs
* [Weather Underground](http://www.wunderground.com/weather/api/d/docs)
* [BART API](http://api.bart.gov)
* [NextBus API](http://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf)
* [Uber API](https://developer.uber.com)

## License

This project is licensed under GNU General Public License v3.0.
