import { OverHead } from './handlers/OverHead';

(async() => {
  const OH = new OverHead(process.argv[2], process.argv[3]);

  switch(OH.action){
    case "getDistanceFromMe":
      await OH.setSatCoord();
      await OH.setUserCoord();
      OH.setDistance();
      console.log(`Distance from you to ${OH.query}: ${OH.distanceAtoB} km.`);
      break;
    
    case "getSatPropagate":
      await OH.setSatPropagate();
      console.log(`Satellite data: ${JSON.stringify(OH.satData)}`);
      console.log(OH.satData);
      console.log(OH.satData?.member.length);
      break;

    case "search":
      await OH.setSatData();
      console.log(`Satellite data: ${JSON.stringify(OH.satData)}`);
      console.log(OH.satData);
      console.log(OH.satData?.member.length);
      break;
  }
})()
