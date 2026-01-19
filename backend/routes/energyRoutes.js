import express from "express";
import { getAllEnergy, listEnergy, buyEnergy } from "../controllers/energyController.js";

const router = express.Router();

// Route to get all items
router.get("/feed", getAllEnergy);

// Route to list new item
router.post("/list", listEnergy);

// Route to BUY item (This fixes your empty orders!)
router.post("/buy/:id", buyEnergy);

export default router;