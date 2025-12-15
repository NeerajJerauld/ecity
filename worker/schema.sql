DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT,
  name TEXT
);

INSERT INTO users (username, password, role, name) VALUES ('owner', 'admin', 'owner', 'Neeraj Jerauld');
INSERT INTO users (username, password, role, name) VALUES ('driver', 'password', 'driver', 'Ramesh Kumar');
