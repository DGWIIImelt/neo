import axios from "axios";

class TLE{
  async search (q): Promise<any> {
    return await axios.get(`http://tle.ivanstanojevic.me/api/tle/${q}`)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log('TLE ERROR!!! ', error)
      return false;
    })
  }

  async getSatLatLon (q) : Promise<any> {
    return await axios.get(`http://tle.ivanstanojevic.me/api/tle/${q}/propagate`)
    .then((response) => {
      let result : [number, number] = [
        response.data.geodetic.latitude,
        response.data.geodetic.longitude
      ];
      return result;
    })

    .catch((error) => {
      console.log('TLE ERROR!!! ', error)
      return false;
    })
  }
}

export const TLEapi = new TLE();