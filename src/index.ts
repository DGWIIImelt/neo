import { OverHead } from './handlers/OverHead';
const testData = require('../data/test.json');

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
      break;

    // trying to find the closest point on an orbital path to the user
    case "test":
      const { features } = testData;
      const testUserCoord = features.find((el: object) => el['label'] == 'user').geometry.coordinates;
      const testSatCoords = features
        .filter((el: object) => el['label'] == 'satellite')
        .map((el: object) => [el['geometry'].coordinates[1], el['geometry'].coordinates[0]]); // values were swapped for use with geojson.io
      OH.userCoord = [testUserCoord[1], testUserCoord[0]]; // values were swapped for use with geojson.io
      const distances : object[] = [];
      let triangle : object = {
        U:{
          coords: [],
          angle: undefined,
          distance: {
            SC1: undefined,
            SC2: undefined
          }
        },
        SC1:{
          coords: [],
          angle: undefined,
          distance: {
            U: undefined,
            SC2: undefined
          }
        },
        SC2:{
          coords: [],
          angle: undefined,
          distance: {
            SC1: undefined,
            U: undefined
          }
        }
      };

      testSatCoords.forEach((el: [], index: number) => {
        OH.satCoord = el;
        OH.setDistance();
        distances.push({distance: OH.distanceAtoB, order: index, coords: OH.satCoord});
      });

      distances.sort((a: object, b:object) => a['distance'] - b['distance']);

      const { SC1, SC2 } = setSatOrbitCoords(distances);
      OH.setDistance(SC1['coords'], SC2['coords']);
      const SC1toSC2dist = OH.distanceAtoB;

      triangle['U']['coords'] = OH.userCoord;
      triangle['U']['distance'].SC1 = SC1['distance'];
      triangle['U']['distance'].SC2 = SC2['distance'];

      triangle['SC1']['coords'] = SC1['coords'];
      triangle['SC1']['distance'].U = SC1['distance'];
      triangle['SC1']['distance'].SC2 = SC1toSC2dist;

      triangle['SC2']['coords'] = SC2['coords'];
      triangle['SC2']['distance'].U = SC2['distance'];
      triangle['SC2']['distance'].SC1 = SC1toSC2dist;

      triangle['U']['angle'] = setAngleEuclidean(triangle['SC1']['distance'].SC2, triangle['SC1']['distance'].U, triangle['SC2']['distance'].U);
      triangle['SC1']['angle'] = setAngleEuclidean(triangle['SC2']['distance'].U, triangle['SC1']['distance'].U, triangle['SC2']['distance'].SC1);
      triangle['SC2']['angle'] = setAngleEuclidean(triangle['SC1']['distance'].U, triangle['SC2']['distance'].U, triangle['SC2']['distance'].SC1);

      // ---------------------------- MATH ATTEMPT BELOW, PRESUMING FLAT SURFACE ----------------------------
      // Calculate angles

      console.log(triangle)
      // let thingy = setAngleEuclidean(8, 5, 10); // TEST equals 52.41 https://www.youtube.com/watch?v=COMiK1L0Oj8
      // console.log('Thingy: ', thingy)
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

function setSatOrbitCoords(SCs: object[]){
  // presumes an array of coords sorted by thier proximity to the user coord
  const SC1 : object = SCs[0];
  let SC2 : object;

  // trying to avoid overflowing the array
  if(SC1['order'] === 0){
    SC2 = SCs.find((el) => el['order'] == 1);
  }else if(SC1['order'] === SCs.length - 1){
    SC2 = SCs.find((el) => el['order'] == SC1['order'] - 1);
  }else{
    SC2 = SCs.find((el) => el['order'] == SC1['order'] + 1);
  }

  return {SC1, SC2};
}

function setAngleEuclidean(A: number, B: number, C: number): number {
  // sets angles of a triangle based on side lengths, presumes a flat surface so might not be accurate enough for this task
  const sides : number = Math.pow(A, 2) - Math.pow(B, 2) - Math.pow(C, 2);
  const angRad : number = Math.acos(sides / (-2 * B * C));
  const angDeg : number = angRad * 180 / Math.PI; // rad > deg

  return angDeg;
}

//TODO
function setClosestCoordInOrbit(triangle): {lat: number, long: number} {
  // cicumference of Earth 40075km
  // take first sat coord, user coord, 
  // calculate second with distance from user to first coord, distance from first coord to second
  // make triangle with first to la

  // OR
  // calculate all points in a circle around the earth, following the path of the orbit
  // binary search it, checking if distance from a point on the circle is greater/lesser than a previous one to the user coords, using haversine each time

  // OR
  // http://www.movable-type.co.uk/scripts/latlong-vectors.html#:~:text=source%20code%20below.-,Cross%2Dtrack%20distance,-The%20cross%2Dtrack
  return {lat: 0, long: 0};
}

//TODO
function setAngleElliptical(): number {
  return 0;
}