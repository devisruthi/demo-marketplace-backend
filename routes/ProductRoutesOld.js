const express = require('express');
const router = express.Router();
const ProductModel = require('../models/ProductModel.js');

// Product Routes
router.get(
    '/',
    (req, res) => {
        ProductModel
            .find()
            .then(
                (document) => {
                    res.send(document);
                }
            )
            .catch(
                (error) => {
                    console.log('error', error);
                }
            )
    }
)

router.post(
    '/', (req, res) => {
        const formData = {
            brand: 'Google',
            model: 'Pixel 2',
            price: 1150
        };

        const newProduct = new ProductModel(formData);

        newProduct
            .save()
            .then(
                (document) => {
                    res.send(document);
                }
            )
            .catch(
                (error) => {
                    console.log('error', error)
                    res.send({
                        'error': error
                    })
                }
            )
    }
)

module.exports = router;