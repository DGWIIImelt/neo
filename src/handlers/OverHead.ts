import { TLEapi } from '../api/tle';
import { UserAddressApi } from '../api/userAdress';

export class OverHead{
  action;
  query: string = '';
  userCoord: [number, number] = [null, null];
  satCoord: [number, number] = [null, null];
  satData;
  distanceAtoB: number = undefined;

  constructor(action, query){
    this.action = action;
    if(query){
      this.query = query;
    }
    
        console.log('yolof ' ,query, this.query)

  }

  setDistance () : void {
    const lat1 = this.userCoord[0];
    const lat2 = this.satCoord[0];
    const lon1 = this.userCoord[1];
    const lon2 = this.satCoord[1];
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
    this.satData = await TLEapi.search(this.query)
  }

  async setSatCoord () : Promise<void> {
    this.satCoord = await TLEapi.getSatLatLon(this.query);
  }

  async setUserCoord () : Promise<void> {
    this.userCoord = await UserAddressApi.getUserAddressViaIP();
  }
}
