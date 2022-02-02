import axios from "axios";
require('dotenv').config();

class UserAddress {
  async getUserAddressViaIP () : Promise<any> {
    return await axios.get(`https://ipinfo.io?token=${process.env.address_key}`)
    .then((response) => {
      let address = response.data.loc.split(',');
      return address;
    })
    .catch((error) => {
      console.log('User Address ERROR!!! ', error)
      return false;
    })
  }
}
export const UserAddressApi = new UserAddress();