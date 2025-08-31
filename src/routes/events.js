import express from "express";
import Event from "../models/Event.js";
import { google } from "googleapis";

const router = express.Router();


// ✅ GET all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find({});
    res.json(events);
  } catch (err) {
    console.error("Fetch events error:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});


// ✅ POST (Create Event + Sync with Google)
router.post("/", async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  if (!accessToken) return res.status(401).json({ error: "Missing access token" });

  const eventData = req.body;

  try {
    // Setup Google OAuth2
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    // ✅ Validate attendees (only allow valid emails)
    const attendees =
      eventData.guests
        ?.split(",")
        .map(email => email.trim())
        .filter(email => /\S+@\S+\.\S+/.test(email)) // regex for valid emails
        .map(email => ({ email }));

    // ✅ Create event in Google Calendar
    const gcalEvent = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: eventData.title,
        description: eventData.description,
        start: { dateTime: eventData.start },
        end: { dateTime: eventData.end },
        location: eventData.location,
        ...(attendees?.length ? { attendees } : {}), // add only if not empty
      },
    });

    // ✅ Save to MongoDB with googleEventId
    const newEvent = new Event({ ...eventData, googleEventId: gcalEvent.data.id });
    const savedEvent = await newEvent.save();

    res.status(201).json(savedEvent);
  } catch (err) {
    console.error("Backend error:", err);
    res.status(500).json({ error: "Failed to save event" });
  }
});


// ✅ DELETE event (works for MongoDB _id or Google eventId)
router.delete("/:id", async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  const id = req.params.id;

  try {
    // Try MongoDB _id
    let event = await Event.findById(id);

    // If not found, try googleEventId
    if (!event) {
      event = await Event.findOne({ googleEventId: id });
      if (!event) return res.status(404).json({ error: "Event not found" });
    }

    // Delete from Google Calendar if linked
    if (accessToken && event.googleEventId) {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: "v3", auth });
      await calendar.events.delete({
        calendarId: "primary",
        eventId: event.googleEventId
      });
    }

    // Delete from MongoDB
    await Event.findByIdAndDelete(event._id);

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});


export default router;
