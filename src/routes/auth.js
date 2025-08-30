import express from "express";
import { google } from "googleapis";
import { oAuth2Client } from "../utils/googleApi.js";
import { saveTokens } from "../utils/tokenStore.js";

const router = express.Router();

// STEP 1: Start OAuth flow
router.get("/google", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "email",
      "profile"
    ],
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  });

  res.redirect(authUrl); // redirect user to Google login page
});

// STEP 2: OAuth callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("❌ No code returned from Google");
    }

    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    saveTokens(tokens); // save tokens for calendar API

    // Get user profile info
    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const userInfo = await oauth2.userinfo.get();

    console.log("✅ Google Calendar connected successfully");

    // Redirect frontend with access token and user info
    res.redirect(
      `https://your-frontend-url/?access_token=${tokens.access_token}&user=${encodeURIComponent(
        JSON.stringify(userInfo.data)
      )}`
    );
  } catch (err) {
    console.error("OAuth Error:", err);
    res.status(500).send("❌ Failed to connect Google Calendar");
  }
});

export default router;
