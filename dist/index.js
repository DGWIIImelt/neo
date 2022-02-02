"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const OverHead_1 = require("./handlers/OverHead");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const OH = new OverHead_1.OverHead(process.argv[2], process.argv[3]);
    switch (OH.action) {
        case "getDistanceFromMe":
            yield OH.setSatCoord();
            yield OH.setUserCoord();
            OH.setDistance();
            console.log(`Distance from you to ${OH.query}: ${OH.distanceAtoB}km.`);
            break;
        case "search":
            yield OH.setSatData();
            console.log(`Satellite data: ${JSON.stringify(OH.satData)}`);
            break;
    }
}))();
//todo build on save?
