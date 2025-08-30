import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();  // make sure this runs before using process.env

export const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
