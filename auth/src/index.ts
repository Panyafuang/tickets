import mongoose from "mongoose";
import { app } from './app';


const start = async () => {
  /** Check env JWT_KEY */
  if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be definded');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be definded');
  }

  /** Connecting to MongoDB */
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to mongoDB');
  } catch (error) {
    console.error(error);
  }

  app.listen(3000, () => {
    console.log("Listening on port 3000!!!!!!!!");
  });
}

start();