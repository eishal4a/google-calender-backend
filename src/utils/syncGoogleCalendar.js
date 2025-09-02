// src/utils/syncGoogleCalendar.js
import { google } from "googleapis";
import { oAuth2Client } from "./googleApi.js";
import { getTokens } from "./tokenStore.js";
import Event from "../models/Event.js";

export async function syncGoogleCalendar(io) {
  const tokens = getTokens();
  if (!tokens) {
    console.warn("⚠️ No Google tokens available to sync.");
    return;
  }

  oAuth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  try {
    // Fetch all events including deleted ones
    const res = await calendar.events.list({
      calendarId: "primary",
      maxResults: 2500,
      singleEvents: true,
      orderBy: "startTime",
      showDeleted: true, // important to detect deleted events
    });

    const gEvents = res.data.items;

    for (const gEvent of gEvents) {
      if (gEvent.status === "cancelled") {
        // Remove locally if deleted on Google
        await Event.deleteOne({ googleEventId: gEvent.id });
      } else {
        // Upsert or update
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

    // Remove local events that no longer exist on Google
    const googleEventIds = gEvents.filter(e => e.status !== "cancelled").map(e => e.id);
    await Event.deleteMany({ googleEventId: { $nin: googleEventIds } });

    // Notify frontend via WebSocket
    if (io) io.emit("calendarUpdate");

    console.log("✅ Google Calendar synced successfully");
  } catch (err) {
    console.error("❌ Failed to sync Google Calendar:", err.message);
  }
}
