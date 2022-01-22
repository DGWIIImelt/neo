import axios from 'axios';

class OverHead{
  userCoord: [] = [];
  satCoord: [] = [];
  distanceAtoB: number = undefined;

  search = async(q) => {
    return await axios.get(`http://tle.ivanstanojevic.me/api/tle/${q}`)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log('ERROR!!! ', error)
      return false;
    })
  }
  
  getSatById = async(q) => {
    return await axios.get(`http://tle.ivanstanojevic.me/api/tle/${q}`)
    .then((response) => {
      let result = response.data;
      // let line1 = result.line1;
      // let line2 = result.line2;

      // console.log('line1: ', line1)
      // console.log('line2: ', line2)
      return result;
    })

    .catch((error) => {
      console.log('ERROR!!! ', error)
      return false;
    })
  }
  
  getSatByIdWithMath = async(q) => {
    return await axios.get(`http://tle.ivanstanojevic.me/api/tle/${q}/propagate`)
    .then((response) => {
      let result = response.data;
      return result;
    })
  
    .catch((error) => {
      console.log('ERROR!!! ', error)
      return false;
    })
  }

  getUserAddressViaIP = async () => {
    return await axios.get(`https://ipinfo.io?token=18501ce7f07d92`)
    .then((response) => {
      let address = response.data.loc.split(',');
      return address;
    })
    .catch((error) => {
      console.log('ERROR!!! ', error)
      return false;
    })
  }

  calcDistanceFromUser = (coords) => {
    let { lat1, lat2, lon1, lon2 } = coords;
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
    
    const d = (R * c) / 1000; // in kilometres

    return d;
  }
}

(async() => {
  let OH = new OverHead();
  let action = process.argv[2];
  let query = process.argv[3];

  OH.userCoord = await OH.getUserAddressViaIP();
  OH.satCoord = await OH.getSatByIdWithMath(query);

  if(OH.userCoord.length && OH.satCoord['geodetic']){
    OH.distanceAtoB = OH.calcDistanceFromUser({
      lat1: OH.userCoord[0],
      lat2: OH.satCoord['geodetic'].latitude,
      lon1: OH.userCoord[1],
      lon2: OH.satCoord['geodetic'].longitude
    });
  }

  // returnVal = OH[action](query);
  console.log('another way', OH.distanceAtoB)
})()

