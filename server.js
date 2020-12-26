// Import the main express file as a function
const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const expressFormData = require('express-form-data');
const ProductRoutes = require('./routes/ProductRoutes');
const UserRoutes = require('./routes/UserRoutes');
const initPassportStrategy = require('./passport-config');
require('dotenv').config();


// Invoke express
const server = express();
server.use(cors());
server.use(bodyParser.urlencoded({extended: false}));

// configure express to read body of HTTP request
server.use(bodyParser.json());

// configure express to read file attachments
server.use(expressFormData.parse());

// configure express to use passport
server.use(passport.initialize());
// configure passport to use passport-jwt
initPassportStrategy(passport);


cloudinary.config(
    {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    }
)


const dbString = process.env.DB_STRING;

mongoose
    .connect(dbString, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(
        () => {
            console.log('db is connected')
        }
    )
    .catch(
        (error) => {
            console.log('db is NOT connected. An error occured.', error)
        }
    )


// Users route
server.use(
    '/users',
    UserRoutes
);

// Products
server.use(
    '/products',
    passport.authenticate('jwt', {session: false}),
    ProductRoutes
);


// Sample route with parameters
// server.get(
//     '/:pagename', // http://www.apple.com/
//     (req, res) => {
//         // res.send({
//         //     filter: req.query.filter,
//         //     brand: req.query.brand
//         // })
//         res.send("<h1> Welcome to " + req.params.pagename + "</h1>")
//     }
// );

server.get(
    '*',
    (req, res) => {
        res.send('<h1>404</h1>')
    }
);

// Connects a port number on the server
server.listen(
    3001, 
    ()=>{
        console.log('server is running on http://localhost:3001');
    }
);