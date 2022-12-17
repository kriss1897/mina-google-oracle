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
const snarkyjs_1 = require("snarkyjs");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield snarkyjs_1.isReady;
        const google_id = (0, snarkyjs_1.Field)(''); // Fill the google id here
        const public_key = snarkyjs_1.PublicKey.fromBase58(''); // Fill the public key from response
        const signature = {};
    });
}
main();
