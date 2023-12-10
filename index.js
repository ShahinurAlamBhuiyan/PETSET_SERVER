import express from 'express'
import mysql from 'mysql'
import cors from 'cors'
import { configDotenv } from "dotenv";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt'

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
    res.json("Welcome to backend!")
})

// QUERY FOR  AUTHENTICATION ----------------------------------------
// sign-up
app.post('/sign-up', async (req, res) => {
    try {
        // Check if the email already exists
        const checkEmailQuery = 'SELECT * FROM user WHERE email = ?';
        db.query(checkEmailQuery, [req.body.email], async (error, results, fields) => {
            if (error) {
                console.error(error);
                res.status(500).send('Error checking email availability');
                return;
            }

            if (results.length > 0) {
                // Email already exists, return an error response
                res.status(400).send('Email is already in use');
                return;
            }

            // Proceed with user registration
            const u_id = uuidv4(); // Generate a unique ID
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const insertUserQuery =
                'INSERT INTO user (`u_id`, `email`, `full_name`, `image_URL`, `role`, `password`) VALUES (?)';

            const values = [
                u_id,
                req.body.email,
                req.body.firstName + " " + req.body.lastName,
                req.body.image_URL,
                req.body.role,
                hashedPassword, // Use the hashed password
            ];

            db.query(insertUserQuery, [values], (insertError, insertResults, insertFields) => {
                if (insertError) {
                    console.error(insertError);
                    res.status(500).send('Error storing user data');
                } else {
                    console.log('User data stored successfully');
                    res.status(200).send('User data stored successfully');
                }
            });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error storing user data');
    }
});
// sign-in
app.post('/sign-in', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Retrieve user from the database based on the email
        const q = 'SELECT * FROM user WHERE email = ?';
        db.query(q, [email], async (error, results, fields) => {
            if (error) {
                console.error(error);
                res.status(500).send('Error retrieving user data');
                return;
            }

            // Check if the user exists
            if (results.length === 0) {
                res.status(404).send('User not found');
                return;
            }

            const user = results[0];

            // Compare the entered password with the hashed password in the database
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                // Passwords match - user authenticated
                console.log('User authenticated successfully')
                return res.json(results)
            } else {
                // Passwords do not match - authentication failed
                res.status(401).send('Invalid credentials');
                return
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error during sign-in');
    }
});
// -------------------------------------------------------------------


// QUERY FOR MEMORIES --------------------------------------------------------
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
    db.query(q, memoryId, (err, data) => {
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
// ----------------------------------------------------------------------------

// QUERY FOR SERVICES --------------------------------------------------------
// get all
app.get("/services", (req, res) => {
    const q = "SELECT DISTINCT s_id, title, details FROM services"
    db.query(q, (err, data) => {
        if (err) return res.json(err)
        // console.log(first)
        return res.json(data)
    })
})

// // get service by id
app.get("/services/:id", (req, res) => {
    const serviceID = req.params.id;
    const q = "SELECT services.s_id, services.title, services.details, animalspecialist.dr_name, animalspecialist.dr_email, animalspecialist.dr_contact, animalspecialist.specialise, animalspecialist.experience_yr, animalspecialist.visiting_fees, animalspecialist.dr_address FROM services JOIN animalspecialist ON services.dr_id = animalspecialist.dr_id WHERE services.s_id = ?"
    // const q = "SELECT * FROM services WHERE m_id = ?"
    db.query(q, serviceID, (err, data) => {
        if (err) {
            // console.log(err)
            return res.json(err)
        }
        return res.json(data)
    })
})


// // add memory
// app.post("/memories", (req, res) => {
//     const q = "INSERT INTO memories (`m_id`, `u_id`, `title`, `details`, `img_URL`, `created_date`) VALUES (?)"

//     const values = [
//         req.body.m_id,
//         req.body.u_id,
//         req.body.title,
//         req.body.details,
//         req.body.img_URL,
//         req.body.created_date,
//     ]

//     db.query(q, [values], (err, data) => {
//         if (err) return res.json(err)
//         if (data) console.log('Memory added')
//         return res.json('memories added successfully!')
//     })
// })
// // delete memory
// app.delete("/memories/:id", (req, res) => {
//     const memoryId = req.params.id;
//     const q = "DELETE FROM memories WHERE m_id = ?"

//     db.query(q, memoryId, (err, data) => {
//         if (err) return res.json(err)
//         if (data) console.log('Memory deleted.')
//         return res.json('memories deleted successfully!')
//     })
// })
// // update memory
// app.put("/memories/:id", (req, res) => {
//     const memoryId = req.params.id;
//     const q = "UPDATE books SET `title`=?, `details`=?, `img_url`=?, `created_date`= ? WHERE id = ?";

//     const values = [
//         req.body.title,
//         req.body.details,
//         req.body.img_URL,
//         req.body.created_date,
//     ]

//     db.query(q, [...values, memoryId], (err, data) => {
//         if (err) return res.json(err)
//         if (data) console.log('Memory Updated.')
//         return res.json('memories updated successfully!')
//     })
// })
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------


app.listen(8800, () => {
    console.log('Connect to backend !')
})

