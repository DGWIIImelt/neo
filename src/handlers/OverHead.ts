import { TLEapi } from '../api/tle';
import { UserAddressApi } from '../api/userAdress';
// import LatLon, { Nvector, Dms } from 'geodesy/latlon-nvector-spherical.js';
const satellite = require('satellite.js');
// import { triangle } from '../index';
export class OverHead {
  action: string = '';
  distanceAtoB: number = undefined; //used both for distance between user and sat as well as distnace between the same sat over a period of time
  query: string = '';
  userCoord: number[] = [null, null];
  satCoord: number[] = [null, null];
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

  setSatCoordLocal (hourOffset: number = 0) {
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
    // console.log(satrec)
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

  setSatOrbitCoords (SCs: object[]) {
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

  setAngleEuclidean (A: number, B: number, C: number): number {
    // sets angles of a triangle based on side lengths, presumes a flat surface so might not be accurate enough for this task
    // let thingy = setAngleEuclidean(8, 5, 10); // TEST equals 52.41 https://www.youtube.com/watch?v=COMiK1L0Oj8
      // console.log('Thingy: ', thingy)
    const sides : number = Math.pow(A, 2) - Math.pow(B, 2) - Math.pow(C, 2);
    const angRad : number = Math.acos(sides / (-2 * B * C));
    const angDeg : number = angRad * 180 / Math.PI; // rad > deg

    return angDeg;
  }

  //TODO
  // setClosestCoordInOrbit (triangle: triangle): {lat: number, long: number} {
    // console.log(triangle)
    // cicumference of Earth 40075km
    // take first sat coord, user coord, 
    // calculate second with distance from user to first coord, distance from first coord to second
    // make triangle with first to la

    // OR
    // calculate all points in a circle around the earth, following the path of the orbit
    // binary search it, checking if distance from a point on the circle is greater/lesser than a previous one to the user coords, using haversine each time

    // OR
    // http://www.movable-type.co.uk/scripts/latlong-vectors.html#:~:text=source%20code%20below.-,Cross%2Dtrack%20distance,-The%20cross%2Dtrack
  //   return {lat: 0, long: 0};
  // }

  //TODO
  setAngleElliptical (): number {
    return 0;
  }
}
