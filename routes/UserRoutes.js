const express = require('express');
const passport = require('passport');
const router = express.Router();
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const UserModel = require('../models/UserModel.js');

const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;

router.post(
    '/register',           // users/register
    (req, res) => {
        const formData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password
        };

        const newUserModel = new UserModel(formData);
    
        /*
         * Here we check for (A) uniques emails,
         * (B) prepare password for registration, and
         * (C) upload image to Cloudinary if provided
         */
    
        /* Part (A) */
        // 1. Search the database for a matching email address
        UserModel
        .findOne({ email: formData.email })
        .then(
            async (document) => {

                // 2.1. If there is a match, reject the registration
                if(document) {
                    res.send({ message: "An account with that email already exists." })
                }

                // 2.2. If there is not match, proceed to Part (B)
                else {
                    /* Part (C) */
                    // 1. Check if image is included
                    if(Object.values(req.files).length>0){
                        // 1.1 If included, upload to Cloudinary
                        const files = Object.values(req.files);
                        await cloudinary.uploader.upload(
                            // location of file
                            files[0].path, 
                            // callback for when file is uploaded
                            (error, cloudinaryResult) => {
                                if(error) {
                                    console.log('error from cloudinary', error)
                                    res.send({ error: error })
                                }
                                // 1.2 Take the image url and append it to newUserModel
                                console.log(cloudinaryResult);
                                newUserModel.photoUrl  = cloudinaryResult.url;
                            }
                        )
                    }

                    /* Part (B) */
                    // 1. Generate a salt
                    bcrypt.genSalt(
                        (err, salt) => {

                            // 2. Take salt and user's password to hash password
                            bcrypt.hash(
                                formData.password,
                                salt,
                                (err, encryptedPassword) => {
                                    // 3. Replace the user's password with the hash
                                    newUserModel.password = encryptedPassword;

                                    // 4. Save to the database
                                    newUserModel
                                    .save()
                                    .then(
                                        (document) => {
                                            res.send(document)
                                        }
                                    )
                                    .catch(
                                        (error) => {
                                            console.log('error', error);
                                            res.send({'error': error})
                                        }
                                    )
                                }
                            )
                        }
                    )
                }
            }
        )
        .catch(
            (err) => {
                res.send({err: "Something went wrong."})
            }
        )
    }
);

router.post(
    '/login',           // users/login
    (req, res) => {
        // 1. Capture the email and password
        const formData = {
            email: req.body.email,
            password: req.body.password
        }
        // 2. Find a match in the database for email
        UserModel
        .findOne({ email: formData.email})
        .then(
            (document) => {         
                if(document) {
                    // 2.1. If email has been found, check their password
                    bcrypt.compare(
                        formData.password,
                        document.password
                    )
                    .then(
                        (passwordMatch) => {

                            if(passwordMatch === true) {
                                // 3.1. If their password is correct, generate the json web token
                                const payload = {
                                    id: document._id,
                                    email: document.email
                                }
                                jsonwebtoken.sign(
                                    payload,
                                    jwtSecret,
                                    (error, theToken) => {

                                        if(error) {
                                            res.send({ message: "Something went wrong"})
                                        }

                                        // 4. Send the json web token to the client
                                        res.send({ theToken: theToken })
                                    }
                                )
                            }
                            else {
                                // 3.2 If password is incorrect, reject the login
                                res.send({ message: "Wrong email or password"});
                            }
                        }
                    )
                    .catch(
                        (error) => {
                            res.send({ message: "Something went wrong" })
                        }
                    )
                } 
                else {
                    // 2.2 If no email match, reject the login
                    res.send({ message: "Wrong email or password"});
                }
            }
        )
    }
)

router.get(
    '/',               // https://www.app.com/users
    (req, res) => {
        UserModel
        .find()
        .then(
            (document) => {
                console.log('user', document);
                res.send(document);
            }
        )
        .catch(
            (error) => {
                console.log('error', error)
            }
        )
    }
);

router.get(
    '/profile',
    passport.authenticate('jwt', {session: false}),
    (req, res) => {
        UserModel
        .findById(req.user.id)
        .then(
            (document) => {
                res.send(document)
            }
        )
        .catch(
            (error) => {
                res.send({
                    message: "error occured " + error
                })
            }
        )

    }
)

router.put(
    '/update',           // users/update
    passport.authenticate('jwt', {session: false}),
    async (req, res) => {
        const formData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            photoUrl: req.body.photoUrl
        };
    
        /*
         * Here we check for (B) prepare password for registration, 
         * and (C) upload image to Cloudinary if provided
         */
    
        /* Part (C) */
        // 1. Check if image is included
        if(Object.values(req.files).length>0){
            // 1.1 If included, upload to Cloudinary
            const files = Object.values(req.files);
            await cloudinary.uploader.upload(
                // location of file
                files[0].path, 
                // callback for when file is uploaded
                (error, cloudinaryResult) => {
                    if(error) {
                        console.log('error from cloudinary', error)
                        res.send({ error: error })
                    }
                    // 1.2 Take the image url and append it to newUserModel
                    console.log(cloudinaryResult);
                    formData.photoUrl  = cloudinaryResult.url;
                }
            )
        }


        // If user wants password change 

        if(formData.password.length > 0) {
            /* Part (B) */
            // 1. Generate a salt
            bcrypt.genSalt(
                (err, salt) => {

                    // 2. Take salt and user's password to hash password
                    bcrypt.hash(
                        formData.password,
                        salt,
                        (err, encryptedPassword) => {
                            // 4. Save to the database
                            UserModel
                            .findByIdAndUpdate(
                                req.user.id,
                                {
                                    $set: {
                                        firstName: formData.firstName,
                                        lastName: formData.lastName,
                                        email: formData.email,
                                        password: encryptedPassword,
                                        photoUrl: formData.photoUrl

                                    }
                                }
                            )
                            .then(
                                (document) => {
                                    res.send(document)
                                }
                            )
                            .catch(
                                (error) => {
                                    console.log('error', error);
                                    res.send({'error': error})
                                }
                            )
                        }
                    )
                }
            )
        }

        // If user does want password change
        else {
            UserModel
            .findByIdAndUpdate(
                req.user.id,
                {
                    $set: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        photoUrl: formData.photoUrl

                    }
                },
                //{ new: true }
            )
            .then(
                (document) => {
                    res.send(document)
                }
            )
            .catch(
            (error) => {
                console.log('error', error);
                res.send({'error': error})
            }
        )
        }
    }
);


module.exports = router;