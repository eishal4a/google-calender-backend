// utils/tokenStore.js
let storedTokens = null;

export function saveTokens(tokens) {
  storedTokens = tokens;
  console.log("💾 Tokens saved:", Object.keys(tokens));
}

export function getTokens() {
  return storedTokens;
}
