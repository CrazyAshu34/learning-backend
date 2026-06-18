import db from "../../config/db.js";
import { v4 as uuidv4 } from "uuid";
// import { isMissing } from "../../utils.js";
const uuid = uuidv4();

db.run(
  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT (uuid),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    dob TEXT,
    assignAgent TEXT,
    actionStage TEXT)
`,
  (err) => {
    if (err) console.error(err);
    else console.log("Table created");
  },
);

export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, dob, assignAgent, actionStage } = req.body;
    console.log(name, email, phone, dob, assignAgent, actionStage);

    res
      .status(200)
      .json({ data: name, email, phone, dob, assignAgent, actionStage });
  } catch (error) {
    console.error("error in getting role");
    res.status(400).json({ message: "error users" });
  }
};
