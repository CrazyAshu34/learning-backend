import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./test.db", (err) => {
  if (err) {
    console.error("DB connection error:", err.message);
  } else {
    console.log("Connected to database");
  }
});

export default db;
