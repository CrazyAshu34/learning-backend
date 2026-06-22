import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";

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
export const getAllOrders = async (req, res) => {
  try {

    const sql = `select * from orders ORDER BY created_at`;
    const [result] = await db.execute(sql)

    res.json({
      userData: result,
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
