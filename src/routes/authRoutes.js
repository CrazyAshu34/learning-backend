import express from "express";
import { register, login } from "../controllers/authController.js";
import {createBusiness} from "../modules/business/business.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/business", createBusiness);

export default router;
