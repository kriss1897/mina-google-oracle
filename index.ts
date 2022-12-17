import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

import axios from 'axios';

import { Field, isReady, PrivateKey, Signature } from "snarkyjs";
import * as jwt from 'jsonwebtoken';

import { Contract, ethers } from 'ethers';

import cors from 'cors';

import ContractABI from './contracts/SampleAccounts';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const HOSTNAME = process.env.HOSTNAME;

app.use(cors());

app.get("/key", async (req: Request, res: Response) => {
  await isReady;

  const privateKey = PrivateKey.fromBase58(process.env.MINA_PRIVATE_KEY as string);
  const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY as string)

  return res.json({
    mina: privateKey.toPublicKey().toBase58().toString(),
    eth: wallet.address
  });
});

app.get('/init', (req: Request, res: Response) => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  const continueUrl = req.query.continue;

  if (!continueUrl) { return res.send('Redirect URL is required'); }

  url.searchParams.append('response_type', 'code');
  url.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  url.searchParams.append('scope', 'openid');
  url.searchParams.append('redirect_uri', `${HOSTNAME}/callback`);
  url.searchParams.append('state', continueUrl as string);
  url.searchParams.append('nonce', 'x');

  return res.redirect(url.toString());
});

app.get('/callback', async (req: Request, res: Response) => {
  const searchParams = new URLSearchParams();

  searchParams.append('code', req.query.code as string);
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
    data : searchParams.toString()
  };

  const authRes = await axios(config);

  const data = jwt.decode(authRes.data.id_token);
  const googleId = data?.sub;

  await isReady;

  const privateKey = PrivateKey.fromBase58(process.env.MINA_PRIVATE_KEY as string);
  const signature = Signature.create(privateKey, [Field(googleId as string)]);

  const redirectUrl = new URL(req.query.state as string);

  redirectUrl.searchParams.append('action', 'link-google-account');
  redirectUrl.searchParams.append('signature_r', signature.r.toJSON());
  redirectUrl.searchParams.append('signature_s', signature.s.toJSON());
  redirectUrl.searchParams.append('public_key', privateKey.toPublicKey().toBase58().toString());
  redirectUrl.searchParams.append('google_id', googleId as string);

  return res.redirect(redirectUrl.toString());
});

app.get('/sync-owner/:address', async (req: Request, res: Response) => {
  const ethAddress = req.params.address;
  const provider = new ethers.providers.JsonRpcProvider(
    "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
  );
  const wallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY as string, provider);

  await isReady;

  const contract = new Contract(ethAddress, ContractABI, wallet);
  // const controller = ethers.utils.toUtf8String(await contract.controller()); 

  // TODO: Query the new controller from the zk app account.
  const newController = '0xD276589Ca84eF7A252C599a584FA0d711c416fF9';

  const transaction = contract.claimAccount(ethers.utils.getAddress(newController));

  await wallet.signTransaction(transaction);

  wallet.sendTransaction(transaction);

  return res.json({ hash: transaction.hash });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
