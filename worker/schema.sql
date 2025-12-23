DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  permissions TEXT DEFAULT 'basic',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, role, name, permissions) VALUES ('owner', 'admin', 'owner', 'Neeraj Jerauld', 'all');
INSERT INTO users (username, password, role, name, permissions) VALUES ('driver', 'password', 'driver', 'Ramesh Kumar', 'basic');

-- Vehicles Table
DROP TABLE IF EXISTS vehicles;
CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL,
  model TEXT NOT NULL,
  capacity TEXT,
  status TEXT DEFAULT 'available',
  driver_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);
