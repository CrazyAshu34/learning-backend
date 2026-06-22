import crypto from "crypto";

export const paymentWebhook = async (
  req,
  res
) => {
  const secret =
    process.env.RAZORPAY_WEBHOOK_SECRET;

  const signature =
    req.headers["x-razorpay-signature"];

  const body = JSON.stringify(req.body);

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    return res.sendStatus(400);
  }

  const event = req.body.event;

  if (event === "payment.captured") {
    console.log("Payment Success");
  }

  res.sendStatus(200);
};