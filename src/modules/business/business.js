import db from "../../config/db.js";

db.run(
  `
     CREATE TABLE IF NOT EXISTS business (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
  (err) => {
    if (err) {
      console.error("got error", err.message);
    } else {
      console.log("Businesses table ready.");
    }
  },
);

export const createBusiness = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }
    console.log(name, email, phone);
 db.get(
  "SELECT sql FROM sqlite_master WHERE type='table' AND name='business'",
  (err, row) => {
    console.log(row.sql);
  }
);

    const createQuery =
      "INSERT INTO business (name, email, phone) VALUES (?,?,?)";

    db.run(createQuery, [name, email, phone], (err) => {
      if (err) {
        console.log(err);
        return res
          .status(400)
          .json({ message: "error creating business", err: err.message });
      } else {
        console.log("business created successfully");
        res
          .status(201)
          .json({ message: "success", data: { name, email, phone } });
      }
    });
  } catch (error) {
    console.error("error", error.message);
    res.status(500).json({ message: "server error", err: error.message });
  }
};
