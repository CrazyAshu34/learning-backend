// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mysecret";

// ─── protect ─────────────────────────────────────────────────────────────────
// Verifies the Bearer token and attaches decoded payload to req.user.
// req.user = { id, business_id, email, role }

export const protect = (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, business_id, email, role }
    next();
  } catch (error) {
    console.error("[AUTH] Token verification failed:", error.message);
    return res.status(401).json({ message: "Not authorized. Token is invalid or expired." });
  }
};

// ─── restrictTo ───────────────────────────────────────────────────────────────
// Route-level role guard. Pass allowed roles as arguments.
// Note: super_admin is IMPLICITLY allowed on all routes where it is not
// explicitly blocked — but we list it on routes for clarity.
//
// Usage: router.post("/user", restrictTo("super_admin", "owner"), createUser)

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${req.user?.role || "unknown"}.`,
      });
    }
    next();
  };
};