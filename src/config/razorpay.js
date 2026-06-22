import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_SECRET;

if (!keyId || !keySecret) {
  throw new Error(
    "Missing Razorpay configuration. Set RAZORPAY_KEY_ID and RAZORPAY_SECRET in your .env file."
  );
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export default razorpay;