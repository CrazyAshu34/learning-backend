import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbHost = process.env.DB_HOST || "localhost";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME || "crm_app";
const dbPort = process.env.DB_PORT || 3306;

const db = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const initDB = async () => {
  // Verify and create database first
  const connection = await mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    port: dbPort,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.end();

  console.log(`Database '${dbName}' verified/created.`);

  // Create table 'business'
  await db.query(`
    CREATE TABLE IF NOT EXISTS business (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(255) NOT NULL,
      plan VARCHAR(50) DEFAULT 'free',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Business table initialized.");

  // Check if plan column exists in business table (in case table was created previously without plan column)
  try {
    const [columns] = await db.query("SHOW COLUMNS FROM business LIKE 'plan'");
    if (columns.length === 0) {
      await db.query("ALTER TABLE business ADD COLUMN plan VARCHAR(50) DEFAULT 'free'");
      console.log("Added 'plan' column to business table.");
    }
  } catch (err) {
    console.error("Error updating business table schema:", err.message);
  }

  // Create table 'users'
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      business_id VARCHAR(255) NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'agent',
      FOREIGN KEY (business_id) REFERENCES business(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Users table initialized.");

  // Create table 'customers'
  await db.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(255),
      dob VARCHAR(255),
      assignAgent VARCHAR(255),
      actionStage VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Customers table initialized.");

  // Create table 'subscriptions'
  await db.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id VARCHAR(255) PRIMARY KEY,
      business_id VARCHAR(255) NOT NULL,
      plan_name VARCHAR(50) NOT NULL DEFAULT 'free',
      status ENUM('pending', 'active', 'expired') NOT NULL DEFAULT 'pending',
      amount DECIMAL(10, 2) NOT NULL,
      provider_order_id VARCHAR(255) NOT NULL UNIQUE,
      provider_payment_id VARCHAR(255) NULL,
      start_date DATETIME NULL,
      expiry_date DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES business(id) ON DELETE CASCADE
    )
  `);
  console.log("Subscriptions table initialized.");

  // payment
  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      status ENUM('pending','paid','failed') DEFAULT 'pending',
      payment_provider VARCHAR(50),
      provider_order_id VARCHAR(255),
      provider_payment_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) 
  `);
  console.log("--orders table initialized--");
};

export default db;
