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
    password: `${process.env.db_pass}`,
    database: `${process.env.db_name}`
})

app.use(express.json())

app.get("/", (req, res) => {
    res.json("Welcome to backend!")
})


// QUERY FOR USERS ------------------------------------------
// get all users
app.get('/users', async (req, res) => {
    const q = "SELECT * FROM user WHERE role='user'"
    db.query(q, (error, results) => {
        if (error) return res.json(error)
        console.log(results)
        return res.json(results)
    })
})

// delete user
app.delete('/user/:id', async (req, res) => {
    const userId = req.params.id;
    const q = "DELETE FROM user WHERE u_id = ?"
    db.query(q, userId, (err, data) => {
        if (err) return res.json(err)
        return res.json('user deleted!')
    })
})



// -----------------------------------------------------------

// QUERY FOR  AUTHENTICATION ---------------------------------------
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
// ---------------------------------------------------------------------------

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

// get single service
app.get("/service/:id", (req, res) => {
    const serviceId = req.params.id;
    const q = "SELECT * FROM services WHERE s_id = ?"
    db.query(q, serviceId, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})

// get service and doctor by id
app.get("/services/:id", (req, res) => {
    const serviceID = req.params.id;
    const q = "SELECT services.s_id, services.title, services.details,animalspecialist.dr_id, animalspecialist.dr_name, animalspecialist.dr_email, animalspecialist.dr_contact, animalspecialist.specialise, animalspecialist.experience_yr, animalspecialist.visiting_fees, animalspecialist.dr_address FROM services JOIN animalspecialist ON services.dr_id = animalspecialist.dr_id WHERE services.s_id = ?"
    // const q = "SELECT * FROM services WHERE m_id = ?"
    db.query(q, serviceID, (err, data) => {
        if (err) {
            // console.log(err)
            return res.json(err)
        }
        return res.json(data)
    })
})

// delete service
app.delete("/service/:id", (req, res) => {
    const serviceId = req.params.id;
    const q = "DELETE FROM services WHERE s_id = ?"

    db.query(q, serviceId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('service deleted.')
        return res.json('service deleted successfully!')
    })
})

// // add service
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


// DOCTOR APPOINTMENT
// get doctor
app.get("/doctor/:id", (req, res) => {
    const doctorId = req.params.id;
    const q = "SELECT * FROM animalspecialist WHERE dr_id = ?"
    db.query(q, doctorId, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})


// book appointment
app.post('/appointment', (req, res) => {
    const q = "INSERT INTO appointment (`u_id`, `dr_id`, `a_id`, `appointment_date`, `s_id`, `owner_name`, `owner_email`, `contact`, `fees`) VALUES (?)"

    const values = [
        req.body.u_id,
        req.body.dr_id,
        req.body.a_id,
        req.body.appointment_date,
        req.body.s_id,
        req.body.owner_name,
        req.body.owner_email,
        req.body.contact,
        req.body.fee
    ]

    db.query(q, [values], (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Appointment added')
        return res.json('Appointment added successfully!')
    })
})


// STORE QUERY ------------------------------------
// Get product by type name
app.get('/product', (req, res) => {
    const q = 'SELECT * FROM petfoodmedistore WHERE product_type = ?';
    const productType = req.query.product_type;

    db.query(q, [productType], (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

// Get product by id
app.get("/product/:id", (req, res) => {
    const productId = req.params.id;
    const q = "SELECT * FROM petfoodmedistore WHERE product_id = ?"
    db.query(q, productId, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})


// SEARCH PRODUCT
app.get('/search', (req, res) => {
    const searchQuery = req.query.query.toLowerCase();
    const q = `
      SELECT *
      FROM petfoodmedistore
      WHERE LOWER(product_name) LIKE ?
         OR LOWER(product_description) LIKE ?
    `;
    const params = [`%${searchQuery}%`, `%${searchQuery}%`];

    db.query(q, params, (err, results) => {
        if (err) return res.json(err);
        return res.json(results);
    });
});


app.listen(8800, () => {
    console.log('Connect to backend !')
})

