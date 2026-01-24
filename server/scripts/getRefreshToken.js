// save as mint-refresh-token.mjs
import { google } from "googleapis";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const CLIENT_ID = process.env.GDRIVE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GDRIVE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.GDRIVE_OAUTH_REDIRECT_URI || "http://localhost:3000/oauth2callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GDRIVE_OAUTH_CLIENT_ID / GDRIVE_OAUTH_CLIENT_SECRET");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const url = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive"],
});

console.log("\n1) Open this URL in your browser:\n", url, "\n");

const rl = readline.createInterface({ input, output });
const code = (await rl.question("2) Paste the returned code here: ")).trim();
rl.close();

const { tokens } = await oauth2.getToken(code);

console.log("\nRefresh token:\n", tokens.refresh_token);
console.log("\n(If refresh_token printed as undefined, you didn't get a new one—recheck prompt=consent and the consent flow.)\n");
