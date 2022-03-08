import { OverHead } from './handlers/OverHead';

(async() => {
  const OH = new OverHead(process.argv[2], process.argv[3]);

  switch(OH.action){
    // requires experimental endpoint for SGP4 derived data
    // case "getDistanceFromMe":
    //   await OH.setSatCoord(); 
    //   await OH.setUserCoord();
    //   OH.setDistance();
    //   console.log(`Distance from you to ${OH.query}: ${OH.distanceAtoB} km.`);
    //   console.log(`User lat/long: ${OH.userCoord[0]} ${OH.userCoord[1]}`);
    //   console.log(`Sat lat/long: ${OH.satCoord[0]} ${OH.satCoord[1]}`);
    //   break;

    // does NOT require experimental endpoint for SGP4 derived data
    case "getDistanceFromMe":
      await OH.setSatData();
      await OH.setUserCoord();
      OH.setSatCoordLocal();
      OH.setDistance();

      console.log(`Distance from you to ${OH.query}: ${OH.distanceAtoB} km.`);
      console.log(`User lat/long: ${OH.userCoord[0]} ${OH.userCoord[1]}`);
      console.log(`Sat lat/long: ${OH.satCoord[0]} ${OH.satCoord[1]}`);
      break;
      
    case "getOrbit":
      let coords : object[] = [];
      await OH.setSatData();
      // todo need to calculate the orbital period?
      for(let i : number = 0; i < 175; i += 25){ // looping quarter of an hour to 90 mins, the orbital period of ISS
        const offset : number = i/100;
        OH.setSatCoordLocal(offset);
        coords.push({lat: OH.satCoord[0], long: OH.satCoord[1], offset });
      }

      console.log('cords', coords)
      console.log(OH.satData)

      // todo create a line out of htose coords and check distance to user coords to see if within  a set distance

      break;

    case "getSatPropagate":
      await OH.setSatPropagate();
      console.log('TLE API propogate data:');
      console.log(OH.satData);
      break;

    case "search":
      await OH.setSatData();
      console.log(`Satellite data: ${JSON.stringify(OH.satData)}`);
      console.log(OH.satData);
      break;
  }
})()
