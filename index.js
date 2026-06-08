// const sqlite3 = require("sqlite3").verbose();
import sqlite3 from "sqlite3";

let sql;

const db = new sqlite3.Database(
  "./test.db",
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) return console.log(err.message);
  },
);

// create table
// sql = `CREATE TABLE user(id INTEGER PRIMARY KEY, first_name, last_name, username, password, email)`;
// db.run(sql);

//drop table
// db.run("DROP TABLE USER");

// // insert data into table
// sql = `INSERT INTO user(first_name, last_name, username, password, email) VALUES (?,?,?,?,?)`;
// db.run(
//   sql,
//   ["another brother", "singh", "again33", "101", "ashu101@gmail.com"],
//   (err) => {
//     if (err) {
//       return console.error(err?.message);
//     }
//   },
// );

// UPDATE USER
db.run(
  "UPDATE users SET first_name = ? WHERE id = ?",
  ["MAGAR_MUCH", 1],
  function (err) {
    if (err) return console.error(err.message);

    console.log("Rows updated:", this.changes);
  },
);

// // SELECT USER
// sql = `SELECT * FROM USER`;
// db.all(sql, [], (err, rows) => {
//   if (err) return console.error(err.message);
//   rows?.forEach((arr) => {
//     console.log(arr);
//   });
// });

// // DELETE USER
// sql = `DELETE FROM USER WHERE ID=?`;
// db.run(sql, [1], (err) => {
//   if (err) {
//     console.error(err.message);
//   } else {
//     console.log("success ");
//   }
// });

// db.all(sql, [], (err, rows) => {
//   if (err) return console.error(err.message);
//   rows?.forEach((arr) => {
//     console.log(arr);
//   });
// });


// db.close();
