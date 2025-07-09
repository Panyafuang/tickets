import express, { Request, Response } from "express";
import { Route } from "../models/route";


const router = express.Router();


router.get('/api/bus/routes', async (req: Request, res: Response) => {
    const routes = await Route.find({});

    res.send(routes);
});

export { router as listRoutesRouter }