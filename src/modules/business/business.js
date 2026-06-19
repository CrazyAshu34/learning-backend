import db from "../../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const createBusiness = async (req, res) => {
  try {
    const { name, email, phone } = req?.body;
    const id = uuidv4();

    if (!name || !email || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const createQuery =
      "INSERT INTO business (id, name, email, phone) VALUES (?,?,?,?)";

    await db.execute(createQuery, [id, name, email, phone]);
    
    console.log("business created successfully");
    return res.status(201).json({
      message: "success",
      data: { name, email, phone },
    });
  } catch (error) {
    console.error("error creating business:", error.message);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "error creating business",
        err: "Email already exists",
      });
    }
    return res.status(500).json({ message: "server error", err: error.message });
  }
};

export const getBusiness = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM business");
    return res.status(200).json({
      message: "Businesses fetched successfully",
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching businesses:", error.message);
    return res.status(500).json({
      message: "Error fetching businesses",
      error: error.message,
    });
  }
};
