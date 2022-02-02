import { OverHead } from './handlers/OverHead';

(async() => {
  const OH = new OverHead(process.argv[2], process.argv[3]);

  switch(OH.action){
    case "getDistanceFromMe":
      await OH.setSatCoord();
      await OH.setUserCoord();
      OH.setDistance();
      console.log(`Distance from you to ${OH.query}: ${OH.distanceAtoB}km.`);
      break;

    case "search":
      await OH.setSatData();
      console.log(`Satellite data: ${JSON.stringify(OH.satData)}`)
      break;
  }
})()

//todo build on save?