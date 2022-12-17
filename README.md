# Zk Accounts Oracle

Demo video: https://drive.google.com/file/d/1TNkKk1p5i7nNwZO2dcoFKsDsbI-VsYLB/view?usp=sharing

This oracle provides a setup to link google accounts with ZK Apps. It can be used by different types of apps to integrate flows like:

1. SBT Issuance for having a google account
2. Socail Recovery on EVM chains using zero knowledge verification on mina for a google account

Local Setup:

1. Create a `.env` file by copying `.env.example` and populate it with secrets
2. Run the local server by using: `npm run dev`. The server will be lifted on: `http://localhost:8080` or the port mentioned by you.

How it works:

- Any zkApp that wants to verify google account for a user, will go to `http://localhost:8080/init?continue={{callbackUrl}}`.
- This will go through the google auth flow, and at the end, after verifying google id token, return `google_id` for the user to the callback url.
- The callback url here is of the zkApp. eg. `https://example.com/mint-google-sbt` and will include following query params:
  - action: link-google-account
  - signature_r
  - signature_s
  - public_key
  - google_id
- The query params can be used to create a valid signature from the oracle. And that signature can be used to create a proof and mint a token or any other use case.