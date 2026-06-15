const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    getProducts,
    getProduct,
    createProduct,
    createProductWithMedia,
    updateProduct,
    deleteProduct,
    incrementViewCount,
    uploadProductImage
} = require('../controllers/productController');

// Single image upload middleware
const singleUpload = require('../middleware/uploadSingle');

// GET routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// POST routes
router.post('/', singleUpload.single('image'), createProduct);
router.post('/media', upload, createProductWithMedia);
router.post('/:id/view', incrementViewCount);
router.post('/:id/upload-image', singleUpload.single('image'), uploadProductImage);

// PUT routes
router.put('/:id', singleUpload.single('image'), updateProduct);

// DELETE routes
router.delete('/:id', deleteProduct);

module.exports = router;