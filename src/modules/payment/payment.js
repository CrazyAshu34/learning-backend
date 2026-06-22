import db from "../../config/db.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";

export const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const [rows] = await db.execute("SELECT * FROM orders WHERE id=?", [
      orderId,
    ]);

    if (!rows.length) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const order = rows[0];

    const paymentOrder = await razorpay.orders.create({
      amount: Number(order.amount) * 100,
      currency: "INR",
      receipt: order.id,
    });

    await db.execute(
      `UPDATE orders
       SET provider_order_id=?
       WHERE id=?`,
      [paymentOrder.id, order.id],
    );

    res.json(paymentOrder);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

// verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    await db.execute(
      `UPDATE orders
       SET status='paid',
           provider_payment_id=?
       WHERE provider_order_id=?`,
      [razorpay_payment_id, razorpay_order_id],
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};
