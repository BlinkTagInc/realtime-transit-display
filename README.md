# Realtime-Transit-Display

A realtime transit display meant for a kiosk with no user interaction.  It shows realtime arrivals of MUNI and BART transit vehicles for nearby stations, Uber wait times and weather.

![realtime-transit-screenshot](https://cloud.githubusercontent.com/assets/96217/4850393/82544c50-6069-11e4-8a2b-a818d29e009b.png)
## Example
You can see the Realtime Transit Display in use at
[transit.bn.ee](http://transit.bn.ee).  Optionally, a raspberry pi can be used to
power the display.

## Running Locally

### Get node.js and npm.

On OS X you can use brew:

    brew install node

### Install required modules

    npm install

### Add your configuration

Copy config-sample.json to config.json

    cp config-sample.json config.json

Add your wunderground token and Uber Token to config.js.

### Run the app

    npm start

## Raspberry Pi Setup
To setup a raspberry pi as a kiosk, [see this
post](http://blog.bn.ee/2013/01/11/building-a-real-time-transit-information-kiosk-with-raspberry-pi/).

Follow all the regular Pi setup instructions for the basic kiosk as listed above.  After testing and getting the BART arrival display to work correctly, comment out the `@chromium --kiosk --incognito
bart.blinktag.com/?station=16ST` with the `#` to prevent the autostart.

> ### Notes:
> Some things require `sudo`, some do not. If anything fails, just retry it with `sudo` (SuperUser do) in front of it.

>Overscan not working correctly?
>
>    sudo nano /boot/config.txt
>
> scroll to the bottom for the config inserted by the NOOBS config utility and adjust per the instructions in the config.txt file.

## Running the Display on Raspberry Pi
We need to install an older version 0.10.xx of node.js in our user directory These are the [Original Instruction](https://ariejan.net/2011/10/24/installing-node-js-and-npm-on-ubuntu-debian/) I used as a reference.

Modified node.js instructions for the Realtime Transit Display

    sudo apt-get update
    sudo apt-get install git-core curl build-essential openssl libssl-dev
    git clone https://github.com/joyent/node.git
    cd node
    git tag
`git tag` will give you a list of all the versions

    git checkout v0.10.9 [this is the last stable version of 0.10]
    ./configure
    make
This will take a while . . . like 2+ hours

    sudo make install

Then, check if node was installed correctly:

    node -v

It will return your version if all went well. `v0.10.9`

Install npm.

    sudo apt-get install npm

Then, check if node was installed correctly:

    npm -v

It will return your version if all went well. `1.2.24` (1.2.24 as of 11/13/2014)

Go up one directory, back to your home directory, as you are still in `/home/pi/node`

    cd ..

Copy the Realtime Transit Display code to your pi directory

    git clone https://github.com/brendannee/Realtime-Transit-Display.git

Change directories in to the Realtime-Transit-Display directory

    cd Realtime-Transit-Display

 Or use a short cut!

    cd Re*

Copy `config-sample.json` to `config.json`

    cp config-sample.json config.json

Set up your own [wunderground token](http://www.wunderground.com/weather/api/) and [Uber Token](https://developer.uber.com) and then add them to `config.json` with nano.

    nano config.json

npm installation of required modules, (may have an occasional warning for empty repository fields)

    npm install

Run the actual background application

    npm start

View the site locally Visit `http://localhost:3000` in your browser.
You can start Chromium in kiosk mode with the following command from the terminal

    chromium --kiosk --incognito localhost:3000

## Post Install
After any reboots you will need to restart the application and Chromium.  The easiest way to do this is via command line with two windows, one for the background applications

    cd Realtime-Transit-Display
    npm start

 and one for

     chromium --kiosk --incognito localhost:3000

## Editing the display layout

Selecting your local BART station and the local Muni routes are all detailed in `main.js` located inside `/public/javascripts/`

Four letter BART Station codes are available [here](http://api.bart.gov/docs/overview/abbrev.aspx).

## APIs
* [Weather Underground](http://www.wunderground.com/weather/api/d/docs)
* [BART API](http://api.bart.gov)
* [NextMUNI API](http://api-portal.anypoint.mulesoft.com/nextbus/api/nextbus-api/docs/reference)
* [Uber API](https://developer.uber.com)

## Credits
Brendan Nee me@bn.ee -- Code and initial README

Andy @zebadoba -- Detailed Raspberry Pi README

## License

(The MIT License)

Copyright (c) 2014 Brendan Nee &lt;me@bn.ee&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
