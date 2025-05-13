import express, { Request, Response } from "express";
import { body } from "express-validator";
import jwt from 'jsonwebtoken';

import { User } from "../models/user";
import { BadRequestError } from "@xtptickets/common";
import { validateRequest } from "@xtptickets/common";

const router = express.Router();

router.post(
  "/api/users/signup",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password").trim().isLength({ min: 4, max: 20 }).withMessage("Password must be between 4 and 20 characters"),
  ],
  validateRequest,
  /** PASSED VALIDATION */
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    // if not found return null
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new BadRequestError('Email in use');
    }

    // creating user
    const user = User.build({ email, password });
    await user.save();

    /** Generate JWT */
    const userJwt = jwt.sign({
      // payload
      id: user.id,
      email: user.email
    },
      // secret key set ผ่าน CMD ของ windows (JWT_KEY = secret_key)
      process.env.JWT_KEY! 
    );

    /** Store it on session obj. (เก็บไว้ใน cookie-session) */
    // req.session.jwt = userJwt; // javascript style
    /** typescript style */
    req.session = {
      jwt: userJwt
    }

    res.status(201).send(user);
  }
);

export { router as signupRouter };
