import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import eventsRoute from "./routes/events.js";
import authRoute from "./routes/auth.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// ----------------- MongoDB Connection -----------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ----------------- Routes -----------------
app.use("/api/auth", authRoute);
app.use("/api/events", eventsRoute);

// ----------------- Test Route -----------------
app.get("/", (req, res) => res.send("🚀 Backend running"));

// ----------------- Server -----------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
