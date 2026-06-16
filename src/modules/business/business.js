import db from "../../config/db.js";
import { v4 as uuidv4 } from 'uuid';

db.run(
  `
     CREATE TABLE IF NOT EXISTS business (
      id TEXT PRIMARY KEY,
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
    const { name, email, phone } = req?.body;
    const id = uuidv4();

    if (!name || !email || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // console.log(name, email, phone);
    const createQuery =
      "INSERT INTO business (id, name, email, phone) VALUES (?,?,?,?)";

    db.run(createQuery, [id, name, email, phone], (err) => {
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

export const getBusiness = (req, res) => {
  try {
    db.all("SELECT * FROM business", (err, rows) => {
      if (err) {
        console.error("Error fetching businesses:", err.message);
        return res.status(500).json({
          message: "Error fetching businesses",
          error: err.message,
        });
      }

      return res.status(200).json({
        message: "Businesses fetched successfully",
        data: rows,
      });
    });
  } catch (error) {
    console.error("Server error:", error.message);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
