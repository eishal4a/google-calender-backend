import fs from "fs";
const TOKEN_PATH = "./tokens.json";

// Save Google tokens to file
export function saveTokens(tokens) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log("💾 Tokens saved:", Object.keys(tokens));
}

// Retrieve saved tokens
export function getTokens() {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  return JSON.parse(fs.readFileSync(TOKEN_PATH));
}
