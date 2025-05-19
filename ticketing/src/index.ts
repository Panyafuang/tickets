import mongoose from "mongoose";
import { natsWrapper } from "./nats-wrapper"; // ที่ใช้ natsWrapper แบบ lowerCase เพราะว่าเรา import instance ไม่ใช่ class
import { app } from './app';


const start = async () => {
  /** Check env JWT_KEY */
  if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be definded');
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be definded');
  }


  try {
    await natsWrapper.connect('ticketing', 'asdf', 'http://nats-srv:4222');
    /**
     * Connecting to MongoDB
     * Mongoose internally keeps track of this connection and everything related to it.
     */
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to mongoDB');
  } catch (error) {
    console.log('Connecting to mongoDB error: ', error);
  }

  app.listen(3000, () => {
    console.log("Listening on port 3000!!!!!!!!");
  });
}

start();