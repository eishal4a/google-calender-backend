import express from "express";
import { oAuth2Client } from "../utils/googleApi.js";

const router = express.Router();

let savedTokens = null; // simple in-memory storage

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

router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(tokens);
    savedTokens = tokens;  // 🔑 save tokens

    res.send("✅ Google Calendar connected successfully! You can now fetch events.");
  } catch (err) {
    console.error("OAuth Error:", err.message);
    res.status(500).send("❌ Failed to connect Google Calendar");
  }
});

// expose endpoint for events.js to reuse tokens
router.get("/tokens", (req, res) => {
  res.json(savedTokens || {});
});

export { savedTokens };
export default router;
