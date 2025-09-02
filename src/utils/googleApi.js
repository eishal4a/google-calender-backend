import dotenv from "dotenv";
import { google } from "googleapis";
import { saveTokens, getTokens } from "./tokenStore.js";

dotenv.config();

export const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Load tokens initially if available
const tokens = getTokens();
if (tokens) {
  oAuth2Client.setCredentials(tokens);
}

// Listen for token refresh and save new tokens
oAuth2Client.on("tokens", (newTokens) => {
  if (newTokens.refresh_token) {
    // Save refresh token only if present (usually only on first auth)
    saveTokens({ ...tokens, refresh_token: newTokens.refresh_token });
  }
  if (newTokens.access_token) {
    // Save updated access token and expiry_date
    saveTokens({ ...tokens, ...newTokens });
  }
});

console.log("Google OAuth Setup:", {
  clientId: process.env.GOOGLE_CLIENT_ID ? "✅ Loaded" : "❌ Missing",
  redirect: process.env.GOOGLE_REDIRECT_URI,
});
