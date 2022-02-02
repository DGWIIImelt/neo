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
exports.UserAddressApi = void 0;
const axios_1 = require("axios");
require('dotenv').config();
class UserAddress {
    getUserAddressViaIP() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield axios_1.default.get(`https://ipinfo.io?token=${process.env.address_key}`)
                .then((response) => {
                let address = response.data.loc.split(',');
                return address;
            })
                .catch((error) => {
                console.log('User Address ERROR!!! ', error);
                return false;
            });
        });
    }
}
exports.UserAddressApi = new UserAddress();
