import express from 'express'
import mysql from 'mysql'
import cors from 'cors'
import { configDotenv } from "dotenv";

configDotenv('dotenv');

const app = express()
app.use(express.json());
app.use(cors())

const db = mysql.createConnection({
    host: `${process.env.db_host}`,
    user: `${process.env.db_user}`,
    password: '',
    database: `${process.env.db_name}`
})

app.use(express.json())

app.get("/", (req, res) => {
    res.json("hello this is the backend!")
})


// QUERY FOR MEMORIES ----------------------------
// get all
app.get("/memories", (req, res) => {
    const q = "SELECT * FROM memories"
    db.query(q, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})

// get memory by id
app.get("/memories/:id", (req, res) => {
    const memoryId = req.params.id;
    const q = "SELECT * FROM memories WHERE m_id = ?"
    db.query(q,memoryId, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})


// add memory
app.post("/memories", (req, res) => {
    const q = "INSERT INTO memories (`m_id`, `u_id`, `title`, `details`, `img_URL`, `created_date`) VALUES (?)"

    const values = [
        req.body.m_id,
        req.body.u_id,
        req.body.title,
        req.body.details,
        req.body.img_URL,
        req.body.created_date,
    ]

    db.query(q, [values], (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Memory added')
        return res.json('memories added successfully!')
    })
})

// delete memory
app.delete("/memories/:id", (req, res) => {
    const memoryId = req.params.id;
    const q = "DELETE FROM memories WHERE m_id = ?"

    db.query(q, memoryId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Memory deleted.')
        return res.json('memories deleted successfully!')
    })
})

// update memory
app.put("/memories/:id", (req, res) => {
    const memoryId = req.params.id;
    const q = "UPDATE books SET `title`=?, `details`=?, `img_url`=?, `created_date`= ? WHERE id = ?";

    const values = [
        req.body.title,
        req.body.details,
        req.body.img_URL,
        req.body.created_date,
    ]

    db.query(q, [...values, memoryId], (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Memory Updated.')
        return res.json('memories updated successfully!')
    })
})

app.listen(8800, () => {
    console.log('Connect to backend !')
})

