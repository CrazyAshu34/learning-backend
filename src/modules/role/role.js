// modules/role/role.js
import db from "../../config/db.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { isMissing } from "../../utils.js";

export const createUser = async (req, res) => {
  try {
    let { business_id, name, email, password, role } = req.body;

    const id = crypto.randomUUID();

    const fields = [
      { key: "business_id", value: business_id },
      { key: "name", value: name },
      { key: "email", value: email },
      { key: "password", value: password },
    ];

    const missingField = fields
      .filter((item) => isMissing(item?.value))
      .map((data) => data.key);

    if (missingField.length > 0) {
      return res.status(400).json({
        message: "All fields are required",
        missing: missingField,
      });
    }

    // Check if email already exists
    const [existing] = await db.execute(
      `SELECT id FROM users WHERE email = ?`,
      [email],
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Verify business exists
    const [businessRows] = await db.execute(
      `SELECT id FROM business WHERE id = ?`,
      [business_id],
    );
    if (businessRows.length === 0) {
      return res.status(400).json({ message: "Referenced business not found" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role || "agent";

    const query = `
      INSERT INTO users (id, business_id, name, email, password, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.execute(query, [
      id,
      String(business_id),
      name,
      email,
      hashedPassword,
      userRole,
    ]);

    return res.status(201).json({
      message: "User created successfully",
      user: { id, business_id, name, email, role: userRole },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * from users`);
    console.log("raw", rows);
    return res.status(200).json({ message: "got all users", data: rows });
  } catch (error) {
    console.error("error in getting role", error);
    return res.status(400).json({ message: "error users" });
  }
};

export const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(`SELECT * FROM users WHERE id = ?`, [id]);
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

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: "Missing id parameter" });

    const [result] = await db.execute(`DELETE FROM users WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted", deletedId: id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message });
  }
};
