import { TLEapi } from '../api/tle';
import { UserAddressApi } from '../api/userAdress';
const satellite = require('satellite.js');
export class OverHead{
  action: string = '';
  distanceAtoB: number = undefined;
  query: string = '';
  userCoord: number[] = [null, null];
  satCoord: number[] = [null, null];
  satData;

  constructor(action: string, query: string){
    this.action = action;
    if(query){
      this.query = query;
    }
  }

  setDistance (A?, B?) : void {
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

  async setSatCoord () : Promise<void> {
    if(this.query){
      this.satCoord = await TLEapi.getSatLatLon(this.query);
    }
  }

  async setSatPropagate () : Promise<void> {
    if(this.query){
      this.satData = await TLEapi.getSatPropagate(this.query);
    }
  }

  async setUserCoord () : Promise<void> {
    this.userCoord = await UserAddressApi.getUserAddressViaIP();
  }

  setSatCoordLocal(hourOffset: number = 0){
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
}
