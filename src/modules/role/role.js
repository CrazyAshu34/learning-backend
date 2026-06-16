import db from "../../config/db.js";
import crypto from "crypto";

// important
db.run(`PRAGMA foreign_keys = ON`);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    business_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'agent',
    FOREIGN KEY (business_id) REFERENCES business(id)
  )
`);

export const createUser = async (req, res) => {
  try {
    const { business_id, name, email, password, role } = req.body;

    const id = crypto.randomUUID();

    if (!business_id || !name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const query = `
      INSERT INTO users
      (id, business_id, name, email, password, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
      query,
      [
        id,
        business_id,
        name,
        email,
        password, // hash later with bcrypt
        role || "agent",
      ],
      function (err) {
        if (err) {
          return res.status(400).json({
            message: err.message,
          });
        }

        res.status(201).json({
          message: "User created",
          userId: id,
        });
      },
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getUser = async (req, res) => {
  try {
    db.all(`SELECT * from users`, (err, raw) => {
      if (err) {
        console.log(err);
      } else {
        console.log("raw", raw);
        res.status(200).json({ message: "got all users", data: raw });
      }
    });
  } catch (error) {
    console.error("error in getting role");
    res.status(400).json({ message: "error users" });
  }
};
