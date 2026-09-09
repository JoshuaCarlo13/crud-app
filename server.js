require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error:', err));

console.log(typeof process.env.DB_PASSWORD);
console.log(process.env.DB_PASSWORD);

app.use(express.json());
app.use(express.static("public"));

// CREATE
app.post("/api/items", async (req, res) => {
    try {
        const { name, description, quantity } = req.body;

        const result = await pool.query(
            `INSERT INTO items (name, description, quantity)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, description, quantity || 0]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create item" });
    }
});

// READ - Get all items
app.get("/api/items", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM items ORDER BY id ASC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve items" });
    }
});

// READ - Get one item
app.get("/api/items/:id", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM items WHERE id = $1",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Item not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve item" });
    }
});

// UPDATE
app.put("/api/items/:id", async (req, res) => {
    try {
        const { name, description, quantity } = req.body;

        const result = await pool.query(
            `UPDATE items
             SET name = $1,
                 description = $2,
                 quantity = $3
             WHERE id = $4
             RETURNING *`,
            [name, description, quantity, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Item not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update item" });
    }
});

// DELETE
app.delete("/api/items/:id", async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM items WHERE id = $1 RETURNING *",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Item not found" });
        }

        res.json({
            message: "Item deleted successfully",
            item: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete item" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});