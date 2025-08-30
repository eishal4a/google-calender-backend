import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import eventsRoute from "./routes/events.js";
import authRoute from "./routes/auth.js";   // make sure lowercase "auth.js"

dotenv.config();

const app = express();
app.use(express.json());

// DB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Backend running + Mongo connected");
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/events", eventsRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
