import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import { json } from "body-parser";
import cookieSession from "cookie-session"; // handling all of our cookie related stuff.
import cors from 'cors';
import { NotFoundError, currentUser, errorHandler } from '@xtptickets/common';
import { listRoutesRouter } from './routes/route';
import { deleteRouteRouter } from './routes/route/delete';
import { newRouteRouter } from './routes/route/new';
import { showRouteRouter } from './routes/route/show';
import { updateRouteRouter } from './routes/route/update';
import { listBusSchedulesRouterByCriteria } from './routes/schedule/index';
import { createBusScheduleRouter } from './routes/schedule/new';
import { showBusScheduleRouter } from './routes/schedule/show';
import { updateBusScheduleRouter } from './routes/schedule/update';
import { cancelBusScheduleRouter } from './routes/schedule/delete';
import { listBusSchedulesRouter } from './routes/schedule/list';

const app = express();
app.set('trust proxy', true);
app.use(json());

// ─── Set CORS origin ─────────────────────────────────────────────────────────
// app.use((req: Request, res: Response, next: NextFunction) => {
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, correlation-id, Authorization"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, PATCH, DELETE, OPTIONS"
//   );
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   next();
// });
app.use(cors());

/** ใช้เพื่อ set session cookie ต้องอยู่ก่อน router อื่นๆ */
app.use(cookieSession({
  /**
   *  signed: false: หมายถึงไม่มีการเซ็นชื่อ (sign) cookie
      ถ้าเป็น true จะใช้ secret key เพื่อเซ็นชื่อ cookie และป้องกันการแก้ไข
      ที่ตั้งเป็น false แสดงว่าไม่จำเป็นต้องตรวจสอบความถูกต้องของ cookie

      ที่ตั้งค่า signed: false เพราะใช้  jwt(jsonwebtoken) ซึ่งมีความปลอดภัยระดับหนึ่ง หากมีการแก้ไข้จะตรวจสอบได้
   */
  signed: false,
  secure: true // Do not try to manage any cookie if the user is connecting over an HTTP, จะทำให้ cookie ไม่ทำงานใน environment ที่ใช้ HTTP ดังนั้นใน development อาจต้องตั้งค่าเป็น false ชั่วคราว
}));
app.use(currentUser);


// --- ใช้ Routers สำหรับ Route ---
app.use(showRouteRouter);
app.use(listRoutesRouter);
app.use(newRouteRouter);
app.use(updateRouteRouter);
app.use(deleteRouteRouter);

// -- ใช้  Routers สำหรับ Schedule --
app.use(createBusScheduleRouter);
app.use(updateBusScheduleRouter);
app.use(cancelBusScheduleRouter);
app.use(listBusSchedulesRouter);
app.use(listBusSchedulesRouterByCriteria);
app.use(showBusScheduleRouter);

// path: /api/users/?(.*)
app.all('*', async (req, res) => {
  throw new NotFoundError()
});

app.use(errorHandler);

export { app };