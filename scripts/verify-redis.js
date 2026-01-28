/**
 * Run this script to verify Redis storage is working.
 * Usage: node scripts/verify-redis.js
 *
 * Make sure REDIS_URL is set (e.g. in src/.env and load it, or set in shell).
 */
import { createClient } from "redis";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from src/ if it exists
const envPath = join(__dirname, "..", "src", ".env");
if (existsSync(envPath)) {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("ERROR: REDIS_URL not set. Add it to src/.env or set in environment.");
  process.exit(1);
}

const TEST_KEY = "paste:verify-test";
const TEST_VALUE = JSON.stringify({
  id: "verify-test",
  content: "Redis storage verification",
  createdAtMs: Date.now(),
  expiresAtMs: null,
  maxViews: null,
  viewsUsed: 0,
});

async function verify() {
  const client = createClient({ url: REDIS_URL });
  try {
    await client.connect();
    console.log("Connected to Redis.");

    // Write
    await client.set(TEST_KEY, TEST_VALUE);
    console.log("Written test key:", TEST_KEY);

    // Read back
    const read = await client.get(TEST_KEY);
    if (!read) {
      console.error("FAIL: Key not found after write.");
      process.exit(1);
    }
    if (read !== TEST_VALUE) {
      console.error("FAIL: Stored value does not match.");
      process.exit(1);
    }

    // Clean up
    await client.del(TEST_KEY);
    console.log("Deleted test key.");

    console.log("\n✓ Redis storage verified successfully. Data is being stored and read correctly.");
  } catch (err) {
    console.error("FAIL:", err.message);
    process.exit(1);
  } finally {
    await client.quit();
  }
}

verify();
