import { OverHead } from './handlers/OverHead';
const testData = require('../data/test.json');

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
    angle: number,
    distance: {
      UserCoord: number,
      SatCoord2: number
    }
  },
  SatCoord2:{
    coords: number[],
    angle: number,
    distance: {
      SatCoord1: number,
      UserCoord: number
    }
  }
}

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

      // distance equation = d = √(x2 - x1)^2 +(y2 - y1)^2
      // trig solution presumes a both a straight line and the ability to point a 90 degree angle from the user to said line
      // how to choose the two points to create the line? grab the two points with an x or y value that is on both sides of the user's x or y
      // todo rewrite setdistance to take parameters and to loop through the coords array OR from any point making a line of coords
      // todo if satellite is 100 miles from viewer OR if satellite is viewable, taking into account horizon https://en.wikipedia.org/wiki/Horizon
      // moving logic to "test" case to save the API hits
      break;

    case "test":
      // trying to find the closest point on an orbital path to the user
      const data = setTestData(testData.features);
      console.log(data)
      // const euclideanTriangle = setEuclideanTriangle(data); // works for flat surfaces or short distances on a curved surface
      // const ellipticalTriangle = setElliptialTriangle(data);
      // todo
      // using data const above find the point on the orbit that is closest to the user, not the closest set of satCoords but a new coord that falls on the orbital path
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

  // function setElliptialTriangle (data: any[]) : triangle {

  // }

  // function setEuclideanTriangle (distances: object[]) : triangle {
  //   distances.sort((a: object, b:object) => a['distance'] - b['distance']);

  //   const { SC1, SC2 } = OH.setSatOrbitCoords(distances);
  //   OH.setDistance(SC1['coords'], SC2['coords']);
  //   const SC1toSC2dist = OH.distanceAtoB;

  //   let triangle : triangle = {
  //     UserCoord:{
  //       coords: OH.userCoord,
  //       angle: undefined,
  //       distance: {
  //         SatCoord1: SC1['distance'],
  //         SatCoord2: SC2['distance']
  //       }
  //     },
  //     SatCoord1:{
  //       coords: SC1['coords'],
  //       angle: undefined,
  //       distance: {
  //         UserCoord: SC1['distance'],
  //         SatCoord2: SC1toSC2dist
  //       }
  //     },
  //     SatCoord2:{
  //       coords: SC2['coords'],
  //       angle: undefined,
  //       distance: {
  //         SatCoord1: SC1toSC2dist,
  //         UserCoord: SC2['distance']
  //       }
  //     }
  //   };

  //   triangle.UserCoord.angle = OH.setAngleEuclidean(
  //     triangle.SatCoord1.distance.SatCoord2,
  //     triangle.SatCoord1.distance.UserCoord,
  //     triangle.SatCoord2.distance.UserCoord
  //   );
  //   triangle.SatCoord1.angle = OH.setAngleEuclidean(
  //     triangle.SatCoord2.distance.UserCoord,
  //     triangle.SatCoord1.distance.UserCoord,
  //     triangle.SatCoord2.distance.SatCoord1
  //   );
  //   triangle.SatCoord2.angle = OH.setAngleEuclidean(
  //     triangle.SatCoord1.distance.UserCoord,
  //     triangle.SatCoord2.distance.UserCoord,
  //     triangle.SatCoord2.distance.SatCoord1
  //   );

  //   return triangle;
  // }
})()
