-- Migration: Create Subscriptions and update Business schema

-- Upgrade Business Table: add plan column if it doesn't exist
-- Note: In pure SQL migration files, we write the direct alter statement.
ALTER TABLE business ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';

-- Create Subscriptions Table
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
);
