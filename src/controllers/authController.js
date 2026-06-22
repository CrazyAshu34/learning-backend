import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

function hasPasswordFn(password) {
  return bcrypt.hash(password, 10);
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
    {
      expiresIn: "1h",
    }
  );
};


export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (e) {
    console.error("Token verification error: ", e.message);
    return null;
  }
};

// access token
export const authMiddleWare = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
};

// refresh token
// ----------------

// create user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashPassword = await hasPasswordFn(password);
    const id = crypto.randomUUID();

    const query = `INSERT INTO users (id, name, email, password) VALUES(?,?,?,?)`;
    await db.execute(query, [id, name, email, hashPassword]);

    console.log("User registered successfully:", name);
    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (e) {
    console.error("registration error:, ", e.message);
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "User already exists",
      });
    }
    return res
      .status(500)
      .json({ message: "user cannot register", error: e.message });
  }
};

//  login user ==>
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Email and password are required",
      });
    }

    const [rows] = await db.execute(`SELECT * FROM users WHERE email = ?`, [
      email,
    ]);
    const user = rows[0];

    // No user found with this email
    if (!user) {
      return res.status(401).json({
        ok: false,
        message: "Invalid email or password",
      });
    }

    // Now safely compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        ok: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user);
    console.log("token--->", { token });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    console.log("Login successful, token:", password);

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      ok: false,
      message: "Something went wrong",
    });
  }
};
