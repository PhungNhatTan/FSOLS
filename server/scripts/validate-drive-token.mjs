// validate-drive-token.mjs
import { google } from "googleapis";

const oauth2 = new google.auth.OAuth2(
  process.env.GDRIVE_OAUTH_CLIENT_ID,
  process.env.GDRIVE_OAUTH_CLIENT_SECRET,
  "http://localhost"
);

oauth2.setCredentials({ refresh_token: process.env.GDRIVE_OAUTH_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oauth2 });
const r = await drive.about.get({ fields: "user" });
console.log(r.data);
