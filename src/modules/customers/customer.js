import db from "../../config/db.js";
import { v4 as uuidv4 } from "uuid";
// import { isMissing } from "../../utils.js";

db.run(
  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
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
    const id = uuidv4();

    const { name, email, phone, dob, assignAgent, actionStage } = req.body;

    db.run(
      `INSERT INTO customers (id, name, email, phone, dob, assignAgent, actionStage) VALUES (?,?,?,?,?,?,?)`,
      [id, name, email, phone, dob, assignAgent, actionStage],
      function (err) {
        if (err) {
          console.error("Insert error:", err);
          return res
            .status(400)
            .json({ message: "Customer not created", error: err.message });
        }

        return res.status(201).json({
          message: "Customer created",
          data: {
            id,
            name,
            email,
            phone,
            dob,
            assignAgent,
            actionStage,
          },
        });
      },
    );
  } catch (error) {
    console.error("Error in createCustomer:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getAllCustomer = async (req, res) =>{
      try{
        db.all(`
          SELECT * FROM customers
          `, (e)=>{
           if(e){
            console.log(e)
            return 
           }
          })
      }
}