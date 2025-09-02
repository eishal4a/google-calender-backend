import express from "express";
import { google } from "googleapis";
import { oAuth2Client } from "../utils/googleApi.js";
import { saveTokens, getTokens } from "../utils/tokenStore.js";

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "https://google-calender-xi.vercel.app/";

// -----------------------------
// STEP 1: Start OAuth flow
// -----------------------------
router.get("/google", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "email",
      "profile",
    ],
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  });

  res.redirect(authUrl);
});

// -----------------------------
// STEP 2: OAuth callback
// -----------------------------
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("❌ No code returned from Google");

    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    saveTokens(tokens);

    // Get user profile info
    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const userInfo = await oauth2.userinfo.get();

    console.log("✅ Google Calendar connected successfully");

    // -----------------------------
    // STEP 3: Register push notifications
    // -----------------------------
    try {
      const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

      // unique channel ID
      const channelId = `${userInfo.data.id}-${Date.now()}`;

      // webhook (must be your backend URL with HTTPS)
      const webhookAddress =
        process.env.WEBHOOK_URL ||
        "https://<YOUR_BACKEND_URL>/api/notifications/google/webhook"
;

      const watchResponse = await calendar.events.watch({
        calendarId: "primary",
        requestBody: {
          id: channelId,
          type: "web_hook",
          address: webhookAddress,
        },
      });

      console.log("📡 Push channel created:", watchResponse.data);
    } catch (watchErr) {
      console.error("❌ Failed to set up push notifications:", watchErr);
    }

    // Redirect frontend with token + user info
    const FRONTEND_URL =
      process.env.FRONTEND_URL ||
      (process.env.REPL_SLUG && process.env.REPL_OWNER
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
        : "https://google-calender-xi.vercel.app/");

    res.redirect(
      `${FRONTEND_URL}/?access_token=${tokens.access_token}&user=${encodeURIComponent(
        JSON.stringify(userInfo.data)
      )}`
    );
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).send("Authentication failed");
  }
});

// -----------------------------
// DELETE a Google Calendar event
// -----------------------------
router.delete("/google/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const tokens = getTokens();
    if (!tokens)
      return res.status(401).json({ error: "No Google tokens found" });

    oAuth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    await calendar.events.delete({
      calendarId: "primary",
      eventId: id,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Google Calendar delete error:", err);
    res.status(500).json({ error: "Failed to delete event from Google Calendar" });
  }
});

export default router;
