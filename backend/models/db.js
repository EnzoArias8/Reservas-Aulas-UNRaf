import mysql from "mysql2/promise"

const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "drleoni971",
  database: "ReservaAulasUnraf",
})

export default db
