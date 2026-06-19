import db from "../../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const createCustomer = async (req, res) => {
  try {
    const id = uuidv4();
    const { name, email, phone, dob, assignAgent, actionStage } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    const sql = `
      INSERT INTO customers
      (id, name, email, phone, dob, assignAgent, actionStage)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(sql, [
      id,
      name,
      normalizedEmail,
      phone,
      dob,
      assignAgent,
      actionStage,
    ]);

    return res.status(201).json({
      message: "Customer created",
      data: {
        id,
        name,
        email: normalizedEmail,
        phone,
        dob,
        assignAgent,
        actionStage,
      },
    });
  } catch (error) {
    console.error("Create customer error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllCustomer = async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * FROM customers`);
    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Fetch all customers error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
