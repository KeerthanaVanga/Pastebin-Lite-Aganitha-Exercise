import * as pasteService from "../services/paste.service.js";
import { validateCreatePaste } from "../utils/validators.js";
import { renderPasteHtml } from "../views/paste.view.js";
import { errorResponse } from "../utils/errors.js";

export const createPaste = async (req, res) => {
  const error = validateCreatePaste(req.body);
  if (error) return errorResponse(res, 400, error);
  const paste = await pasteService.create(req.body);

  const proto = (req.headers["x-forwarded-proto"] || req.protocol).split(
    ",",
  )[0];
  const host = req.headers["x-forwarded-host"] || req.get("host");

  res.status(201).json({
    id: paste.id,
    url: `${proto}://${host}/p/${paste.id}`,
  });
};

export const getPasteApi = async (req, res) => {
  try {
    const result = await pasteService.consume(req.params.id, req);
    res.json(result);
  } catch {
    res.status(404).json({ error: { message: "Not found" } });
  }
};

export const getPasteHtml = async (req, res) => {
  try {
    const result = await pasteService.consume(req.params.id, req);
    // Use content from API response to render HTML
    res.type("html").status(200).send(renderPasteHtml({ content: result.content }));
  } catch {
    res.status(404).json({ error: { message: "Not found" } });
  }
};
