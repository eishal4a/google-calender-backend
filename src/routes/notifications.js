
import express from "express";
import { google } from "googleapis";
import { oAuth2Client } from "../utils/googleApi.js";
import { getTokens } from "../utils/tokenStore.js";
import Event from "../models/Event.js";
import crypto from "crypto";

export const notificationsRouter = express.Router();

// ----------------- Google push webhook -----------------
notificationsRouter.post("/google/webhook", async (req, res) => {
  try {
    console.log("📬 Google push received");

    const io = req.app.get("io"); // get Socket.IO instance
    const tokens = getTokens();
    if (!tokens) return res.status(401).send("No tokens");

    oAuth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    const resList = await calendar.events.list({
      calendarId: "primary",
      maxResults: 2500,
      singleEvents: true,
      orderBy: "startTime",
      showDeleted: true,
    });

    const gEvents = resList.data.items;

    for (const gEvent of gEvents) {
      if (gEvent.status === "cancelled") {
        await Event.deleteOne({ googleEventId: gEvent.id });
      } else {
        await Event.findOneAndUpdate(
          { googleEventId: gEvent.id },
          {
            title: gEvent.summary || "",
            description: gEvent.description || "",
            location: gEvent.location || "",
            start: gEvent.start?.dateTime || gEvent.start?.date,
            end: gEvent.end?.dateTime || gEvent.end?.date,
            googleEventId: gEvent.id,
          },
          { upsert: true }
        );
      }
    }

    io.emit("calendarUpdate");
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).send("Webhook failed");
  }
});

// ----------------- Start Google push notifications -----------------
export const startCalendarWatch = async () => {
  const tokens = getTokens();
  if (!tokens) return;

  oAuth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  const channelId = `watch-${Date.now()}-${crypto.randomBytes(8).toString("base64url")}`;

  const watchRes = await calendar.events.watch({
    calendarId: "primary",
    requestBody: {
      id: channelId,
      type: "web_hook",
      address: `${process.env.BACKEND_URL}/api/notifications/google/webhook`,
    },
  });

  console.log("📡 Push channel created:", watchRes.data);
};
