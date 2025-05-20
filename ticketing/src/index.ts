import mongoose from "mongoose";
import { natsWrapper } from "./nats-wrapper"; // ที่ใช้ natsWrapper แบบ lowerCase เพราะว่าเรา import instance ไม่ใช่ class
import { app } from "./app";

const start = async () => {
  /** Check env JWT_KEY */
  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY must be definded");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be definded");
  }

  try {
    /**
     * 'ticketing' → client ID: ใช้ระบุชื่อ client นี้ว่าเป็น service อะไร (เช่น ticketing service)
     * 'asdf' → ชื่อของกลุ่ม (cluster ID): ใช้กำหนดว่า client นี้อยู่ใน cluster อะไร (อาจเป็นค่า default หรือ dummy ในตัวอย่าง)
     * 'http://nats-srv:4222' → URL ของ NATS server: บอกว่าจะเชื่อมต่อกับ NATS server ที่รันอยู่ที่ nats-srv บน port 4222
     */
    await natsWrapper.connect("ticketing", "asdf", "http://nats-srv:4222");
    /**
     * Connecting to MongoDB
     * Mongoose internally keeps track of this connection and everything related to it.
     */
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to mongoDB");
  } catch (error) {
    console.log("Connecting to mongoDB error: ", error);
  }

  app.listen(3000, () => {
    console.log("Listening on port 3000!!!!!!!!");
  });
};

start();
