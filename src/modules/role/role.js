import db from "../../config/db.js";

// important
db.run(`PRAGMA foreign_keys = ON`);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    if (!business_id || !name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const query = `
      INSERT INTO users
      (business_id, name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
      query,
      [
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
          userId: this.lastID,
        });
        console.log(this);
      },
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
