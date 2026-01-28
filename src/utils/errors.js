export const errorResponse = (res, status, message) => {
  res.status(status).json({ error: { message } });
};
