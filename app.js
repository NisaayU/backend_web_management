require('dotenv').config()

const express = require('express')
const cors = require('cors');
const { db } = require('./db/db');
const { readdirSync } = require('fs')
const { seedDefaultUsers } = require('./controllers/user');
const app = express()


const PORT = process.env.PORT

// middlewares
app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://afcaa306-8731-44cf-9818-91461b831ea0-00-b0ch5nd4x1em.sisko.replit.dev',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// routes
readdirSync('./routes').map((route) =>
    app.use('/api/v1', require('./routes/' + route)))

const server = async () => {
    await db(); 
    await seedDefaultUsers(); 
    app.listen(PORT, () => {
        console.log('Now you in PORT:', PORT)
    })
}

server()