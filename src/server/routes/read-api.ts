import { Router, type RequestHandler } from "express";
import type { QmdDetectResult } from "../qmd/detect.js";
import { QmdService } from "../qmd/service.js";
import { createCollectionsRouter } from "./collections.js";
import { createContextRouter } from "./context.js";
import { createDocsRouter } from "./docs.js";
import { createFsRouter } from "./fs.js";
import { createPickerRouter } from "./picker.js";
import { createStatusRouter } from "./status.js";

export function createQmdUnavailableMiddleware(
  detected: QmdDetectResult,
): RequestHandler {
  return (_req, res, next) => {
    if (!detected.qmdBin) {
      res.status(503).json({
        error:
          "qmd not found on PATH. Install with: npm install -g @tobilu/qmd",
      });
      return;
    }
    next();
  };
}

export function createReadApiRouter(
  detected: QmdDetectResult,
  bindHost: string,
): Router {
  const router = Router();
  router.use(createQmdUnavailableMiddleware(detected));
  if (!detected.qmdBin) return router;

  const service = new QmdService(detected.qmdBin);
  router.use("/status", createStatusRouter(service));
  router.use("/collections", createCollectionsRouter(service));
  router.use("/docs", createDocsRouter(service));
  router.use("/context", createContextRouter(service));
  router.use("/pick-folder", createPickerRouter());
  router.use("/fs", createFsRouter(bindHost));
  return router;
}

export function createQmdService(
  detected: QmdDetectResult,
): QmdService | null {
  return detected.qmdBin ? new QmdService(detected.qmdBin) : null;
}
