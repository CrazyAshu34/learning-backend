import db from "../config/db.js";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";

const formatMySQLDate = (date) => {
  return date.toISOString().slice(0, 19).replace("T", " ");
};

/**
 * Helper to validate a business's active subscription, automatically
 * marking it expired if the expiry date has passed.
 * Returns the current active subscription state or 'free' plan if none.
 */
export const checkAndUpdateSubscriptionExpiry = async (businessId) => {
  // Get the most recent active subscription
  const [subs] = await db.execute(
    `SELECT * FROM subscriptions 
     WHERE business_id = ? AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`,
    [businessId]
  );

  if (subs.length > 0) {
    const subscription = subs[0];
    const expiryDate = new Date(subscription.expiry_date);
    const currentDate = new Date();

    if (expiryDate < currentDate) {
      // The subscription has expired, update DB state
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        await connection.execute(
          "UPDATE subscriptions SET status = 'expired' WHERE id = ?",
          [subscription.id]
        );

        await connection.execute(
          "UPDATE business SET plan = 'free' WHERE id = ?",
          [businessId]
        );

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        console.error("Error updating expired subscription in transaction:", error);
      } finally {
        connection.release();
      }

      return {
        plan_name: "free",
        status: "expired",
        expiry_date: subscription.expiry_date,
        days_remaining: 0,
      };
    }

    // Still active and valid
    const timeDiff = expiryDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

    return {
      plan_name: subscription.plan_name,
      status: subscription.status,
      expiry_date: subscription.expiry_date,
      days_remaining: daysRemaining,
    };
  }

  // Fallback: If no active subscription is found, query business plan directly
  const [businessRows] = await db.execute(
    "SELECT plan FROM business WHERE id = ?",
    [businessId]
  );
  const planName = businessRows.length > 0 ? businessRows[0].plan : "free";

  return {
    plan_name: planName,
    status: "inactive",
    expiry_date: null,
    days_remaining: 0,
  };
};

/**
 * POST /api/payments/create
 * Creates a pending subscription record and a corresponding Razorpay order.
 */
export const createSubscriptionOrder = async (req, res) => {
  try {
    const businessId = req.user?.business_id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID is required. Please verify authentication.",
      });
    }

    // Verify the business exists
    const [businessRows] = await db.execute(
      "SELECT id, name, email FROM business WHERE id = ?",
      [businessId]
    );

    if (businessRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Business not found.",
      });
    }

    const business = businessRows[0];
    const subscriptionId = crypto.randomUUID();
    const amountInPaise = 299 * 100; // Pro Plan is ₹299/month

    // Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: subscriptionId,
      notes: {
        business_id: businessId,
        plan_name: "pro",
      },
    });

    // Save pending subscription record in database
    const insertQuery = `
      INSERT INTO subscriptions (id, business_id, plan_name, status, amount, provider_order_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.execute(insertQuery, [
      subscriptionId,
      businessId,
      "pro",
      "pending",
      299.0,
      razorpayOrder.id,
    ]);

    return res.status(201).json({
      success: true,
      message: "Subscription order created successfully",
      checkout_details: {
        key: process.env.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        subscription_id: subscriptionId,
        business_name: business.name,
        business_email: business.email,
      },
    });
  } catch (error) {
    console.error("Error in createSubscriptionOrder:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while creating order.",
      error: error.message,
    });
  }
};

/**
 * POST /api/payments/verify
 * Validates Razorpay checkout signature and upgrades the subscription/plan.
 */
export const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required Razorpay payment information fields.",
      });
    }

    // Verify Signature securely
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed. Invalid payload.",
      });
    }

    // Fetch subscription record associated with the order ID
    const [subs] = await db.execute(
      "SELECT * FROM subscriptions WHERE provider_order_id = ?",
      [razorpay_order_id]
    );

    if (subs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No subscription record found for the provided order ID.",
      });
    }

    const subscription = subs[0];

    // Compute dates (1 month expiry)
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    // Apply updates using transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Update subscription status, start/expiry dates and payment id
      await connection.execute(
        `UPDATE subscriptions 
         SET status = 'active', start_date = ?, expiry_date = ?, provider_payment_id = ?
         WHERE id = ?`,
        [
          formatMySQLDate(startDate),
          formatMySQLDate(expiryDate),
          razorpay_payment_id,
          subscription.id,
        ]
      );

      // 2. Upgrade the business plan status in business table
      await connection.execute(
        "UPDATE business SET plan = 'pro' WHERE id = ?",
        [subscription.business_id]
      );

      await connection.commit();
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }

    return res.status(200).json({
      success: true,
      message: "Subscription payment verified and upgraded to Pro plan successfully.",
      data: {
        subscription_id: subscription.id,
        plan_name: "pro",
        start_date: formatMySQLDate(startDate),
        expiry_date: formatMySQLDate(expiryDate),
      },
    });
  } catch (error) {
    console.error("Error in verifySubscriptionPayment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while verifying payment.",
      error: error.message,
    });
  }
};

/**
 * GET /api/subscription/current
 * Returns current plan, status, expiry date, and days remaining.
 */
export const getCurrentSubscription = async (req, res) => {
  try {
    const businessId = req.user?.business_id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: "Business ID is required.",
      });
    }

    const currentSubscription = await checkAndUpdateSubscriptionExpiry(businessId);

    return res.status(200).json({
      success: true,
      data: currentSubscription,
    });
  } catch (error) {
    console.error("Error in getCurrentSubscription:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred while fetching subscription details.",
      error: error.message,
    });
  }
};
