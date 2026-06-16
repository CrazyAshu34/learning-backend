import db from "../config/db";

db.run(
  `CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NULL, 
        password TEXT NOT NULL
    )`,
  (err) => {
    if (err) {
      console.error("got error while creating auth table", err.message);
    } else {
      console.log("auth table ready.");
    }
  },
);
