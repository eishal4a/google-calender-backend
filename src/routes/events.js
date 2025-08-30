import express from "express";
import Event from "../models/Event.js";
import { google } from "googleapis";
import { oAuth2Client } from "../utils/GoogleApi.js";

const router = express.Router();

// --- Helper: Create event in Google Calendar ---
async function createGoogleEvent(event) {
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
  const gEvent = {
    summary: event.title,
    description: event.description,
    start: { dateTime: event.start },
    end: { dateTime: event.end },
  };

  const res = await calendar.events.insert({
    calendarId: "primary",
    resource: gEvent,
  });
  return res.data;
}

// --- Helper: Delete event in Google Calendar ---
async function deleteGoogleEvent(googleId) {
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
  await calendar.events.delete({
    calendarId: "primary",
    eventId: googleId,
  });
}

// ✅ Get all events (Mongo + Google)
router.get("/", async (req, res) => {
  try {
    // Get from Mongo
    const mongoEvents = await Event.find();

    // Get from Google
    let googleEvents = [];
    try {
      const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
      const response = await calendar.events.list({
        calendarId: "primary",
        maxResults: 50,
        singleEvents: true,
        orderBy: "startTime",
      });

      googleEvents = response.data.items.map((e) => ({
        _id: e.id, // use googleId
        title: e.summary,
        description: e.description,
        start: e.start.dateTime || e.start.date,
        end: e.end.dateTime || e.end.date,
        source: "google",
      }));
    } catch (err) {
      console.error("Google fetch error:", err.message);
    }

    res.json([...mongoEvents, ...googleEvents]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Add new event (Mongo + Google)
router.post("/", async (req, res) => {
  try {
    const { title, description, start, end } = req.body;

    // Save to Mongo
    const newEvent = new Event({ title, description, start, end });
    await newEvent.save();

    // Save to Google
    let googleEvent = null;
    try {
      googleEvent = await createGoogleEvent(newEvent);
    } catch (err) {
      console.error("Google create error:", err.message);
    }

    res.json({ ...newEvent._doc, googleId: googleEvent?.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete event (Mongo + Google)
router.delete("/:id", async (req, res) => {
  try {
    // Delete from Mongo
    await Event.findByIdAndDelete(req.params.id);

    // Delete from Google if it's a Google event
    try {
      await deleteGoogleEvent(req.params.id);
    } catch (err) {
      console.warn("Google delete error (probably not a Google event):", err.message);
    }

    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
