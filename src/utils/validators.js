export const validateCreatePaste = (body) => {
  if (!body || typeof body.content !== "string" || !body.content.trim()) {
    return "content must be a non-empty string";
  }
  if (
    body.ttl_seconds !== undefined &&
    (!Number.isInteger(body.ttl_seconds) || body.ttl_seconds < 1)
  ) {
    return "ttl_seconds must be >= 1";
  }
  if (
    body.max_views !== undefined &&
    (!Number.isInteger(body.max_views) || body.max_views < 1)
  ) {
    return "max_views must be >= 1";
  }
  return null;
};
