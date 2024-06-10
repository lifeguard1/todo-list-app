import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./todo-app.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT,
    content TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
  
});

export default db;
