const express = require('express');
const learningAssistantController = require('../controllers/learningAssistantController');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,   max: 10,   message: 'Too many requests, please try again after 5 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const sanitizeInput = (value) => {
  if (!value) return '';
    return String(value).replace(/[<>]/g, '');
};

const validateRequest = [
    protect,
  
    body('userQuestion')
    .trim()
    .notEmpty().withMessage('Question is required')
    .isLength({ max: 1000 }).withMessage('Question must be less than 1000 characters')
    .customSanitizer(sanitizeInput),
    
  body('conversation')
    .optional({ checkFalsy: true })
    .isArray().withMessage('Conversation must be an array'),
    
  body('conversation.*.role')
    .optional()
    .isIn(['user', 'assistant']).withMessage('Invalid role in conversation'),
    
  body('conversation.*.content')
    .optional()
    .isString().withMessage('Content must be a string')
    .customSanitizer(sanitizeInput)
    .trim()
    .notEmpty().withMessage('Content cannot be empty')
    .isLength({ max: 10000 }).withMessage('Content must be less than 10000 characters'),
    
  body('context')
    .optional()
    .isObject().withMessage('Context must be an object'),
    
  body('context.assignment')
    .optional()
    .isObject().withMessage('Assignment context must be an object'),
    
  body('context.currentQuery')
    .optional()
    .isString().withMessage('Current query must be a string')
    .customSanitizer(sanitizeInput),
    
  body('context.conversation')
    .optional()
    .isArray()
    .withMessage('Conversation must be an array')
    .isLength({ max: 20 })
    .withMessage('Conversation history is too long')
];

router.post('/', apiLimiter, validateRequest, learningAssistantController.getHint);

module.exports = router;
