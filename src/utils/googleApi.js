import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

console.log("Google Config:", {
  clientId: process.env.GOOGLE_CLIENT_ID,
  secret: process.env.GOOGLE_CLIENT_SECRET ? "loaded" : "missing",
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

export const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
