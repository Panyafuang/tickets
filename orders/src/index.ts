import mongoose from "mongoose";
import { natsWrapper } from "./nats-wrapper"; // ที่ใช้ natsWrapper แบบ lowerCase เพราะว่าเรา import instance ไม่ใช่ class
import { app } from "./app";
import { TicketCreatedListener } from "./events/listeners/ticket-created-listener";
import { TicketUpdatedListener } from "./events/listeners/ticket-updated-listern";
import { ExpirationCompleteListener } from "./events/listeners/expiration-complete-listener";
import { PaymentCreatedLister } from "./events/listeners/payment-created-listener";

const start = async () => {
  /** Check env JWT_KEY */
  if (!process.env.JWT_KEY) {
    throw new Error("JWT_KEY must be definded");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be definded");
  }

  if (!process.env.NATS_CLIENT_ID) {
    throw new Error("NATS_CLIENT_ID must be definded");
  }
  if (!process.env.NATS_URL) {
    throw new Error("NATS_URL must be definded");
  }
  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error("NATS_CLUSTER_ID must be definded");
  }

  try {
    /**
     * 'ticketing' → client ID: ใช้ระบุชื่อ client นี้ว่าเป็น service อะไร (เช่น ticketing service)
     * 'asdf' → ชื่อของกลุ่ม (cluster ID): ใช้กำหนดว่า client นี้อยู่ใน cluster อะไร (อาจเป็นค่า default หรือ dummy ในตัวอย่าง)
     * 'http://nats-srv:4222' → URL ของ NATS server: บอกว่าจะเชื่อมต่อกับ NATS server ที่รันอยู่ที่ nats-srv บน port 4222
     */
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );
    natsWrapper.client.on("close", () => {
      console.log("NATS connection closed!");
      process.exit();
    });
    process.on("SIGINT", () => natsWrapper.client.close());
    process.on("SIGTERM", () => natsWrapper.client.close());


    /**
     * Listening for incomming Events
     */
    new TicketCreatedListener(natsWrapper.client).listen();
    new TicketUpdatedListener(natsWrapper.client).listen();
    new ExpirationCompleteListener(natsWrapper.client).listen();
    new PaymentCreatedLister(natsWrapper.client).listen();

    /**
     * Connecting to MongoDB
     * Mongoose internally keeps track of this connection and everything related to it.
     */
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to mongoDB");
  } catch (error) {
    console.error(error);
  }

  app.listen(3000, () => {
    console.log("Listening on port 3000!!!!!!!!");
  });
};

start();
