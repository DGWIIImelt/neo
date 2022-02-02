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
exports.OverHead = void 0;
const tle_1 = require("../api/tle");
const userAdress_1 = require("../api/userAdress");
class OverHead {
    constructor(action, query) {
        this.userCoord = [null, null];
        this.satCoord = [null, null];
        this.distanceAtoB = undefined;
        this.action = action;
        this.query = query;
    }
    setDistance() {
        const lat1 = this.userCoord[0];
        const lat2 = this.satCoord[0];
        const lon1 = this.userCoord[1];
        const lon2 = this.satCoord[1];
        // haversine formula
        // a = sin²(Δφ/2) + 
        //     cos φ1 ⋅ cos φ2 ⋅ 
        //     sin²(Δλ/2)
        // c = 2 ⋅ atan2( √a, √(1−a) )
        // d = R ⋅ c
        const R = 6371e3; // earth radius in metres, an average acutally between 6356.75km @ poles & 6378.14 @ equator
        // degrees = (π/180) * radians || φ, λ converts degrees to radians, used below 
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const hav = Math.pow(Math.sin(Δφ / 2), 2) + Math.cos(φ1) * Math.cos(φ2) * Math.pow(Math.sin(Δλ / 2), 2);
        const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav)); //2 * angle between 2 points
        this.distanceAtoB = +((R * c) / 1000).toFixed(2); // in kilometres
    }
    setSatData() {
        return __awaiter(this, void 0, void 0, function* () {
            this.satData = yield tle_1.TLEapi.search(this.query);
        });
    }
    setSatCoord() {
        return __awaiter(this, void 0, void 0, function* () {
            this.satCoord = yield tle_1.TLEapi.getSatLatLon(this.query);
        });
    }
    setUserCoord() {
        return __awaiter(this, void 0, void 0, function* () {
            this.userCoord = yield userAdress_1.UserAddressApi.getUserAddressViaIP();
        });
    }
}
exports.OverHead = OverHead;
