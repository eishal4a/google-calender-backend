import express from "express";
import { oAuth2Client } from "../utils/GoogleApi.js";
import { google } from "googleapis";
import { oAuth2Client } from '../utils/googleApi.js';


const router = express.Router();

// Step 1: Redirect user to Google OAuth
router.get("/google", (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  });
  res.redirect(url);
});

// Step 2: Callback from Google
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    res.send("✅ Google Calendar connected successfully");
  } catch (err) {
    console.error("OAuth Error:", err.message);
    res.status(500).send("❌ Failed to connect Google Calendar");
  }
});

// 👇 THIS EXPORT IS REQUIRED
export default router;
