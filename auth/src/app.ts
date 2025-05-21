import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors'; // express-async-errors: ช่วยจัดการ error ใน async functions โดยไม่ต้องใช้ try/catch ทุกครั้ง
import { json } from 'body-parser';
import cookieSession from "cookie-session"; // handling all of our cookie related stuff.
import cors from 'cors';

import { currentUserRouter } from "./routes/current-user";
import { signinRouter } from "./routes/signin";
import { signoutRouter } from "./routes/signout";
import { signupRouter } from "./routes/signup";
import { errorHandler, NotFoundError } from "@xtptickets/common";

const app = express();
/**
 * บอก Express ให้ "เชื่อ" ค่า IP ที่มาจาก reverse proxy (เช่น Heroku, nginx) (เช่นเมื่อ deploy บน Heroku, AWS)
 * ถ้า ไม่ตั้ง trust proxy, Express จะ:
 *  - ไม่รู้ว่า user ใช้ https หรือไม่ (มีผลกับ secure cookies)
 *  - ไม่เห็น IP จริงของ user (req.ip จะเป็น IP ของ Ingress)
 *  - อาจทำให้ cookieSession({ secure: true }) ไม่ทำงาน → cookie ไม่ set
 */
app.set('trust proxy', true);


/** 
 * ใช้ในลักษณะ Content-Type	application/json
 * การใช้ bodyParser.json() ก็มีหลักการเดียวกัน (ควรใช้ express.json() แทนในเวอร์ชันใหม่)
 * */
app.use(json());


/**
 * ใช้ในลักษณะ Content-Type	application/x-www-form-urlencoded ใช้สำหรับ รับข้อมูลจากฟอร์ม HTML ที่ส่งแบบ application/x-www-form-urlencoded (ซึ่งเป็น default ของฟอร์ม <form> ปกติ)
 */
// วิธีแนะนำ (Express 4.16+)
// app.use(express.urlencoded({ extended: false }));

// วิธีแบบเก่า (แต่ยังใช้ได้)
// app.use(bodyParser.urlencoded({ extended: false }));





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


/**
 * ใช้ JWT (JSON Web Token) แทนการเก็บ session แบบดั้งเดิม
 * - JWT เก็บใน cookie
 * - ไม่ต้องใช้ signed: true เพราะ JWT มีการเซ็นอยู่แล้ว (jsonwebtoken.verify(...))
 * - เป็นแนวทางที่ปลอดภัยและง่ายในการจัดการการเข้าสู่ระบบ (stateless authentication)
 */
app.use(cookieSession({
  /**
   *  signed: false: หมายถึงไม่มีการเซ็นชื่อ (sign) cookie ถ้าเป็น true จะใช้ secret key เพื่อเซ็นชื่อ cookie และป้องกันการแก้ไข
      ที่ตั้งเป็น false แสดงว่าไม่จำเป็นต้องตรวจสอบความถูกต้องของ cookie เพราะใช้ jwt(jsonwebtoken) ซึ่งมีความปลอดภัยระดับหนึ่ง หากมีการแก้ไข้จะตรวจสอบได้
   */
  signed: false,
  secure: true // กำหนดให้ส่ง cookie ผ่าน HTTPS เท่านั้น (ใน development อาจต้องตั้งเป็น false ชั่วคราว) หมายความว่าใน development (localhost) จะ ไม่เห็น cookie ทำงานเลยถ้าใช้ HTTP ต้องตั้งเป็น false ชั่วคราวตอน dev
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