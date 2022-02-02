## Is It Overhead
An application for determining if there's any NEO (Near Earth Object) 'directly' overhead. It is a simple web app designed to return the name of any satellite that is presently overhead, based on user IP.

## Technical Details
This application is written in JS and run in Node, utilizing multiple APIs & libraries, including:

### Server-side APIs
  * [TLE/Two Line Element](https://tle.ivanstanojevic.me/#/)
  * [IP Info](http://ip-info.io)
### JS Libraries
  * [axios](https://axios-http.com/docs/intro)
  * [tyepscript]()

## Project Details

## Installation & Getting Started Locally
  1. Clone from the [Repo](TBD): 
    ```
    git clone TBD
    ```
  2. Install dependencies:
    ```
    npm install
    ```

  3. Run application: You'll need at least a search query or satellite ID (e.g. 'ISS', '25544U') to get started.

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
   * [N2YO Satellite Tracker](https://www.n2yo.com/satellite/?s=25544#results)
   * [MovableType Blog](https://www.movable-type.co.uk/scripts/latlong.html)

## Future Plans
  * calculate full orbital path of chosen satellite
  * check if chosen satellite is overhead now
  * check if gonna be overhead in 24 hrs
  * warning about what is overhead in the next 24 hours, (need to calculate all satellites trajectory or at least filter out the unlikelys)
  * visualize full orbital path of chosen satellite
  * pass in location as an argument in lieu/addition to IP location lookup
  * swap out propagate endpoint for library or hombebrew implementation of SGP4/SDP4 algorithm

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
