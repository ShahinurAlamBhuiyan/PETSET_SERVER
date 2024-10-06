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

// const connectionURI = `${process.env.db_connect}`
const connectionURI = `mysql://${process.env.db_user}:${process.env.db_pass}@${process.env.db_host}/${process.env.db_name}`;

const db = mysql.createConnection(connectionURI);
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database as id', db.threadId);
});

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
        // console.log(results)
        return res.json(results)
    })
})

// delete user
app.delete('/user/:id', async (req, res) => {
    const userId = req.params.id;
    console.log(userId)
    const q = "DELETE FROM user WHERE u_id = ?"
    db.query(q, userId, (err, data) => {
        if (err) return res.json(err)
        console.log('user deleted!')
        return res.json('user deleted!')
    })
})

// update user
app.put("/user/:id", (req, res) => {
    const userId = req.params.id;
    const q = "UPDATE user SET `full_name`=?, `email`=?, `image_URL`=? WHERE u_id = ?";

    const values = [
        req.body.full_name,
        req.body.email,
        req.body.image_URL,
    ]

    db.query(q, [...values, userId], (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('user data Updated.')
        return res.json('user updated successfully!')
    })
})
// -------------------------------------------------------------

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
// get all memory
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

// get memory by user id
app.get("/memories/user/:id", (req, res) => {
    const userId = req.params.id;
    const q = "SELECT * FROM memories WHERE u_id = ?"
    db.query(q, userId, (err, data) => {
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
// delete memory by u_id
app.delete("/memories/user/:id", (req, res) => {
    const userId = req.params.id;
    const q = "DELETE FROM memories WHERE u_id = ?"

    db.query(q, userId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Memory deleted.')
        return res.json('memories deleted successfully!')
    })
})
// update memory
app.put("/memories/:id", (req, res) => {
    const memoryId = req.params.id;
    const q = "UPDATE memories SET `title`=?, `details`=?, `img_URL`=? WHERE m_id = ?";

    const values = [
        req.body.title,
        req.body.details,
        req.body.img_URL,
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
    const q = "SELECT DISTINCT s_id, title, details, img_URL FROM services"
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
    const q = "SELECT services.s_id, services.title, services.details,services.created_date, services.img_URL,animalspecialist.dr_id, animalspecialist.dr_name, animalspecialist.dr_email, animalspecialist.dr_contact, animalspecialist.specialise, animalspecialist.img_URL as dr_img, animalspecialist.experience_yr, animalspecialist.visiting_fees, animalspecialist.dr_address FROM services JOIN animalspecialist ON services.dr_id = animalspecialist.dr_id WHERE services.s_id = ?"
    // const q = "SELECT * FROM services WHERE m_id = ?"
    db.query(q, serviceID, (err, data) => {
        if (err) {
            // console.log(err)
            return res.json(err)
        }
        return res.json(data)
    })
})

// get service by  doctor 
app.get("/services/doctor/:id", (req, res) => {
    const doctorID = req.params.id;
    const q = "SELECT * FROM services WHERE dr_id = ?"
    db.query(q, doctorID, (err, data) => {
        if (err) return res.json(err)

        return res.json(data)
    })
})

// add service for doctor
app.post("/services", (req, res) => {
    const q = "INSERT INTO services (`dr_id`, `s_id`, `title`, `details`, `img_URL`, `created_date`) VALUES (?)"

    const values = [
        req.body.dr_id,
        req.body.s_id,
        req.body.title,
        req.body.details,
        req.body.img_URL,
        req.body.created_date,
    ]

    db.query(q, [values], (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Service added')
        return res.json('service added successfully!')
    })
})

// Update service title, details
app.put("/services/:service_id", (req, res) => {
    const serviceId = req.params.service_id;
    const { title, details } = req.body;

    const qUpdateService = "UPDATE services SET title = ?, details = ? WHERE s_id = ?";
    db.query(qUpdateService, [title, details, serviceId], (err, result) => {
        if (err) {
            return res.json(err)
        }
        return res.json('Service updated successfully!');
    });
});

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

// Delete doctor from service subquery
app.delete("/service/doctor/:service_id/:dr_id", (req, res) => {
    const serviceId = req.params.service_id;
    const doctorId = req.params.dr_id;

    // Delete from appointment table first
    const qDeleteAppointments = "DELETE FROM appointment WHERE s_id = ? AND dr_id = ?";
    db.query(qDeleteAppointments, [serviceId, doctorId], (err, result) => {
        if (err) {
            // Handle error from the first query
            return res.json(err);
        }

        // Now, delete from services table
        const qDeleteService = "DELETE FROM services WHERE s_id = ? AND dr_id = ?";
        db.query(qDeleteService, [serviceId, doctorId], (err, results) => {
            if (err) {
                // Handle error from the second query
                return res.json(err);
            }

            return res.json(results);
        });
    });
});


// Delete doctor by dr.id
app.delete("/service/doctor/:id", (req, res) => {
    const doctorId = req.params.id;
    const q = "DELETE FROM services WHERE dr_id = ?"

    db.query(q, doctorId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('service deleted.')
        return res.json('service deleted successfully!')
    })
})

// ----------------------------------------------------------------------------



// DOCTOR  QUERY ----------------------------------------------------
// Get all doctor
app.get("/doctors", (req, res) => {
    const q = 'SELECT * FROM animalspecialist'
    db.query(q, (err, result) => {
        if (err) return res.json(err)
        return res.json(result)
    })
})

// get doctor by id
app.get("/doctor/:id", (req, res) => {
    const doctorId = req.params.id;
    const q = "SELECT * FROM animalspecialist WHERE dr_id = ?"
    db.query(q, doctorId, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})

// add doctor
app.post("/doctors", (req, res) => {
    const q = "INSERT INTO animalspecialist (`dr_id`, `dr_name`, `specialise`, `experience_yr`, `dr_degrees`, `dr_address`, `visiting_fees`, `dr_contact`,`dr_email`) VALUES (?)"

    const values = [
        req.body.dr_id,
        req.body.dr_name,
        req.body.specialise,
        req.body.experience_yr,
        req.body.dr_degrees,
        req.body.dr_address,
        req.body.visiting_fees,
        req.body.dr_contact,
        req.body.dr_email,
    ]

    db.query(q, [values], (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Doctor added')
        return res.json('doctor added successfully!')
    })
})

// delete doctor
app.delete("/doctor/:id", (req, res) => {
    const doctorId = req.params.id;
    const q = "DELETE FROM animalspecialist WHERE dr_id = ?"

    db.query(q, doctorId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Doctor deleted.')
        return res.json('doctor deleted successfully!')
    })
})
// ----------------------------------------------------------------------------


// APPOINTMENT QUERY---------------------------------------------------------
// Get all appointment
app.get('/appointments', (req, res) => {
    const q = 'SELECT * FROM appointment'
    db.query(q, (err, results) => {
        if (err) return res.json(err);
        return res.json(results);
    })
})

// Get appointment by doctor id
app.get('/appointments/doctor/:id', (req, res) => {
    const doctorId = req.params.id;
    const q = "SELECT * FROM appointment WHERE dr_id = ?";
    db.query(q, doctorId, (err, results) => {
        if (err) return res.json(err);
        return res.json(results);
    })
})

// Get appointment by u_id
app.get('/appointments/user/:id', (req, res) => {
    const userId = req.params.id;
    const q = "SELECT * FROM appointment WHERE u_id = ?";
    db.query(q, userId, (err, results) => {
        if (err) return res.json(err);
        return res.json(results);
    })
})

// book appointment
app.post('/appointment', (req, res) => {
    const q = "INSERT INTO appointment (`u_id`, `dr_id`, `a_id`, `appointment_date`, `s_id`,`service_name`, `owner_name`, `owner_email`, `contact`, `fees`) VALUES (?)"

    const values = [
        req.body.u_id,
        req.body.dr_id,
        req.body.a_id,
        req.body.appointment_date,
        req.body.s_id,
        req.body.service_name,
        req.body.owner_name,
        req.body.owner_email,
        req.body.contact,
        req.body.fee,
    ]

    db.query(q, [values], (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Appointment added')
        return res.json('Appointment added successfully!')
    })
})

// delete appointment by appointment id
app.delete("/appointment/:id", (req, res) => {
    const appointmentId = req.params.id;
    const q = "DELETE FROM appointment WHERE a_id = ?"

    db.query(q, appointmentId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Appointment deleted.')
        return res.json('appointment deleted successfully!')
    })
})

// delete appointment by doctor id
app.delete("/appointment/doctor/:id", (req, res) => {
    const doctorId = req.params.id;
    const q = "DELETE FROM appointment WHERE dr_id = ?"

    db.query(q, doctorId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Appointment deleted.')
        return res.json('appointment deleted successfully!')
    })
})

// delete appointment by user id
app.delete("/appointment/user/:id", (req, res) => {
    const userId = req.params.id;
    const q = "DELETE FROM appointment WHERE u_id = ?"

    db.query(q, userId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Doctor deleted.')
        return res.json('appointment deleted successfully!')
    })
})
// ----------------------------------------------------------------------------


// STORE QUERY ------------------------------------------------------------------------
// Get all product
app.get('/products', (req, res) => {
    const q = 'SELECT * FROM petfoodmedistore';

    db.query(q, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

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

// Add product
app.post("/product", (req, res) => {
    const q = "INSERT INTO petfoodmedistore (`product_id`, `product_type`, `product_name`, `product_price`, `product_description`, `product_image`) VALUES (?)"

    const values = [
        req.body.product_id,
        req.body.product_type,
        req.body.product_name,
        req.body.product_price,
        req.body.product_description,
        req.body.product_image,
    ]

    db.query(q, [values], (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Product added')
        return res.json('product added successfully!')
    })
})

// Update product by id
app.put("/product/:product_id", (req, res) => {
    const productId = req.params.product_id;
    const { product_name, product_price, product_description } = req.body;

    const q = "UPDATE petfoodmedistore SET product_name = ?, product_price = ?, product_description = ? WHERE product_id = ?";
    db.query(q, [product_name, product_price, product_description, productId], (err, result) => {
        if (err) return res.json(err)

        return res.json('product updated successfully!');
    });
});

// delete product
app.delete("/product/:id", (req, res) => {
    const productId = req.params.id;

    // Delete from the dependent table first
    const qDeleteOrders = "DELETE FROM foodmediorder WHERE product_id = ?";
    db.query(qDeleteOrders, productId, (err, orderResult) => {
        if (err) {
            // Handle error from the first query
            return res.json(err);
        }

        // Now, delete from the main table
        const qDeleteProduct = "DELETE FROM petfoodmedistore WHERE product_id = ?";
        db.query(qDeleteProduct, productId, (err, productResult) => {
            if (err) {
                // Handle error from the second query
                return res.json(err);
            }

            console.log('Product deleted.');
            return res.json('Product deleted successfully!');
        });
    });
});

// ----------------------------------------------------------------------------

// ORDER QUERY ----------------------------------------------------------------------

// Get all order
app.get('/orders', (req, res) => {
    const q = 'SELECT * FROM foodmediorder';

    db.query(q, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

// Get order by customer_id
app.get("/order/customer/:id", (req, res) => {
    const customerId = req.params.id;
    const q = "SELECT * FROM foodmediorder WHERE customer_id = ?"
    db.query(q, customerId, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})

// Update order status route
app.put('/order/:orderId', (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    // Find the order by ID and update the status
    const q = "UPDATE foodmediorder SET status = ? WHERE order_id = ?"
    db.query(q, [status, orderId], (err, result) => {
        if (err) return res.json(err);
        return res.json('Status updated successfully!')
    })

});

// Add order
app.post("/order", (req, res) => {
    const q = "INSERT INTO foodmediorder (`order_id`,`product_id`,`customer_id`,`payment_id`,  `orderer_name`, `orderer_email`, `orderer_contact`,  `order_date`, `shipping_address`, `status`) VALUES (?)"

    const values = [
        req.body.order_id,
        req.body.product_id,
        req.body.customer_id,
        req.body.payment_id,
        req.body.orderer_name,
        req.body.orderer_email,
        req.body.orderer_contact,
        req.body.order_date,
        req.body.shipping_address,
        req.body.status,
    ]

    db.query(q, [values], (err, result) => {
        if (err) return res.json(err)
        return res.json('order added successfully!')
    })
})

// delete order by orderId
app.delete("/order/:id", (req, res) => {
    const orderId = req.params.id;
    const q = "DELETE FROM foodmediorder WHERE order_id = ?"

    db.query(q, orderId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('order deleted.')
        return res.json('order deleted successfully!')
    })
})

// delete order by userId
app.delete("/order/user/:id", (req, res) => {
    const customerId = req.params.id;
    const q = "DELETE FROM foodmediorder WHERE customer_id = ?"

    db.query(q, customerId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('order deleted.')
        return res.json('order deleted successfully!')
    })
})
// ----------------------------------------------------------------------------


// QUERY FOR ADAPTION --------------------------------------------------------
// get all adaption post
app.get("/adaptions", (req, res) => {
    const q = "SELECT * FROM adaptationpost"
    db.query(q, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})

// get adaption by adoption id
app.get("/adaption/:id", (req, res) => {
    const adaptionId = req.params.id;
    const q = "SELECT * FROM adaptationpost WHERE a_id = ?"
    db.query(q, adaptionId, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})

// get adaption by user id
app.get("/adaption/user/:id", (req, res) => {
    const userId = req.params.id;
    const q = "SELECT * FROM adaptationpost WHERE u_id = ?"
    db.query(q, userId, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})

// add adaption post
app.post("/adaption", (req, res) => {
    const q = "INSERT INTO adaptationpost (`a_id`, `u_id`, `title`, `details`, `img_URL`, `img_URL2`, `img_URL3`, `created_date`) VALUES (?)"

    const values = [
        req.body.a_id,
        req.body.u_id,
        req.body.title,
        req.body.details,
        req.body.img_URL,
        req.body.img_URL2,
        req.body.img_URL3,
        req.body.created_date,
    ]

    db.query(q, [values], (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Adaption post added')
        return res.json('adaption post added successfully!')
    })
})

// delete adaption by a_id
app.delete("/adoption/:id", (req, res) => {
    const adoptionId = req.params.id;
    const q = "DELETE FROM adaptationpost WHERE a_id = ?"

    db.query(q, adoptionId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Adoption deleted.')
        return res.json('adoption post deleted successfully!')
    })
})

// delete adaption by u_id
app.delete("/adoption/user/:id", (req, res) => {
    const userId = req.params.id;
    const q = "DELETE FROM adaptationpost WHERE u_id = ?"

    db.query(q, userId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Adoption deleted.')
        return res.json('adoption post deleted successfully!')
    })
})

// update adoption
app.put("/adoption/:id", (req, res) => {
    const adoptionId = req.params.id;
    const q = "UPDATE adaptationpost SET `title`=?, `details`=? WHERE a_id = ?";

    const values = [
        req.body.title,
        req.body.details,
    ]

    db.query(q, [...values, adoptionId], (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Adoption post Updated.')
        return res.json('adoption post updated successfully!')
    })
})



// ---------------------------------------
// Get adoption comment with adoption_id
// get adaption comment by id
app.get("/adoption/comments/:id", (req, res) => {
    const adaptionId = req.params.id;
    const q = "SELECT * FROM adaptionComments WHERE a_id = ?"
    db.query(q, adaptionId, (err, data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})

// delete adoption comment by userId
app.delete("/adoption/comments/:id", (req, res) => {
    const userId = req.params.id;
    const q = "DELETE FROM adaptionComments WHERE u_id = ?"

    db.query(q, userId, (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Adoption comment deleted.')
        return res.json('adoption comment post deleted successfully!')
    })
})

// add adaption comment
app.post("/comment", (req, res) => {
    const q = "INSERT INTO adaptionComments (`c_id`, `a_id`, `u_id`, `c_name`, `c_img_URL`, `c_body`, `c_date`) VALUES (?)"

    const values = [
        req.body.c_id,
        req.body.a_id,
        req.body.u_id,
        req.body.c_name,
        req.body.c_img_URL,
        req.body.c_body,
        req.body.c_date,
    ]

    db.query(q, [values], (err, data) => {
        if (err) return res.json(err)
        if (data) console.log('Adaption post added')
        return res.json('adaption post added successfully!')
    })
})

// ----------------------------------------------------------------------------

app.listen(8800, () => {
    console.log('Connect to backend !')
})

