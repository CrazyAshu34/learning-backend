import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// create user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (name, email, password) VALUES(?,?,?)`,
      [name, email, hashPassword],
      (e) => {
        if (e) {
          console.log(e);
          return res.status(400).json({
            message: "User already exists",
          });
        } else {
          res.status(201).json({
            message: "User registered successfully",
          });
        }
      },
    );

    console.log(name, email, password);
  } catch (e) {
    console.error("registration error:, ", e.message);
    res
      .status(500)
      .json({ message: "user cannot register", message: e.message });
  }
};
// export const login = () => {};
