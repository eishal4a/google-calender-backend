import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import eventsRoute from "./routes/events.js";
import authRoute from "./routes/auth.js";

dotenv.config();

const app = express();
app.use(express.json());

// connect DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// test route
app.get("/", (req, res) => {
  res.send("Backend running + Mongo connected");
});

// use routes
app.use("/api/auth", authRoute);
app.use("/api/events", eventsRoute);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

