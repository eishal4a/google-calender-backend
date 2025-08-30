import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import eventsRoute from "./routes/events.js";
import authRoute from "./routes/auth.js";
app.use("/api/auth", authRoute);

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

// use events API
app.use("/api/events", eventsRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
