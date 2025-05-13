import express, { Request, Response } from "express";
import { Ticket } from "../model/ticket";

const router = express.Router();

router.get("/api/tickets", async (req: Request, res: Response) => {
  /** Putting in an empty obj. right now to say, just give us all the tickets inside this collection */
  const tickets = await Ticket.find({});
  res.send(tickets);
});

export { router as indexTicketRouter }