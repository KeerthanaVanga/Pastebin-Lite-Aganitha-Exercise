export class Paste {
  constructor({ id, content, createdAtMs, expiresAtMs, maxViews }) {
    this.id = id;
    this.content = content;
    this.createdAtMs = createdAtMs;
    this.expiresAtMs = expiresAtMs;
    this.maxViews = maxViews;
    this.viewsUsed = 0;
  }

  static fromJSON(json) {
    return Object.assign(new Paste({}), JSON.parse(json));
  }

  isExpired(nowMs) {
    return this.expiresAtMs !== null && nowMs >= this.expiresAtMs;
  }

  isExhausted() {
    return this.maxViews !== null && this.viewsUsed >= this.maxViews;
  }

  toApiResponse() {
    return {
      content: this.content,
      remaining_views:
        this.maxViews === null
          ? null
          : Math.max(0, this.maxViews - this.viewsUsed),
      expires_at:
        this.expiresAtMs === null
          ? null
          : new Date(this.expiresAtMs).toISOString(),
    };
  }
}
