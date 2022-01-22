var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var axios = require('axios');
var Overhead = /** @class */ (function () {
    function Overhead() {
        var _this = this;
        this.userCoord = [];
        this.satCoord = [];
        this.distanceAtoB = undefined;
        this.search = function (q) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios.get("http://tle.ivanstanojevic.me/api/tle/".concat(q))
                            .then(function (response) {
                            return response.data;
                        })["catch"](function (error) {
                            console.log('ERROR!!! ', error);
                            return false;
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); };
        this.getSatById = function (q) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios.get("http://tle.ivanstanojevic.me/api/tle/".concat(q))
                            .then(function (response) {
                            var result = response.data;
                            var line1 = result.line1;
                            var line2 = result.line2;
                            console.log('line1: ', line1);
                            console.log('line2: ', line2);
                            return result;
                        })["catch"](function (error) {
                            console.log('ERROR!!! ', error);
                            return false;
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); };
        this.getSatByIdWithMath = function (q) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios.get("http://tle.ivanstanojevic.me/api/tle/".concat(q, "/propagate"))
                            .then(function (response) {
                            var result = response.data;
                            return result;
                        })["catch"](function (error) {
                            console.log('ERROR!!! ', error);
                            return false;
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); };
        this.getUserAddressViaIP = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios.get("https://ipinfo.io?token=18501ce7f07d92")
                            .then(function (response) {
                            var address = response.data.loc.split(',');
                            return address;
                        })["catch"](function (error) {
                            console.log('ERROR!!! ', error);
                            return false;
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); };
        this.calcDistanceFromUser = function (coords) {
            var lat1 = coords.lat1, lat2 = coords.lat2, lon1 = coords.lon1, lon2 = coords.lon2;
            // haversine formula
            // a = sin²(Δφ/2) + 
            //     cos φ1 ⋅ cos φ2 ⋅ 
            //     sin²(Δλ/2)
            // c = 2 ⋅ atan2( √a, √(1−a) )
            // d = R ⋅ c
            var R = 6371e3; // earth radius in metres, an average acutally between 6356.75km @ poles & 6378.14 @ equator
            // degrees = (π/180) * radians || φ, λ converts degrees to radians, used below 
            var φ1 = lat1 * Math.PI / 180;
            var φ2 = lat2 * Math.PI / 180;
            var Δφ = (lat2 - lat1) * Math.PI / 180;
            var Δλ = (lon2 - lon1) * Math.PI / 180;
            var hav = Math.pow(Math.sin(Δφ / 2), 2) + Math.cos(φ1) * Math.cos(φ2) * Math.pow(Math.sin(Δλ / 2), 2);
            var c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav)); //2 * angle between 2 points
            var d = (R * c) / 1000; // in kilometres
            return d;
        };
    }
    return Overhead;
}());
(function () { return __awaiter(_this, void 0, void 0, function () {
    var thing, action, query, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                thing = new Overhead();
                action = process.argv[2];
                query = process.argv[3];
                _a = thing;
                return [4 /*yield*/, thing.getUserAddressViaIP()];
            case 1:
                _a.userCoord = _c.sent();
                _b = thing;
                return [4 /*yield*/, thing.getSatByIdWithMath(query)];
            case 2:
                _b.satCoord = _c.sent();
                thing.distanceAtoB = thing.calcDistanceFromUser({
                    lat1: thing.userCoord[0],
                    lat2: thing.satCoord.geodetic.latitude,
                    lon1: thing.userCoord[1],
                    lon2: thing.satCoord.geodetic.longitude
                });
                // returnVal = thing[action](query);
                console.log('another way', thing.distanceAtoB);
                return [2 /*return*/];
        }
    });
}); })();
