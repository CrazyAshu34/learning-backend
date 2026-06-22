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
  bulkDeleteCustomer,
  bulkUpdateCustomer,
  createCustomer,
  customerFilter,
  getAllCustomer,
  getSingleCustomer,
  updateCustomer,
} from "../modules/customers/customer.js";

import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { createOrder, getAllOrders } from "../modules/orders/orders.js";
import { createPayment } from "../modules/payment/payment.js";

const router = express.Router();

// ====================== PUBLIC ROUTES ======================
router.post("/register", register);
router.post("/login", login);

// ====================== PROTECTED ROUTES ======================
router.use(protect); // ← All routes below this require token

// Business
router.post("/business", restrictTo("admin", "owner"), createBusiness);
router.get("/business", getBusiness);

// Users
router.post("/user", restrictTo("admin", "owner"), createUser);
router.get("/user", restrictTo("admin", "owner"), getUser);
router.get("/user/:id", getSingleUser);
router.delete("/user/delete/:id", restrictTo("admin", "owner"), deleteUser);

// Customers
router.post("/customer", createCustomer);
router.get("/customer", getAllCustomer);
router.get("/customer/:id", getSingleCustomer);
router.patch("/customer/:id", updateCustomer);
router.delete("/customer", bulkDeleteCustomer);
router.put("/customer", bulkUpdateCustomer);
router.post("/customer/filter", customerFilter);
// create orders
router.post("/create-order", createOrder);
router.get("/orders", getAllOrders);
// create - payment
router.post("/create-payment", createPayment);

export default router;
