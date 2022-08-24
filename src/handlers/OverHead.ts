import { TLEapi } from '../api/tle';
import { UserAddressApi } from '../api/userAdress';
const satellite = require('satellite.js');
export interface triangle {
  UserCoord:{
    coords: number[],
    angle: number,
    distance: {
      SatCoord1: number,
      SatCoord2: number
    }
  },
  SatCoord1:{
    coords: number[],
    offset: number,
    angle: number,
    distance: {
      UserCoord: number,
      SatCoord2: number
    }
  },
  SatCoord2:{
    coords: number[],
    offset: number,
    angle: number,
    distance: {
      SatCoord1: number,
      UserCoord: number
    }
  }
}

export class OverHead {
  action: string = '';
  distanceAtoB: number = undefined; //used both for distance between user and sat as well as distnace between the same sat over a period of time
  query: string = '';
  userCoord: number[] = [null, null];
  satCoord: number[] = [null, null];
  coordTriangle: triangle;
  satData;

  constructor (action: string, query: string) {
    this.action = action;
    if(query){
      this.query = query;
    }
  }

  setDistance (A? : [], B? : []) : void {
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

  async setSatData () : Promise<void> {
    this.satData = await TLEapi.search(this.query);
  }

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

  async setSatPropagate () : Promise<void> {
    if(this.query){
      this.satData = await TLEapi.getSatPropagate(this.query);
    }
  }

  async setUserCoord (coords?: number[]) : Promise<void> {
    this.userCoord = coords != undefined ? coords : await UserAddressApi.getUserAddressViaIP();
  }

  setSatCoordLocal (hourOffset: number = 0) : void {
    // Processes TLEs locally to avoid hitting the /propagate endpoint of the TLE API
    const { line1, line2 } = this.satData;
    const satrec = satellite.twoline2satrec(line1, line2);
    const now : Date = new Date();
    now.setTime(now.getTime() + (hourOffset*60*60*1000));
    const gmst = satellite.gstime(now);

    // Propagate satellite using time in JavaScript Date and pull position and velocity out (a key-value pair of ECI coordinates).
    // These are the base results from which all other coordinates are derived.
    // https://en.wikipedia.org/wiki/Earth-centered_inertial
    // const { position, velocity } = satellite.propagate(satrec, now); will need velocity if i want to predict where/when the satellite arrives

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

  setAngleEuclidean (A: number, B: number, C: number) : number {
    // sets angles of a triangle based on side lengths, presumes a flat surface so might not be accurate enough for this task
    // let thingy = setAngleEuclidean(8, 5, 10); // TEST equals 52.41 https://www.youtube.com/watch?v=COMiK1L0Oj8
    const sides : number = Math.pow(A, 2) - Math.pow(B, 2) - Math.pow(C, 2);
    const angRad : number = Math.acos(sides / (-2 * B * C));
    const angDeg : number = angRad * 180 / Math.PI; // rad > deg

    return angDeg;
  }

  setEuclideanTriangle (distances: object[]) : void {
    distances.sort((a: object, b:object) => a['distance'] - b['distance']);

    const { SC1, SC2 } = this.getNearestSatOrbitCoords(distances);
    this.setDistance(SC1['coords'], SC2['coords']);
    const SC1toSC2dist = this.distanceAtoB;
    let triangle : triangle = {
      UserCoord:{
        coords: this.userCoord,
        angle: undefined,
        distance: {
          SatCoord1: SC1['distance'],
          SatCoord2: SC2['distance']
        }
      },
      SatCoord1:{
        coords: SC1['coords'],
        offset: SC1['offsetHrs'],
        angle: undefined,
        distance: {
          UserCoord: SC1['distance'],
          SatCoord2: SC1toSC2dist
        }
      },
      SatCoord2:{
        coords: SC2['coords'],
        offset: SC2['offsetHrs'],
        angle: undefined,
        distance: {
          SatCoord1: SC1toSC2dist,
          UserCoord: SC2['distance']
        }
      }
    };

    triangle.UserCoord.angle = this.setAngleEuclidean(
      triangle.SatCoord1.distance.SatCoord2,
      triangle.SatCoord1.distance.UserCoord,
      triangle.SatCoord2.distance.UserCoord
    );
    triangle.SatCoord1.angle = this.setAngleEuclidean(
      triangle.SatCoord2.distance.UserCoord,
      triangle.SatCoord1.distance.UserCoord,
      triangle.SatCoord2.distance.SatCoord1
    );
    triangle.SatCoord2.angle = this.setAngleEuclidean(
      triangle.SatCoord1.distance.UserCoord,
      triangle.SatCoord2.distance.UserCoord,
      triangle.SatCoord2.distance.SatCoord1
    );

    this.coordTriangle = triangle;
  }

  getOrbitCoords (tle: string, fullDay: boolean) : {periodHours: number, coords: object[]} {
    const coords : object[] = [];
    const line2parts : string[] = tle.split(' ');
    const meanMotion : number = fullDay ? 1 : parseFloat(line2parts[line2parts.length - 1]); // speed for 1 orbit
    const orbitalPeriodHrs : number = (24 / meanMotion) * 100; // time for 1 orbit

    for(let i : number = 0; i < orbitalPeriodHrs; i += (orbitalPeriodHrs/10)){
      const offset : number = i/100;
      this.setSatCoordLocal(offset);
      coords.push({lat: this.satCoord[0], long: this.satCoord[1], offset });
    }
    return {periodHours: orbitalPeriodHrs, coords};
  }

  getNearestSatOrbitCoords (SCs: object[]) : {SC1: object, SC2: object} {
    // todo needs to be redesigned to have the usercoord in between these two
    // grab the two nearest coords presently caclculated
    // presumes an array of coords sorted by thier proximity to the user coord returns the closest SC1 and a coord next to the closest
    const SC1 : object = SCs[0];
    let SC2 : object;

    // trying to avoid overflowing the array
    // order = the index of when the coords where taken in the orbital path, 0 being the first
    if(SC1['order'] === 0){
      SC2 = SCs.find((el) => el['order'] == 1);
    }else if(SC1['order'] === SCs.length - 1){
      SC2 = SCs.find((el) => el['order'] == SC1['order'] - 1);
    }else{
      SC2 = SCs.find((el) => el['order'] == SC1['order'] + 1);
    }

    return {SC1, SC2};
  }

  findClosestPointAlongGeodesic2 (triangle: triangle) : { previousCoord: number[], previousDistance: number, time: string } {
    //todo previous attempt is following what I'm guessing is a linear line connecting the 2 coords that has no relationship to hte calculated orbit.
    //todo need to change for incrementing the lat/long to incrementing the time component from one SC to the next using setSatCoordLocal(),
    //todo this will give me the coords, keep them on the projected orbit, and i'll now when they'll be there
    //todo binary search it, to halve the work over and over

    console.log('HERE', triangle.SatCoord1.offset)

    //todo
    // * get difference between offsets of SC1 & SC2
    // * increment from the lowest offset to the highest
    // * pass in new offest vale to setSatCoordLocal
    const SC1soonest : boolean = triangle.SatCoord1.offset < triangle.SatCoord2.offset ? true : false;
    const SC = (reverse? : boolean) => {
      if(SC1soonest){
        return reverse ? 'SatCoord2' : 'SatCoord1';
      }else{
        return reverse ? 'SatCoord1' : 'SatCoord2';
      }
    };
    const soonestSC = triangle[SC()].offset;
    const latestSC = triangle[SC(true)].offset;

    let currentDistance : number = triangle.UserCoord.distance[SC()];
    let currentCoord : number[] = triangle[SC()].coords.slice(); //copy the value, dont reference the original array

    let previousDistance : number = triangle.UserCoord.distance[SC()];
    let previousCoord : number[] = triangle[SC()].coords.slice();

    let cur : any = currentCoord.slice();
    const usr : any = triangle.UserCoord.coords.slice(); // any because TS being pain, dont care


    const offsetDifference = latestSC - soonestSC;

    const test = []
    for(let i = soonestSC; i < latestSC; i += offsetDifference/10){
      this.setDistance(cur, usr); // call it at the start to not use the last stored value before passing it to the next line
      test.push({previousCoord, previousDistance})
      currentDistance = this.distanceAtoB;

      if(currentDistance > previousDistance){
        break;
      }
      previousCoord = currentCoord.slice();
      previousDistance = currentDistance;
    }
    return {previousCoord: [2], previousDistance: 2, time: "2"}
  }

  findClosestPointAlongGeodesic (triangle: triangle) : { previousCoord: number[], previousDistance: number } {
    // in lieu of a sexy noneuclidean geometry solution, this function takes the geodesic line-segment between SC1 and SC2 and increments the lat/long coords from SC1 to SC2, checking the distance from this new coord to the user and returning when the shortest distance is found
    let currentDistance : number = triangle.UserCoord.distance.SatCoord1;
    let currentCoord : number[] = triangle.SatCoord1.coords.slice(); //copy the value, dont reference the original array

    let previousDistance : number = triangle.UserCoord.distance.SatCoord1;
    let previousCoord : number[] = triangle.SatCoord1.coords.slice();

    let cur : any = currentCoord.slice();
    const usr : any = triangle.UserCoord.coords.slice(); // any because TS being pain, dont care

    const latDifference : number = Math.abs(triangle.SatCoord1.coords[0] - triangle.SatCoord2.coords[0]);
    const longDifference : number = Math.abs(triangle.SatCoord1.coords[1] - triangle.SatCoord2.coords[1]);
    const biggestDifference : number = Math.abs(latDifference > longDifference ? latDifference : longDifference);
    const latIncrementValue : number = Math.abs(latDifference/biggestDifference);
    const longIncrementValue : number = Math.abs(longDifference/biggestDifference);
    const incrementLat : boolean = triangle.SatCoord1.coords[0] > triangle.SatCoord2.coords[0];
    const incrementLong : boolean = triangle.SatCoord1.coords[1] > triangle.SatCoord2.coords[1];

    //todo looks like the incrment value for the lat vs long is swapped
    console.log(latDifference, latIncrementValue)
    console.log(longDifference , longIncrementValue)
    console.log(biggestDifference)

// todo could just incremtn all the way from sc1 > sc2 then sort the values to see which is closest, how many values?

//todo could also drop the increment value a bit to get closer
const test = []
    for(let i = 0; i < biggestDifference; i++){
      this.setDistance(cur, usr); // call it at the start to not use the last stored value before passing it to the next line
      test.push({previousCoord, previousDistance})
      currentDistance = this.distanceAtoB;

      if(currentDistance > previousDistance){
        break;
      }
      previousCoord = currentCoord.slice();
      previousDistance = currentDistance;

      //todo could average the incrmente value of both lat and long, using just one increment value also could be used int he for loop to keep everything synced

      // todo not sure how the southern hemisphere will work lat/long value can be 90 -90 lat 180 -180 long
      currentCoord[0] = (incrementLat ? (currentCoord[0] - latIncrementValue) : (currentCoord[0] + latIncrementValue)) % 90;
      currentCoord[1] = (incrementLong ? (currentCoord[1] - longIncrementValue) : (currentCoord[1] + longIncrementValue)) % 180;

      cur = currentCoord.slice();
    }

console.log(test)
    return {previousCoord, previousDistance};
  }
}
