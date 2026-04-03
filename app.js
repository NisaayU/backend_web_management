const express = require('express')
const cors = require('cors');
const { db } = require('./db/db');
const { readdirSync } = require('fs')
const { seedDefaultUsers } = require('./controllers/user');
const app = express()

require('dotenv').config()

const PORT = process.env.PORT

// middlewares
app.use(express.json());
app.use(cors());

// routes
readdirSync('./routes').map((route) =>
    app.use('/api/v1', require('./routes/' + route)))

const server = async () => {
    await db(); // tunggu DB konek dulu
    await seedDefaultUsers(); // baru seed user
    app.listen(PORT, () => {
        console.log('Now you in PORT:', PORT)
    })
}

server()