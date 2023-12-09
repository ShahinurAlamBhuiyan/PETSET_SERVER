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

app.get("/", (req, res) => {
    res.json("hello this is the backend!")
})


// QUERY FOR MEMORIES --->
app.get("/memories", (req, res) => {
    const q = "SELECT * FROM memories"
    db.query(q, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})

app.listen(8800, () => {
    console.log('Connect to backend !')
})

