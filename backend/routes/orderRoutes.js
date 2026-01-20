import express from "express";
import { getMyOrders, getMySales } from "../controllers/orderController.js";

const router = express.Router();

router.get("/myorders/:email", getMyOrders);
router.get("/mysales/:email", getMySales);

export default router;
