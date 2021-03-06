## Is It Overhead
An application for determining if there's any NEO (Near Earth Object) 'directly' overhead. It is a node app designed to return the name of any satellite that is presently overhead, based on user IP.

## Technical Details
This application is written in JS and run in Node, utilizing multiple APIs & libraries, including:

### Server-side APIs
  * [TLE/Two Line Element](https://tle.ivanstanojevic.me/#/)
  * [IP Info](http://ipinfo.io)
### JS Libraries
  * [axios](https://axios-http.com/docs/intro)
  * [tyepscript]()
  * [satellite.js](https://www.npmjs.com/package/satellite.js)
  * [geodesy](https://www.npmjs.com/package/geodesy)

## Project Details

## Installation & Getting Started Locally
  1. Clone from the [Repo](https://github.com/DGWIIImelt/neo.git):
    ```
    git clone TBD
    ```
  2. Install dependencies:
    ```
    npm install
    ```
  3. Setup ipinfo API:
     * Create API key @ https://ipinfo.io/
     * Create .env file to root
     * Add API key to .env file as follows:
        ```
        address_key=YOUR_KEY_GOES_HERE
        ```
  4. Run application: You'll need at least a search query or satellite ID (e.g. 'ISS', '25544U') to get started, or you'll receive a random 20 satellites.

     * Via CLI
        ```
        npm run build
        npm run start
        ```

## Team Members / Contributers
  * [Doug Wright](https://github.com/Spazcool)

## Outisde Sources
  * [TLE API](https://tle.ivanstanojevic.me/api/tle/{id}/propagate)
  * [Haversine Formula wiki](https://en.wikipedia.org/wiki/Haversine_formula)
  * [FreeMapTools](https://www.freemaptools.com/measure-distance.htm)
  * [GeoJSON](https://geojson.io/)
  * [N2YO Satellite Tracker](https://www.n2yo.com/satellite/?s=25544#results)
  * [MovableType Blog](https://www.movable-type.co.uk/scripts/latlong.html)
  * [GIS StackExchange](https://gis.stackexchange.com/questions/436868/calculate-nearest-point-in-a-orbital-path-to-user-gps)

## Future Plans
  * ~~calculate full orbital path of chosen satellite~~
  * check if chosen satellite is overhead now
  * check if gonna be overhead in 24 hrs
  * warning about what is overhead in the next 24 hours, (need to calculate all satellites trajectory or at least filter out the unlikelys)
  * visualize full orbital path of chosen satellite
  * pass in location as an argument in lieu/addition to IP location lookup (would save an api call)
  * ~~swap out propagate endpoint for library or hombebrew implementation of SGP4/SDP4 algorithm~~
  * warning text/tweet/email when a satellite is to be overhead
  * input/output validation for query/action
  * add testing
  * multiple users
  * running all the satellites data, storing it for 3 days to
  * satellite orbits that will pass 'overhead' in the next 24hrs || the next viewing time || the next 10
  * using mongo to query geospatial data to with in the users location
  * calculate horizon of user, and horizon of satellite, if they intersect then its a worthy candidate

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
