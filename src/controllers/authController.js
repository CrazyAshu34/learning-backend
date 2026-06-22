import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      business_id: user.business_id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
};

// ─── POST /register ──────────────────────────────────────────────────────────
// Bootstrap-only: creates the ONE super_admin for the entire CRM system.
// Will reject if a super_admin already exists.

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "name, email, and password are required.",
      });
    }

    // Guard: only one super_admin is ever allowed
    const [existing] = await db.execute(
      `SELECT id FROM users WHERE role = 'super_admin' LIMIT 1`
    );

    if (existing.length > 0) {
      return res.status(403).json({
        message:
          "A super_admin already exists. Self-registration is disabled. Contact your administrator.",
      });
    }

    const id = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);

    await db.execute(
      `INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, 'super_admin')`,
      [id, name, email, hashedPassword]
    );

    console.log(`[AUTH] super_admin created: ${email}`);
    return res.status(201).json({
      message: "Super admin registered successfully. You can now log in.",
    });
  } catch (error) {
    console.error("[AUTH] register error:", error.message);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email already exists." });
    }
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// ─── POST /login ─────────────────────────────────────────────────────────────
// Unified login for ALL roles: super_admin, owner, admin, agent.

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [rows] = await db.execute(`SELECT * FROM users WHERE email = ?`, [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(user);

    // Strip password before sending
    const { password: _, ...safeUser } = user;

    console.log(`[AUTH] Login: ${user.email} (role: ${user.role})`);
    return res.status(200).json({
      message: "Login successful.",
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error("[AUTH] login error:", error.message);
    return res.status(500).json({ message: "Server error." });
  }
};
