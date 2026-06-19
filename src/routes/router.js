import express from "express";
import { register, login } from "../controllers/authController.js";
import { createBusiness, getBusiness } from "../modules/business/business.js";
import {
  createUser,
  deleteUser,
  getSingleUser,
  getUser,
} from "../modules/role/role.js";
import {
  createCustomer,
  getAllCustomer,
  getSingleCustomer,
  updateCustomer,
} from "../modules/customers/customer.js";

const router = express.Router();

// ... business ...
// router.post("/register", register);
// router.post("/login", login);
router.post("/business", createBusiness);
router.get("/business", getBusiness);
// ... user ...
router.post("/user", createUser);
router.get("/user", getUser);
router.get("/user/:id", getSingleUser);
router.delete("/user/delete/:id", deleteUser);
// ... customer ...
router.post("/customer", createCustomer);
router.get("/customer", getAllCustomer);
router.patch("/customer/:id", updateCustomer);
router.get("/customer/:id", getSingleCustomer);

export default router;
