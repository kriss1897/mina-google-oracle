"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const snarkyjs_1 = require("snarkyjs");
const jwt = __importStar(require("jsonwebtoken"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const HOSTNAME = process.env.HOSTNAME;
app.get("/key", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield snarkyjs_1.isReady;
    const privateKey = snarkyjs_1.PrivateKey.fromBase58(process.env.MINA_PRIVATE_KEY);
    return res.json({
        public: privateKey.toPublicKey().toBase58().toString()
    });
}));
app.get('/init', (req, res) => {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const continueUrl = req.query.continue;
    if (!continueUrl) {
        return res.send('Redirect URL is required');
    }
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    url.searchParams.append('scope', 'openid');
    url.searchParams.append('redirect_uri', `${HOSTNAME}/callback`);
    url.searchParams.append('state', continueUrl);
    url.searchParams.append('nonce', 'x');
    return res.redirect(url.toString());
});
app.get('/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const searchParams = new URLSearchParams();
    searchParams.append('code', req.query.code);
    searchParams.append('client_id', GOOGLE_CLIENT_ID);
    searchParams.append('client_secret', GOOGLE_CLIENT_SECRET);
    searchParams.append('redirect_uri', `${HOSTNAME}/callback`);
    searchParams.append('grant_type', 'authorization_code');
    const config = {
        method: 'post',
        url: 'https://oauth2.googleapis.com/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: searchParams.toString()
    };
    const authRes = yield (0, axios_1.default)(config);
    const data = jwt.decode(authRes.data.id_token);
    const googleId = data === null || data === void 0 ? void 0 : data.sub;
    yield snarkyjs_1.isReady;
    const privateKey = snarkyjs_1.PrivateKey.fromBase58(process.env.MINA_PRIVATE_KEY);
    const signature = snarkyjs_1.Signature.create(privateKey, [(0, snarkyjs_1.Field)(googleId)]);
    const redirectUrl = new URL(req.query.state);
    redirectUrl.searchParams.append('action', 'link-google-account');
    redirectUrl.searchParams.append('signature_r', signature.r.toJSON());
    redirectUrl.searchParams.append('signature_s', signature.s.toJSON());
    redirectUrl.searchParams.append('public_key', privateKey.toPublicKey().toBase58().toString());
    redirectUrl.searchParams.append('google_id', googleId);
    return res.redirect(redirectUrl.toString());
}));
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
