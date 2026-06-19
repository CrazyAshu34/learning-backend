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
    const page = Number(req.query.page || 0); // 0
    const limit = Number(req.query.limit || 20); // 20
    const offset = page * limit; // 0 * 20  = 20
    console.log(page, limit, offset);

    const sql = `SELECT * FROM customers ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const [rows] = await db.execute(sql);

    // const [rows] = await db.execute(`SELECT * FROM customers`);
    const [countRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM customers",
    );

    const totalPages = Math.ceil(countRows?.[0]?.["total"] / limit); //  200 / 20  = 10

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        myTotal: countRows?.[0]?.["total"] || null,
        totalPages,
        hasNext: page < totalPages - 1,
        hasPrev: page > 0,
      },
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

export const updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, dob, assignAgent, actionStage } = req?.body;
    const id = req?.params?.id;
    const [existingRows] = await db.execute(
      "SELECT * FROM customers WHERE id = ?",
      [id],
    );
    const sql = `
      UPDATE customers
      SET
        name = ?,
        email = ?,
        phone = ?,
        dob = ?,
        assignAgent = ?,
        actionStage = ?
      WHERE id = ?
      `;
    const existing = existingRows[0];

    const [result] = await db.execute(sql, [
      name ?? existing.name,
      email ?? existing.email,
      phone ?? existing.phone,
      dob ?? existing.dob,
      assignAgent ?? existing.assignAgent,
      actionStage ?? existing.actionStage,
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }
    const [updatedRows] = await db.execute(
      "SELECT * FROM customers WHERE id = ?",
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: updatedRows,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getSingleCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(`SELECT * FROM customers WHERE id = ?`, [
      id,
    ]);
    const row = rows[0];
    if (!row) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "Got single user", data: row });
  } catch (error) {
    console.error("error in getting role", error);
    return res.status(500).json({ message: "Error fetching user" });
  }
};
