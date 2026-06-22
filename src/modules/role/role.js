// modules/role/role.js
import db from "../../config/db.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

// ─── Role Hierarchy ───────────────────────────────────────────────────────────
// Defines which roles a creator is allowed to assign.
// super_admin → can create: owner, admin, agent  (for ANY business)
// owner       → can create: admin, agent         (only within their own business)
// admin       → can create: agent                (only within their own business)
// agent       → cannot create anyone

const ROLE_CREATION_RIGHTS = {
  super_admin: ["owner", "admin", "agent"],
  owner: ["admin", "agent"],
  admin: ["agent"],
  agent: [],
};

const VALID_ROLES = ["super_admin", "owner", "admin", "agent"];

// ─── POST /user ───────────────────────────────────────────────────────────────
// Creates a new user under a business.
// The caller must have sufficient role permissions.

export const createUser = async (req, res) => {
  try {
    const creatorRole = req.user?.role;
    const creatorBusinessId = req.user?.business_id;

    let { business_id, name, email, password, role } = req.body;

    // ── Validate required fields ──────────────────────────────────────────
    const missing = [];
    if (!name) missing.push("name");
    if (!email) missing.push("email");
    if (!password) missing.push("password");
    if (!role) missing.push("role");

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Missing required fields.",
        missing,
      });
    }

    // ── Validate the target role value ────────────────────────────────────
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}.`,
      });
    }

    // ── Prevent creating another super_admin ──────────────────────────────
    if (role === "super_admin") {
      return res.status(403).json({
        message: "Cannot create another super_admin.",
      });
    }

    // ── Check creator has permission to assign this role ──────────────────
    const allowedRoles = ROLE_CREATION_RIGHTS[creatorRole] || [];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: `As a '${creatorRole}', you cannot create a user with role '${role}'.`,
        allowed_roles_you_can_create: allowedRoles,
      });
    }

    // ── Determine business_id ─────────────────────────────────────────────
    // super_admin must provide business_id explicitly.
    // owner and admin always use their own business_id.
    let targetBusinessId;

    if (creatorRole === "super_admin") {
      if (!business_id) {
        return res.status(400).json({
          message: "super_admin must provide a business_id when creating a user.",
        });
      }
      targetBusinessId = business_id;
    } else {
      // owner/admin can only create users inside their own business
      if (!creatorBusinessId) {
        return res.status(400).json({
          message: "Your account is not linked to any business.",
        });
      }
      targetBusinessId = creatorBusinessId;

      // If they tried to pass a different business_id, block it
      if (business_id && business_id !== creatorBusinessId) {
        return res.status(403).json({
          message: "You can only create users within your own business.",
        });
      }
    }

    // ── Verify the target business exists ─────────────────────────────────
    const [businessRows] = await db.execute(
      `SELECT id FROM business WHERE id = ?`,
      [targetBusinessId]
    );
    if (businessRows.length === 0) {
      return res.status(404).json({ message: "Business not found." });
    }

    // ── Check email uniqueness ────────────────────────────────────────────
    const [existingUser] = await db.execute(
      `SELECT id FROM users WHERE email = ?`,
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // ── Create user ───────────────────────────────────────────────────────
    const id = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, 12);

    await db.execute(
      `INSERT INTO users (id, business_id, name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, targetBusinessId, name, email, hashedPassword, role]
    );

    console.log(`[ROLE] User created: ${email} (role: ${role}) in business: ${targetBusinessId}`);

    return res.status(201).json({
      message: "User created successfully.",
      user: {
        id,
        business_id: targetBusinessId,
        name,
        email,
        role,
      },
    });
  } catch (error) {
    console.error("[ROLE] createUser error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Email already exists." });
    }
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// ─── GET /user ────────────────────────────────────────────────────────────────
// super_admin sees ALL users.
// owner/admin sees only users in their own business.

export const getUser = async (req, res) => {
  try {
    const { role, business_id } = req.user;

    let rows;

    if (role === "super_admin") {
      [rows] = await db.execute(
        `SELECT id, business_id, name, email, role, created_at FROM users ORDER BY created_at DESC`
      );
    } else {
      if (!business_id) {
        return res.status(400).json({ message: "Your account has no associated business." });
      }
      [rows] = await db.execute(
        `SELECT id, business_id, name, email, role, created_at FROM users WHERE business_id = ? ORDER BY created_at DESC`,
        [business_id]
      );
    }

    return res.status(200).json({
      message: "Users fetched successfully.",
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("[ROLE] getUser error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─── GET /user/:id ────────────────────────────────────────────────────────────

export const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, business_id } = req.user;

    const [rows] = await db.execute(
      `SELECT id, business_id, name, email, role, created_at FROM users WHERE id = ?`,
      [id]
    );
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Non-super_admin can only view users within their business
    if (role !== "super_admin" && user.business_id !== business_id) {
      return res.status(403).json({ message: "Access denied." });
    }

    return res.status(200).json({ message: "User fetched.", data: user });
  } catch (error) {
    console.error("[ROLE] getSingleUser error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─── DELETE /user/delete/:id ──────────────────────────────────────────────────

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, business_id, id: callerId } = req.user;

    if (!id) return res.status(400).json({ message: "Missing id parameter." });

    // Prevent self-deletion
    if (id === callerId) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    // Fetch the target user to enforce cross-business restrictions
    const [rows] = await db.execute(
      `SELECT id, business_id, role FROM users WHERE id = ?`,
      [id]
    );
    const targetUser = rows[0];

    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Non-super_admin can only delete users inside their own business
    if (role !== "super_admin" && targetUser.business_id !== business_id) {
      return res.status(403).json({ message: "Access denied. Cannot delete user from another business." });
    }

    // Prevent deleting someone with a higher or equal role
    const allowedTargets = ROLE_CREATION_RIGHTS[role] || [];
    if (!allowedTargets.includes(targetUser.role)) {
      return res.status(403).json({
        message: `As a '${role}', you cannot delete a user with role '${targetUser.role}'.`,
      });
    }

    const [result] = await db.execute(`DELETE FROM users WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ message: "User deleted successfully.", deletedId: id });
  } catch (error) {
    console.error("[ROLE] deleteUser error:", error);
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};
