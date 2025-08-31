import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config(); // <-- Make sure this is here

export const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

console.log("Google OAuth Setup:", {
  clientId: process.env.GOOGLE_CLIENT_ID ? "✅ Loaded" : "❌ Missing",
  redirect: process.env.GOOGLE_REDIRECT_URI,
});
