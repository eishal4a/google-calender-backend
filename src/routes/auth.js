import express from "express";
import { oAuth2Client } from '../utils/googleApi.js';
import { google } from "googleapis";

const router = express.Router();

// Step 1: Redirect user to Google OAuth
router.get("/google", (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline", // ensures refresh token
    prompt: "consent", // always ask user to choose account
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  });
  res.redirect(url);
});

// Step 2: Callback (Google redirects here)
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // ⚡ Here you should save tokens in DB (per user).
    // Example: await User.findByIdAndUpdate(userId, { googleTokens: tokens });

    res.send("✅ Google Calendar connected successfully. You can close this tab.");
  } catch (err) {
    console.error("OAuth Error:", err.message);
    res.status(500).send("❌ Failed to connect Google Calendar");
  }
});

export default router;
