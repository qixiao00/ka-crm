import mysql from "mysql2/promise";

type Pool = ReturnType<typeof mysql.createPool>;

let pool: Pool | null = null;

export function hasDatabaseConfig() {
  return Boolean(process.env.MYSQL_USER && process.env.MYSQL_PASSWORD && process.env.MYSQL_DATABASE);
}

export function getDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "192.200.15.177",
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    });
  }

  return pool;
}
