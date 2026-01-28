export const nowMsForExpiry = (req) => {
  if (process.env.TEST_MODE === "1") {
    const header = req.header("x-test-now-ms");
    if (header && !isNaN(header)) return Number(header);
  }
  return Date.now();
};
