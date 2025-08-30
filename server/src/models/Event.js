import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  googleEventId: { type: String, unique: true }, 
  title: { type: String, required: true },
  description: { type: String },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Event", EventSchema);
