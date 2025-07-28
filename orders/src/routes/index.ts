import express, { Request, Response } from "express";
import { Order } from "../models/order";

const router = express.Router();

/** Find all the different orders that belong to this user. */
router.get("/api/orders", async (req: Request, res: Response) => {
  // const orders = await Order.find({
  //   userId: req.currentUser!.id
  // }).populate('ticket');
  const orders = await Order.find({
    userId: req.currentUser!.id
  });

  res.send(orders);
});

export { router as indexOrderRouter };
