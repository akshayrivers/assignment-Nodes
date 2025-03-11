// so here we need to create the database with the given constraints
// Description: Create a schools table in MySQL with the following fields:
// id (Primary Key)
// name (VARCHAR)
// address (VARCHAR)
// latitude (FLOAT)
// longitude (FLOAT)
import mysql from "mysql2";
import { config } from "dotenv";
config();

console.log(process.env.DB_NAME)
const pool = mysql.createPool({
    uri: process.env.DB_URI,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS schools (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(500) NOT NULL,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL
    );
`;

pool.query(createTableQuery, (err, results) => {
    if (err) {
        console.error("Error creating table:", err);
    } else {
        console.log("Schools table created successfully.");
    }
    pool.end();
});

