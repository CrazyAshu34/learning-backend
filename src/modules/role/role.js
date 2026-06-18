import db from "../../config/db.js";
import crypto from "crypto";
import { isMissing } from "../../utils.js";

// important
db.run(`PRAGMA foreign_keys = ON`);

// Ensure users.business_id uses the same type as business.id (TEXT)
db.all("PRAGMA table_info(users)", (err, cols) => {
  if (err) return console.error("PRAGMA table_info error:", err.message);

  const businessCol = (cols || []).find((c) => c.name === "business_id");

  if (!businessCol) {
    // Table doesn't exist or column missing — create table with TEXT business_id
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'agent',
        FOREIGN KEY (business_id) REFERENCES business(id)
      )
    `);
    return;
  }

  // If the existing column type is not TEXT, migrate the table
  if (businessCol.type.toUpperCase() !== "TEXT") {
    console.log("Migrating users.business_id to TEXT to match business.id...");
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      db.run(
        `CREATE TABLE IF NOT EXISTS users_new (
          id TEXT PRIMARY KEY,
          business_id TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'agent',
          FOREIGN KEY (business_id) REFERENCES business(id)
        )`
      );

      db.run(
        `INSERT INTO users_new (id, business_id, name, email, password, role)
         SELECT id, CAST(business_id AS TEXT), name, email, password, role FROM users`,
        (insertErr) => {
          if (insertErr) return console.error("Migration insert error:", insertErr.message);

          db.run("DROP TABLE users", (dropErr) => {
            if (dropErr) return console.error("Drop old users error:", dropErr.message);

            db.run("ALTER TABLE users_new RENAME TO users", (renameErr) => {
              if (renameErr) return console.error("Rename users_new error:", renameErr.message);
              db.run("COMMIT", (commitErr) => {
                if (commitErr) return console.error("Commit error:", commitErr.message);
                console.log("Migration completed.");
              });
            });
          });
        }
      );
    });
  }
});

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
      ?.filter((item) => isMissing(item?.value))
      ?.map((data) => data.key);

    if (missingField.length > 0) {
      return res.status(400).json({
        message: "All fields are required",
        missingIs: missingField,
      });
    }

    // Normalize types: business_id and password should be stored as strings
    business_id = String(business_id);
    password = String(password);

    // Ensure referenced business exists
    db.get(`SELECT id FROM business WHERE id = ?`, [business_id], (e, row) => {
      if (e) return res.status(500).json({ message: e.message });

      if (!row) {
        return res.status(400).json({ message: "Referenced business not found" });
      }

      const query = `
        INSERT INTO users
        (id, business_id, name, email, password, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.run(
        query,
        [id, business_id, name, email, password, role || "agent"],
        function (err) {
          if (err) {
            return res.status(400).json({ message: err.message });
          }

          res.status(201).json({ message: "User created", userId: id });
        },
      );
    });
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

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: "Missing id parameter" });

    db.run(`DELETE FROM users WHERE id = ?`, id, function (err) {
      if (err) return res.status(500).json({ message: err.message });

      if (this.changes === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "User deleted", deletedId: id });
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
    console.error(e);
  }
};
