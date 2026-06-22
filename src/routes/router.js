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
import {
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getCurrentSubscription,
} from "../controllers/subscriptionController.js";
import { requirePro } from "../middleware/subscriptionMiddleware.js";
import { createOrder, getAllOrders } from "../modules/orders/orders.js";
import { createPayment } from "../modules/payment/payment.js";

const router = express.Router();

// =============================================================================
// PUBLIC ROUTES — No token required
// =============================================================================

// Bootstrap: first-time super_admin creation only (blocked once super_admin exists)
router.post("/register", register);

// Unified login for ALL roles: super_admin, owner, admin, agent
router.post("/login", login);

// =============================================================================
// PROTECTED ROUTES — All routes below require a valid JWT token
// =============================================================================
router.use(protect);

// ── Business ──────────────────────────────────────────────────────────────────
// Only super_admin can create a business
router.post("/business", restrictTo("super_admin"), createBusiness);
// super_admin sees all; owner/admin see their own (handled in controller)
router.get("/business", getBusiness);

// ── Users ─────────────────────────────────────────────────────────────────────
// Role permission matrix is enforced inside createUser controller:
//   super_admin → owner, admin, agent (any business)
//   owner       → admin, agent        (own business only)
//   admin       → agent               (own business only)
router.post("/user", restrictTo("super_admin", "owner", "admin"), createUser);
router.get("/user", restrictTo("super_admin", "owner", "admin"), getUser);
router.get("/user/:id", restrictTo("super_admin", "owner", "admin"), getSingleUser);
router.delete("/user/delete/:id", restrictTo("super_admin", "owner", "admin"), deleteUser);

// ── Customers ─────────────────────────────────────────────────────────────────
router.post("/customer", createCustomer);   
router.get("/customer", getAllCustomer);
router.get("/customer/:id", getSingleCustomer);
router.patch("/customer/:id", updateCustomer);
router.delete("/customer", bulkDeleteCustomer);
router.put("/customer", bulkUpdateCustomer);
router.post("/customer/filter", customerFilter);

// ── Orders & Payments (legacy) ────────────────────────────────────────────────
router.post("/create-order", createOrder);
router.get("/orders", getAllOrders);
router.post("/create-payment", createPayment);

// =============================================================================
// SaaS SUBSCRIPTION SYSTEM
// =============================================================================

// Create a Razorpay order for Pro plan (₹299/month)
router.post("/api/payments/create", createSubscriptionOrder);

// Verify Razorpay signature and activate Pro subscription
router.post("/api/payments/verify", verifySubscriptionPayment);

// Get current subscription status, plan, expiry, and days remaining
router.get("/api/subscription/current", getCurrentSubscription);

// Sample Pro-gated route — use requirePro on any route you want to restrict
router.get("/api/pro-only-data", requirePro, (req, res) => {
  res.json({
    success: true,
    message: "You have access to this premium feature.",
    subscription: req.subscription,
  });
});

export default router;
