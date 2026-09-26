import { Router } from "express";
import { pickFolder } from "../picker.js";

export function createPickerRouter(): Router {
  const router = Router();

  router.post("/", async (_req, res) => {
    const path = await pickFolder();
    if (!path) {
      if (process.platform === "linux") {
        res.status(501).json({
          error:
            "No folder dialog available (install zenity or kdialog). Use the directory browser or paste a path.",
        });
        return;
      }
      res.status(400).json({ error: "Folder picker cancelled or unavailable." });
      return;
    }
    res.json({ path });
  });

  return router;
}
