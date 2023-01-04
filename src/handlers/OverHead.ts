import { TLEapi } from '../api/tle';
import { UserAddressApi } from '../api/userAdress';
import { triangle } from '../interfaces/index';
const satellite = require('satellite.js');

export class OverHead {
  action: string = '';
  distanceAtoB: number = undefined; //used both for distance between user and sat as well as distnace between the same sat over a period of time
  query: string = '';
  userCoord: number[] = [null, null];
  satCoord: number[] = [null, null]; // "current" location of satellite
  coordTriangle: triangle; // 3 coords, user and 2 "close" coords on the orbital path TODO: might be able to do away with it
  satData; //TLE data from which all the maths are possible
  orbitCoords: {periodHours: number, coords: object[]}; // array of coordinates along the orbital path
  distanceUserToHorizon: number = undefined;
  
  constructor (action: string, query: string) {
    this.action = action;
    if(query){
      this.query = query;
    }
  }

  setDistanceToHorizon (location?) : void {
   //TODO: horizon is based on sealevel, how to check that? 
   if(location) console.log('there a location')
  }

  setDistance (A? : [], B? : []) : void { // finds distance between two coordinates on a sphere
    if(this.userCoord === undefined || this.satCoord === undefined){
      return;
    }

    let outsideVars: boolean = (A !== undefined && B !== undefined);
    let lat1: number = (outsideVars ? A : this.userCoord)[0];
    let lat2: number = (outsideVars ? B : this.satCoord)[0];
    let lon1: number = (outsideVars ? A : this.userCoord)[1];
    let lon2: number = (outsideVars ? B : this.satCoord)[1];

    if(lat1 === null || lat2 === null || lon1 === null || lon2 === null){
      return;
    }
    // haversine formula
    // a = sin²(Δφ/2) + 
    //     cos φ1 ⋅ cos φ2 ⋅ 
    //     sin²(Δλ/2)
    // c = 2 ⋅ atan2( √a, √(1−a) )
    // d = R ⋅ c

    const R = 6371e3; // earth radius in metres, an average acutally between 6356.75km @ poles & 6378.14 @ equator
    // degrees = (π/180) * radians || φ, λ converts degrees to radians, used below 
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    
    const hav = Math.pow(Math.sin(Δφ/2), 2) + Math.cos(φ1) * Math.cos(φ2) * Math.pow(Math.sin(Δλ/2), 2);
    const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1-hav)); //2 * angle between 2 points
    
    this.distanceAtoB = +((R * c) / 1000).toFixed(2); // in kilometres
  }

  async setSatData (data?) : Promise<void> {
    this.satData = data ? data : await TLEapi.search(this.query);
  };
  
  async setSatCoord (coords?: number[]) : Promise<void> {
    if(coords != undefined){
      this.satCoord = coords;
      return;
    }

    if(this.query){
      this.satCoord = await TLEapi.getSatLatLon(this.query);
      return;
    }
  }

  setSatCoordLocal (hourOffset: number = 0) : void { // Processes TLEs locally to avoid hitting the /propagate endpoint of the TLE API
    const { line1, line2 } = this.satData;
    const satrec = satellite.twoline2satrec(line1, line2);
    const now : Date = new Date();
    now.setTime(now.getTime() + (hourOffset*60*60*1000));
    const gmst = satellite.gstime(now);

    // Propagate satellite using time in JavaScript Date and pull position and velocity out (a key-value pair of ECI coordinates).
    // These are the base results from which all other coordinates are derived.
    // https://en.wikipedia.org/wiki/Earth-centered_inertial
    // const { position, velocity } = satellite.propagate(satrec, now); // TODO will need velocity if i want to predict where/when the satellite arrives

    const { position } = satellite.propagate(satrec, now);
    // Get satellites ground based position, in Radians
    const positionGd = satellite.eciToGeodetic(position, gmst);
    const satelliteGround = {
      latitude: positionGd.latitude,
      longitude: positionGd.longitude,
      height: positionGd.height
    };

    this.satCoord = [
      satellite.degreesLat(satelliteGround.latitude),
      satellite.degreesLong(satelliteGround.longitude)
    ];
  }

  async setSatPropagate () : Promise<void> { // grab additional data, such as velocity and GPS positioning
    if(this.query){
      this.satData = await TLEapi.getSatPropagate(this.query);
    }
  }

  async setUserCoord (coords?: number[]) : Promise<void> {
    // TODO can i use webbrwoserapi to snag geolocation data
    this.userCoord = coords != undefined ? coords : await UserAddressApi.getUserAddressViaIP();
  }

  setEuclideanTriangle (distances: object[]) : void {
    const { SC1, SC2 } = this.getNearestSatOrbitCoords(distances);
    this.setDistance(SC1['coords'], SC2['coords']);
    const SC1toSC2dist = this.distanceAtoB;
    let triangle : triangle = {
      UserCoord:{
        coords: this.userCoord,
        distance: {
          SatCoord1: SC1['distance'],
          SatCoord2: SC2['distance']
        }
      },
      SatCoord1:{
        coords: SC1['coords'],
        offset: SC1['offsetHrs'],
        distance: {
          UserCoord: SC1['distance'],
          SatCoord2: SC1toSC2dist
        }
      },
      SatCoord2:{
        coords: SC2['coords'],
        offset: SC2['offsetHrs'],
        distance: {
          SatCoord1: SC1toSC2dist,
          UserCoord: SC2['distance']
        }
      }
    };

    this.coordTriangle = triangle;
  }

  setOrbitCoords (tle: string, fullDay: boolean) : void { // get 10 coords evenly spaced along orbit, passed to setEuclideanTriangle
    // TODO: making this a setter so that I can access the array of coords later on to be passed along with other method return objects
    const coords : object[] = [];
    const line2parts : string[] = tle.split(' ');
    const meanMotion : number = fullDay ? 1 : parseFloat(line2parts[line2parts.length - 1]); // speed for 1 orbit
    const orbitalPeriodHrs : number = (24 / meanMotion) * 100; // time for 1 orbit

    for(let i : number = 0; i < orbitalPeriodHrs; i += (orbitalPeriodHrs/10)){
      const offset : number = i/100;
      this.setSatCoordLocal(offset);
      coords.push({lat: this.satCoord[0], long: this.satCoord[1], offset });
    }
    this.orbitCoords = {periodHours: orbitalPeriodHrs, coords};
  }

  getNearestSatOrbitCoords (SCs: object[]) : {SC1: object, SC2: object} {
    // grab the two nearest coords presently caclculated from the 10 chosen in getOrbitCoords
    // sorts by thier proximity to the user coord returns the closest SC1 and a coord next to the closest
  
    SCs.sort((a: object, b:object) => a['distance'] - b['distance']);
    const SC1 : object = SCs[0];
    let SC2 : object;

    // trying to avoid overflowing the array
    // order = the index of when the coords where taken in the orbital path, 0 being the first
    if(SC1['order'] === 0){
      SC2 = SCs.find((el) => el['order'] == 1);
    }else if(SC1['order'] === SCs.length - 1){
      SC2 = SCs.find((el) => el['order'] == SC1['order'] - 1);
    }else{
      //compare the distances from the next and the previous positions and assign the closest of the two to SC2
      const SC2before = SCs.find((el) => el['order'] == SC1['order'] -1);
      const SC2after = SCs.find((el) => el['order'] == SC1['order'] + 1);
      SC2 = SC2before['distance'] <= SC2after['distance'] ? SC2before : SC2after;
    }

    return {SC1, SC2};
  }

  getClosestPointAlongGeodesic (triangle: triangle) : { previousCoord: number[], previousDistance: number, time: Date } 
  {
    // increments the lat/long by incrementing the time offset and recalculating setSatCoordLocal, from SC1 to SC2
    // NOTE: seems to be working but, subsequent reruns get slightly different results, perhaps due to some rounding errors?
    // NOTE: getting a random spot that is off of the oribtal path from the test data of the ISS in relation to my user; best guess is the minor flucuating values in the TLE, apart from the timestamp, get out of sync rather rapidly negating the usefulness of historical testdata
    // TODO: sometimes the returned value is further than one of the starting points, thinking it might be a fencepost problem and returning the last calculated value not the closest one
      // TODO should return the data to be consumed by geojson
      const SC = (reverse? : boolean) => { // a tired doug is a bad doug
        const SC1soonest : boolean = triangle.SatCoord1.offset < triangle.SatCoord2.offset ? true : false;
        if(SC1soonest){
            return reverse ? 'SatCoord2' : 'SatCoord1';
        }else{
            return reverse ? 'SatCoord1' : 'SatCoord2';
        }
    };
    const soonestSCtime = triangle[SC()].offset; // offset === current time +/- offset value | see orbital point in future of past
    const latestSCtime = triangle[SC(true)].offset;
    const offsetDifference = latestSCtime - soonestSCtime;

    let currentDistance : number = triangle.UserCoord.distance[SC()];
    let currentCoord : any = triangle[SC()].coords.slice(); //copy the value, dont reference the original array

    let previousDistance : number = triangle.UserCoord.distance[SC()];
    let previousCoord : number[] = triangle[SC()].coords.slice();

    const usr : any = triangle.UserCoord.coords.slice(); // any because TS being pain, dont care

    const incrementedCoords = [];

    for(let i = soonestSCtime; i < latestSCtime; i += offsetDifference/10){ // TODO: why divide by 10 here, because there's 10 coords to work with?
      
        // push previous stats
        incrementedCoords.push({previousCoord, previousDistance, time: this.getOffsetToDate(i)})
        
        // increment time
        this.setSatCoordLocal(i);
       
        // reassign current vars
        currentCoord = this.satCoord;
        this.setDistance(currentCoord, usr);
        currentDistance = this.distanceAtoB;
 
        // check overflow
        if(currentDistance > previousDistance){
            break;
        }

        // reassign previous vars
        previousCoord = currentCoord.slice();
        previousDistance = currentDistance;
    }

    
    return incrementedCoords.at(-1);
  }

  getOffsetToDate(offset : number) : Date {
    let now = new Date();
    now.setTime(now.getTime() + (offset*60*60*1000));
    let date = new Date(now);
    
    return date; 
  }
}
