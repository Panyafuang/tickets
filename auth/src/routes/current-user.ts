import express from "express";
import { currentUser } from "@xtptickets/common";

const router = express.Router();

/** ก่อนที่จะมี current-user middleware */
// router.get('/api/users/currentuser', (req, res) => {
//   if (!req.session?.jwt) {
//     return res.send({ currentUser: null }); // exit function not executing other code.
//   }

//   /**
//    * If token jwt has been messed with any way, the verify is going to throw error.  AND we need to use trycatch statement
//    */
//   try {
//     const payload = jwt.verify(req.session.jwt, process.env.JWT_KEY!);

//     /** jwt is current */
//     res.send({ currentUser: payload });
//   } catch (err) {
//     res.send({ currentUser: null });
//   }

// });

router.get("/api/users/currentuser", currentUser, (req, res) => {
  console.log("req.currentUser: ", req.currentUser);
  
  res.send({
    currentUser: req.currentUser || null,
  });
});

export { router as currentUserRouter };
