import express from "express";
import locationRoutes from "./locationRoutes.js";

const router = express.Router();

router.use("/locations", locationRoutes);

export default router;
