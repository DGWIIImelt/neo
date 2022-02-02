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
exports.TLEapi = void 0;
const axios_1 = require("axios");
class TLE {
    search(q) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield axios_1.default.get(`http://tle.ivanstanojevic.me/api/tle/${q}`)
                .then((response) => {
                return response.data;
            })
                .catch((error) => {
                console.log('TLE ERROR!!! ', error);
                return false;
            });
        });
    }
    getSatLatLon(q) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield axios_1.default.get(`http://tle.ivanstanojevic.me/api/tle/${q}/propagate`)
                .then((response) => {
                let result = [
                    response.data.geodetic.latitude,
                    response.data.geodetic.longitude
                ];
                return result;
            })
                .catch((error) => {
                console.log('TLE ERROR!!! ', error);
                return false;
            });
        });
    }
}
exports.TLEapi = new TLE();
