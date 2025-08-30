import express from "express";
import { oAuth2Client, setTokens } from "../utils/googleApi.js";

const router = express.Router();

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
    setTokens(tokens); // 👈 Save tokens
    res.send("✅ Google Calendar connected successfully! You can now add events.");
  } catch (err) {
    console.error("OAuth Error:", err.message);
    res.status(500).send("❌ Failed to connect Google Calendar");
  }
});

export default router;
