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
      {
        await OH.setSatData();
        const coords : object[] = [];
        const line2parts : string[] = OH.satData.line2.split(' ');
        const meanMotion : number = parseFloat(line2parts[line2parts.length - 1]);
        const orbitalPeriodHrs : number = (24 / meanMotion) * 100;

        for(let i : number = 0; i < orbitalPeriodHrs; i += 25){ // looping 1/4hr of orbital period
          const offset : number = i/100;
          OH.setSatCoordLocal(offset);
          coords.push({lat: OH.satCoord[0], long: OH.satCoord[1], offset });
        }

        console.log('orbital period (hrs): ', orbitalPeriodHrs, 'cords: ', coords)
      }
        // todo create a line out of htose coords and check distance to user coords to see if within  a set distance

      break;

    case "getOrbits24hrs":
      {
        await OH.setSatData();
        const coords : object[] = [];

        for(let i : number = 0; i < 2400; i += 25){ // looping 1/4hr of day
          const offset : number = i/100;
          OH.setSatCoordLocal(offset);
          coords.push({lat: OH.satCoord[0], long: OH.satCoord[1], offset });
        }

        console.log('24(hrs) | cords: ', coords)

        // todo create a line out of htose coords and check distance to user coords to see if within  a set distance
      }
      break;

    case "getNearMe24hrs":
      await OH.setUserCoord();
      await OH.setSatData();
      const coords : object[] = [];

      for(let i : number = 0; i < 2400; i += 25){ // looping 1/4hr of day
        const offset : number = i/100;
        OH.setSatCoordLocal(offset);
        coords.push({lat: OH.satCoord[0], long: OH.satCoord[1], offset });
      }

      console.log('24(hrs) | cords: ', coords)

      // todo rewrite setdistance to take parameters and to loop through the coords array OR from any point making a line of coords
      // todo if satellite is 100 miles from viewer OR if satellite is viewable, taking into account horizon
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
