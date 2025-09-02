import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import eventsRoute from "./routes/events.js";
import authRoute from "./routes/auth.js";
import { notificationsRouter, startCalendarWatch } from "./routes/notifications.js";

dotenv.config();

const app = express();
app.use(express.json());

// ----------------- MongoDB -----------------
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ----------------- CORS -----------------
const FRONTEND_URLS = ["http://localhost:5173", "https://google-calender-xi.vercel.app"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || FRONTEND_URLS.includes(origin)) callback(null, true);
    else callback(new Error("CORS not allowed"));
  },
  credentials: true,
}));

// ----------------- Routes -----------------
app.use("/api/auth", authRoute);
app.use("/api/events", eventsRoute);
app.use("/api/notifications", notificationsRouter);

// Test route
app.get("/", (req,res) => res.send("🚀 Backend running"));

// ----------------- HTTP + Socket.IO -----------------
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URLS, methods: ["GET","POST"], credentials: true }
});
app.set("io", io); 

// ----------------- Start server -----------------
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, async () => {
  console.log(`✅ Server + Socket.IO running on port ${PORT}`);

  try {
    await startCalendarWatch();  // Start Google push notifications
  } catch (err) {
    console.error("❌ Failed to start watch:", err.message);
  }
});
