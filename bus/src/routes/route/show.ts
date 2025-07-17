import express, { Request, Response } from 'express';
import { NotFoundError } from '@xtptickets/common';
import { Route } from '../../models/route';


const router = express.Router();


router.get('/api/bus/routes/:id', async (req: Request, res: Response) => {
    const route = await Route.findById(req.params.id);

    if (!route) {
        throw new NotFoundError();
    }

    res.send(route);
});

export { router as showRouteRouter };