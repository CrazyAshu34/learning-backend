// import sqlite3 from "sqlite3";
// let sql;

// // Database connection
// const db = new sqlite3.Database("./test.db", (err) => {
//   if (err) {
//     console.error("Database connection error:", err.message);
//   } else {
//     console.log("✅ Database connected successfully");
//   }
// });

// // create table
// const createTable = `CREATE TABLE mytable (
//     CustomerID INTEGER PRIMARY KEY AUTOINCREMENT,
//     FirstName VARCHAR(50) NOT NULL,
//     LastName VARCHAR(50) NOT NULL,
//     Email VARCHAR(100) UNIQUE,
//     JoinDate DATE DEFAULT CURRENT_DATE
// );`;

// // Execute the create table statement
// db.run(createTable, (err) => {
//   if (err) {
//     console.error("Error creating table:", err.message);
//   } else {
//     console.log("✅ Table 'Customers' created successfully");
//   }
//   // Table create hone ke baad hi insert karo
//   insertData();
// });
// // -----------
// function insertData() {
//   const values = ["agaddddin", "siddddngh", "ddddd@gmail.com", "2024-06-01"];

//   const insertSQL = `
//     INSERT INTO mytable (FirstName, LastName, Email, JoinDate)
//     VALUES (?, ?, ?, ?)
//   `;

//   db.run(insertSQL, values, function (err) {
//     if (err) {
//       console.error("Error inserting data:", err.message);
//     } else {
//       console.log("Data inserted successfully");
//     }

//     verifyData();
//   });
// }

// function verifyData() {
//   const updateData = `SELECT * from mytable`;

//   db.all(updateData, [], (err, realData) => {
//     if (err) {
//       console.error("check data failed:", err.message);
//     } else {
//       console.table(realData);
//     }
//     // close database connection
//     db.close((err) => {
//       if (err) {
//         console.error("error closing database:", err.message);
//       } else console.log("🔒 Database closed");
//     });
//   });
// }
