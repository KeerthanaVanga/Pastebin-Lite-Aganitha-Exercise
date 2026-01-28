import { getRedis } from "../db/redis.js";

export const healthCheck = async (req, res) => {
  try {
    const redis = await getRedis();
    await redis.ping();
    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: false });
  }
};
