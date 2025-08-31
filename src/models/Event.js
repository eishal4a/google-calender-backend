// models/Event.js
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    color: { type: String, default: "#1a73e8" },
    type: { type: String, default: "event" },
    guests: { type: String, default: "" },

    // Google event ID (only set if synced from Google Calendar)
    googleEventId: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
