import express from "express";
import { google } from "googleapis";
import { oAuth2Client } from "../utils/googleApi.js";
import { getTokens } from "../utils/tokenStore.js";
import Event from "../models/Event.js";

const router = express.Router();

// ----------------- GET all events -----------------
router.get("/", async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (err) {
    console.error("❌ Fetch events error:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// ----------------- Create or update event -----------------
router.post("/", async (req, res) => {
  try {
    const { title, start, end, description, location, guests, googleEventId } = req.body;
    if (!title || !start || !end)
      return res.status(400).json({ error: "Missing required fields" });

    let tokens = getTokens();
    let gEventId = googleEventId || null;

    if (tokens) {
      oAuth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

      const attendees = guests
        ?.split(",")
        .map(email => email.trim())
        .filter(email => /\S+@\S+\.\S+/.test(email))
        .map(email => ({ email }));

      if (gEventId) {
        await calendar.events.update({
          calendarId: "primary",
          eventId: gEventId,
          requestBody: {
            summary: title,
            description,
            location,
            start: { dateTime: start },
            end: { dateTime: end },
            ...(attendees?.length ? { attendees } : {}),
          },
        });
      } else {
        const gcalEvent = await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: title,
            description,
            location,
            start: { dateTime: start },
            end: { dateTime: end },
            ...(attendees?.length ? { attendees } : {}),
          },
        });
        gEventId = gcalEvent.data.id;
      }
    }

    const newEvent = await Event.findOneAndUpdate(
      { googleEventId: gEventId },
      { title, description, location, guests, start, end, googleEventId: gEventId },
      { upsert: true, new: true }
    );

    req.app.get("io")?.emit("calendarUpdate");
    res.status(201).json(newEvent);
  } catch (err) {
    console.error("❌ Event create/update error:", err);
    res.status(500).json({ error: "Failed to save event", details: err.message });
  }
});

// ----------------- DELETE event -----------------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the event to get Google event ID
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Delete from Google Calendar
    const tokens = getTokens();
    if (tokens && event.googleEventId) {
      oAuth2Client.setCredentials(tokens);
      const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
      await calendar.events.delete({ calendarId: "primary", eventId: event.googleEventId });
    }

    // Delete from MongoDB
    await Event.findByIdAndDelete(id);

    req.app.get("io")?.emit("calendarUpdate");
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("❌ Delete event error:", err);
    res.status(500).json({ error: "Failed to delete event", details: err.message });
  }
});

export default router;
