
import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  access_token: String,
  refresh_token: String,
  scope: String,
  token_type: String,
  expiry_date: Number
});

export default mongoose.model("GoogleToken", tokenSchema);
