import { OverHead, triangle } from './handlers/OverHead';
import * as testData from './data/test.json';
import * as fs from 'fs';

(async() => {
  const OH = new OverHead(process.argv[2], process.argv[3]);

  switch(OH.action){
    case "getDistanceFromMe":
      await OH.setSatData();
      await OH.setUserCoord();
      OH.setSatCoordLocal();
      OH.setDistance();

      console.log(`
        Distance from you to ${OH.query}: ${OH.distanceAtoB} km
        User lat/long: ${OH.userCoord[0]} ${OH.userCoord[1]}
        Sat lat/long: ${OH.satCoord[0]} ${OH.satCoord[1]}
      `);
      break;

    case "getOrbit":
      { // scoping vars to the case not the switch
        await OH.setSatData();
        const orbit = OH.getOrbitCoords(OH.satData.line2, false);

        console.log(`
          orbital period (hrs): ${orbit.periodHours}
          [lat, long, offset (hours from current point in oribit)]
          cords: [
            ${orbit.coords.map((el) => `${[el['lat'], el['long']]} ${el['offset']}\n`)}
          ]
        `);
      }
      break;

    case "getOrbits24hrs":
      {
        await OH.setSatData();
        const orbit = OH.getOrbitCoords(OH.satData.line2, true);

        console.log(`
          orbital period (hrs): ${orbit.periodHours}
          cords: ${orbit.coords}
        `);
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

    case "getNearMeOneOrbit":
      {
        await OH.setSatData();
        await OH.setUserCoord();
        OH.setSatCoordLocal();
        const originalSatLatLong = OH.satCoord.slice();
        const data = OH.getOrbitCoords(OH.satData.line2, false).coords;
        const orbit = setData(data, false);

        OH.setEuclideanTriangle(orbit);
        const euclideanTriangle : triangle = OH.coordTriangle;
        const closest = OH.findClosestPointAlongGeodesic(euclideanTriangle);

        //todo need to get the time when this latlong is happening
        console.log(`
          Current Sat lat/long: ${originalSatLatLong}
          Triangle sat1: ${euclideanTriangle.SatCoord1.coords}
          Triangle sat2: ${euclideanTriangle.SatCoord2.coords}
          Distance from you to closest point on geodesic: ${closest.previousDistance} km
          Closest Sat lat/long: ${closest.previousCoord[0]} ${closest.previousCoord[1]}
        `)
      }
      break;

    case "createTestData":
      {
        // feature interface and swapping of lat/long values are added to allow for quick copy/paste to geojson.io for visualization while working on the project
        interface feature {
            "type": "Feature",
            "label": "user" | "satellite",
            "geometry": {
              "type": "Point",
              "coordinates": number[],
              "offset": number
            },
            "properties": {
              "marker-color": string,
              "marker-size": string,
              "marker-symbol": string
            }
        };
        await OH.setUserCoord();
        await OH.setSatData();
        const orbit = OH.getOrbitCoords(OH.satData.line2, false);
        const coordNum : number[] = [OH.userCoord[1], OH.userCoord[0]];
        const testData = {
          "type": "FeatureCollection",
          "features": []
        };
        const userFeature : feature = {
          "type": "Feature",
          "label": "user",
          "geometry": {
            "type": "Point",
            "coordinates": coordNum,
            "offset": undefined
          },
          "properties": {
            "marker-color": "#dd11",
            "marker-size": "medium",
            "marker-symbol": ""
          }
        }
        orbit.coords.forEach((coord) => {
          const coordNum : number[] = [coord['long'], coord['lat']];
          const satFeature : feature = {
            "type": "Feature",
            "label": "satellite",
            "geometry": {
              "type": "Point",
              "coordinates": coordNum,
              "offset": coord['offset']
            },
            "properties": {
              "marker-color": "#501dc9",
              "marker-size": "medium",
              "marker-symbol": ""
            }
          }
          testData.features.push(satFeature);
        });
        testData.features.unshift(userFeature);

        try {
          fs.writeFileSync('./src/data/test.json', JSON.stringify(testData));
          console.log('Test data created successfully, located ./src/data/test.json')
        } catch (err) {
          console.error(err);
        }
      }
      break;

    case "test":
//todo confirm using new test data that this is working appropriately, I dont think it is

      console.log('TEST case is presently a copy of getNearMeOneOrbit option using historical accurate local data');
      const testUserCoord = testData.features.find((el: object) => el['label'] == 'user').geometry.coordinates;
      OH.setUserCoord([testUserCoord[1], testUserCoord[0]]); // values were swapped for use with geojson.io
      // OH.setSatCoordLocal();
      // const originalSatLatLong = OH.satCoord.slice();
      const orbit = setData(testData.features, true);
      OH.setEuclideanTriangle(orbit);
      const euclideanTriangle : triangle = OH.coordTriangle;
      const closest = OH.findClosestPointAlongGeodesic2(euclideanTriangle);

      console.log(`
        Triangle sat1: ${euclideanTriangle.SatCoord1.coords}
        Triangle sat2: ${euclideanTriangle.SatCoord2.coords}
        Distance from you to SC1: ${euclideanTriangle.SatCoord1.distance.UserCoord} km
        Distance from you to closest point on geodesic: ${closest.previousDistance} km
        Sat lat/long: ${closest.previousCoord[0]} ${closest.previousCoord[1]}
      `);
      break;

    case "getSatPropagate":
      await OH.setSatPropagate();
      console.log(`
        TLE API propogate data: ${OH.satData}
      `);
      break;

    case "search":
      await OH.setSatData();
      console.log(`
        Satellite data: ${JSON.stringify(OH.satData)}
        ${OH.satData}
      `);
      console.log();
      break;
  }

  function setData (data: any[], test: boolean) : {distance: number, order: number, coords: number[]}[] {
    // pulls in test data, reorgs it a bit and runs some calcs and returns an array of satCoords with distances to the user calculated
    const orbit = data
      .filter((el: object) => {
        if(test){
          return el['label'] == 'satellite';
        }
        return el;
      })
      .map((el: object, index: number) => {
        OH.setSatCoord(test ? [el['geometry'].coordinates[1], el['geometry'].coordinates[0]] : [el['lat'], el['long']]); // values were swapped for use with geojson.io
        OH.setDistance();

        return {
          distance: OH.distanceAtoB,
          order: index,
          coords: OH.satCoord,
          offsetHrs: el['geometry']['offset']
        }
      });

    return orbit;
  }
})()
