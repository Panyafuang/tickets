import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import { json } from "body-parser";
import bodyParser from 'body-parser';
import cookieSession from "cookie-session"; // handling all of our cookie related stuff.
import cors from 'cors';

import { currentUserRouter } from "./routes/current-user";
import { signinRouter } from "./routes/signin";
import { signoutRouter } from "./routes/signout";
import { signupRouter } from "./routes/signup";
import { errorHandler, NotFoundError } from "@xtptickets/common";

const app = express();
app.set('trust proxy', true);
app.use(json());
// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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

app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);

// path: /api/users/?(.*)
app.all('*', async (req, res) => {
  throw new NotFoundError()
});

app.use(errorHandler);

export { app };