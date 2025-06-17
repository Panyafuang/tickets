import { OrderCreatedListener } from "./events/listeners/order-cleated-listener";
import { natsWrapper } from "./nats-wrapper"; // ที่ใช้ natsWrapper แบบ lowerCase เพราะว่าเรา import instance ไม่ใช่ class

const start = async () => {
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

    new OrderCreatedListener(natsWrapper.client).listen();
    
  } catch (error) {
    console.error(error);
  }
};

start();
