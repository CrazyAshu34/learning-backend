import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./test.db");

db.run(`CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NULL, 
        password TEXT NOT NULL
    )`);

export default db;
