import express from "express";
import {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  resetLocations,
  exportReportPdf,
} from "../controllers/locationController.js";

const router = express.Router();

router.get("/", getAllLocations);
router.get("/:id", getLocationById);
router.post("/", createLocation);
router.put("/:id", updateLocation);
router.delete("/:id", deleteLocation);
router.post("/reset", resetLocations);
router.get("/export/pdf", exportReportPdf);

export default router;
