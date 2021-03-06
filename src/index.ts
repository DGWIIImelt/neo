import { OverHead, triangle } from './handlers/OverHead';
import * as testData from './data/test.json';

(async() => {
  const OH = new OverHead(process.argv[2], process.argv[3]);

  switch(OH.action){
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
      }
      break;

    case "getNearMe24hrs":
      // todo doing one orbit to get the math figured out first
      await OH.setSatData();
      await OH.setUserCoord();
      const coords : number[][] = [];
      const line2parts : string[] = OH.satData.line2.split(' ');
      const meanMotion : number = parseFloat(line2parts[line2parts.length - 1]);
      const orbitalPeriodHrs : number = (24 / meanMotion) * 100;
      
      for(let i : number = 0; i < orbitalPeriodHrs; i += 25){ // looping 1/4hr of orbital period
        const offset : number = i/100;
        OH.setSatCoordLocal(offset);
        coords.push([OH.satCoord[1], OH.satCoord[0]]); // flipping lat long to long lat for mapping tool http://geojson.io/#id=gist:DGWIIImelt/65bbaaf46200cb657e9bdb606af59780&map=2/-1.4/-25.5
      }

      console.log('orbital period (hrs): ', orbitalPeriodHrs, 'cords: ', coords, 'user coords: ', OH.userCoord[1], OH.userCoord[0]);

      // distance equation = d = ???(x2 - x1)^2 +(y2 - y1)^2
      // trig solution presumes a both a straight line and the ability to point a 90 degree angle from the user to said line
      // how to choose the two points to create the line? grab the two points with an x or y value that is on both sides of the user's x or y
      // todo rewrite setdistance to take parameters and to loop through the coords array OR from any point making a line of coords
      // todo if satellite is 100 miles from viewer OR if satellite is viewable, taking into account horizon https://en.wikipedia.org/wiki/Horizon
      // moving logic to "test" case to save the API hits
      break;

    case "getNearMeOneOrbit":
      const data = setTestData(testData.features);
      OH.setEuclideanTriangle(data);
      const euclideanTriangle : triangle = OH.coordTriangle;
      const closest = OH.findClosestPointAlongGeodesic(euclideanTriangle);

      console.log(`Distance from you to closest point on geodesic: ${closest.previousDistance} km.`);
      console.log(`Sat lat/long: ${closest.previousCoord[0]} ${closest.previousCoord[1]}`);
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

  function setTestData (data: any[]) : object[] {
    // pulls in test data, reorgs it a bit and runs some calcs and returns an array of satCoords with distances to the user calculated
    const testUserCoord = data.find((el: object) => el['label'] == 'user').geometry.coordinates;
    const testSatCoords = data
      .filter((el: object) => el['label'] == 'satellite')
      .map((el: object) => [el['geometry'].coordinates[1], el['geometry'].coordinates[0]]); // values were swapped for use with geojson.io
    OH.setUserCoord([testUserCoord[1], testUserCoord[0]]); // values were swapped for use with geojson.io
    const distances : object[] = [];

    testSatCoords.forEach((el: [], index: number) => {
      OH.setSatCoord(el);
      OH.setDistance(); // distance from this point in the sat orbit to the user
      distances.push({distance: OH.distanceAtoB, order: index, coords: OH.satCoord});
    });

    return distances;
  }
})()
