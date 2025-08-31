import express from "express";
import Event from "../models/Event.js";
import { google } from "googleapis";

const router = express.Router();

// GET all events (MongoDB + Google)
router.get("/", async (req, res) => {
  try {
    const events = await Event.find({});
    const accessToken = req.headers.authorization?.split(" ")[1];
    let gcalEvents = [];

    if (accessToken) {
      try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const calendar = google.calendar({ version: "v3", auth });
        const gcalRes = await calendar.events.list({ calendarId: "primary" });

        gcalEvents = gcalRes.data.items.map((e) => ({
          _id: `gcal_${e.id}`,
          title: e.summary,
          description: e.description,
          location: e.location,
          start: new Date(e.start.dateTime || e.start.date),
          end: new Date(e.end.dateTime || e.end.date),
          color: "#34A853",
          googleEventId: e.id,
        }));
      } catch (err) {
        console.error("Google fetch error:", err);
      }
    }

    res.json([...events, ...gcalEvents]);
  } catch (err) {
    console.error("Fetch events error:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// POST create event + sync with Google
router.post("/", async (req, res) => {
  const eventData = req.body;
  const accessToken = req.headers.authorization?.split(" ")[1];

  try {
    let googleEventId = null;

    if (accessToken) {
      try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const calendar = google.calendar({ version: "v3", auth });

        const attendees =
          eventData.guests
            ?.split(",")
            .map((email) => email.trim())
            .filter((email) => /\S+@\S+\.\S+/.test(email))
            .map((email) => ({ email }));

        const gcalEvent = await calendar.events.insert({
          calendarId: "primary",
          requestBody: {
            summary: eventData.title,
            description: eventData.description,
            start: { dateTime: eventData.start },
            end: { dateTime: eventData.end },
            location: eventData.location,
            ...(attendees?.length ? { attendees } : {}),
          },
        });

        googleEventId = gcalEvent.data.id;
      } catch (err) {
        console.error("Google insert error:", err);
      }
    }

    const newEvent = new Event({ ...eventData, googleEventId });
    const savedEvent = await newEvent.save();

    res.status(201).json(savedEvent);
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ error: "Failed to save event" });
  }
});

// DELETE event (MongoDB + Google)
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const accessToken = req.headers.authorization?.split(" ")[1];

  try {
    const event = await Event.findById(id);
    const googleEventId = event?.googleEventId || (id.startsWith("gcal_") ? id.replace("gcal_", "") : null);

    if (!event && !googleEventId) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Delete from Google Calendar
    if (googleEventId && accessToken) {
      try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const calendar = google.calendar({ version: "v3", auth });
        await calendar.events.delete({ calendarId: "primary", eventId: googleEventId });
      } catch (err) {
        console.error("Google delete error:", err);
      }
    }

    // Delete from MongoDB
    if (event) await Event.findByIdAndDelete(event._id);

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
