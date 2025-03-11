import express from "express";
import { z } from "zod";
import mysql from "mysql2";
import { config } from "dotenv";
config();

const app = express();
app.use(express.json());

const pool = mysql.createPool({
    uri: process.env.DB_URI,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
});

const schoolSchema = z.object({
    name: z.string().min(3),
    address: z.string().min(3),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
});
app.delete("/deleteAllSchools", async (req, res) => {
    try {
        pool.query("TRUNCATE TABLE schools");
        res.status(200).json({ message: "All schools deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Database error", details: err });
    }
});

app.post("/batch/addSchool", async (req, res) => {
    if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Expected an array of schools" });
    }

    const schools = req.body;

    // We Validate all schools
    for (const school of schools) {
        const validationResult = schoolSchema.safeParse(school);
        if (!validationResult.success) {
            return res.status(400).json({ error: validationResult.error.errors });
        }
    }

    const query = "INSERT INTO schools (name, address, latitude, longitude) VALUES ?";
    const values = schools.map(s => [s.name, s.address, s.latitude, s.longitude]);

    try {
        pool.query(query, [values]);
        res.status(201).json({ message: "Schools added successfully" });
    } catch (err) {
        res.status(500).json({ error: "Database error", details: err });
    }
})
app.post("/addSchool", (req, res) => {
    const validationResult = schoolSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.errors });
    }

    const { name, address, latitude, longitude } = req.body;
    const query = "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";

    pool.query(query, [name, address, latitude, longitude], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.status(201).json({ message: "School added successfully", id: results.insertId });
    });
});

// Function to calculate distance using Euclidean formula 
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    return Math.sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2);
};

app.get("/listSchools", (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    const query = "SELECT * FROM schools";

    pool.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }

        // Calculating the distances and sorting
        const sortedSchools = results
            .map(school => ({
                ...school,
                distance: calculateDistance(userLat, userLon, school.latitude, school.longitude)
            }))
            .sort((a, b) => a.distance - b.distance)

        res.status(200).json(sortedSchools);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
