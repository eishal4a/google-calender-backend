// src/routes/auth.js
import express from "express";
import { oAuth2Client } from "../utils/googleApi.js";
import GoogleToken from "../utils/tokenStore.js";

const router = express.Router();

router.get("/google", (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    ],
  });
  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // save tokens in DB (overwrite old one)
    await GoogleToken.deleteMany({});
    await GoogleToken.create(tokens);

    res.send("✅ Google Calendar connected successfully!");
  } catch (err) {
    console.error("OAuth Error:", err);
    res.status(500).send("❌ Failed to connect Google Calendar");
  }
});

export default router;
