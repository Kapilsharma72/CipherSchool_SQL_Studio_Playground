const express = require('express');
const queryController = require('../controllers/queryController');
const { body } = require('express-validator');

const router = express.Router();

const validateQuery = [
  body('query')
    .trim()
    .notEmpty()
    .withMessage('SQL query is required')
    .isString()
    .withMessage('Query must be a string')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Query must be between 1 and 10,000 characters')
    .escape() ];

router.post('/execute', validateQuery, queryController.execute);

router.post('/validate', validateQuery, queryController.validate);

module.exports = router;
