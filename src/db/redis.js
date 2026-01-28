import { createClient } from "redis";

let client;

export const getRedis = async () => {
  if (client?.isOpen) return client;

  client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (err) => {
    console.error("Redis client error:", err);
  });
  
  try {
    await client.connect();
    console.log("Redis connected");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
    throw err;
  }

  return client;
};
