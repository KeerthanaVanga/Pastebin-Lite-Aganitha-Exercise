import { Router } from "express";
import {
  createPaste,
  getPasteApi,
} from "../controllers/paste.controller.js";

const router = Router();

router.post("/", createPaste);
router.get("/:id", getPasteApi);

export default router;
