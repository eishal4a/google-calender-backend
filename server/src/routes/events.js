import express from "express";
import Event from "../models/Event.js";

const router = express.Router();

// ✅ Get all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Add new event
router.post("/", async (req, res) => {
  try {
    const { title, description, start, end } = req.body;
    const newEvent = new Event({ title, description, start, end });
    await newEvent.save();
    res.json(newEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete event
router.delete("/:id", async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
