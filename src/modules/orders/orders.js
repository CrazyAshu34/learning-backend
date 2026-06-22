import mysql from "mysql2/promise";
import dotenv from "dotenv";


export const createOrder = async (req, res) => {
  try {
    const { amount, userId } = req.body;

    const orderId = uuidv4();

    await db.execute(
      `
        INSERT INTO orders (id, user_id, amount)
        VALUES (?, ?, ?)`,
      [orderId, userId, amount],
    );

    res.json({
      orderId,
      amount,
      message: "success",
    });
  } catch (error) {
    console.log(error);
    res.json({
      error: error.message,
      message: "system error",
    });
  }
};
