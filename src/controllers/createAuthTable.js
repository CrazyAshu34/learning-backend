import db from "../config/db.js";

const createTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        business_id VARCHAR(255) NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE, 
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'agent'
      )
    `);
    console.log("auth table ready.");
  } catch (err) {
    console.error("got error while creating auth table", err.message);
  }
};

createTable();
