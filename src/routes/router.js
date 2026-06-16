import express from "express";
import { register, login } from "../controllers/authController.js";
import { createBusiness, getBusiness } from "../modules/business/business.js";
import { createUser, getUser } from "../modules/role/role.js";

const router = express.Router();

// router.post("/register", register);
// router.post("/login", login);
router.post("/business", createBusiness);
router.get("/business", getBusiness);
router.post("/user", createUser);
router.get("/user", getUser);

export default router;
